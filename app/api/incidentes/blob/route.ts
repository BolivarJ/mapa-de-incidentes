import { handleUpload } from "@vercel/blob/client";
import { z } from "zod";
import { ErrorApi, errorDeValidacion } from "@/lib/errores";
import { json, manejar } from "@/lib/http";
import { TAMANO_MAXIMO_FOTO, TIPOS_FOTO } from "@/lib/foto";
import { obtenerSesionActual } from "@/lib/sesion";
import { repositorioIncidentesFirestore } from "@/repositories/incidentes-firestore";

export const runtime = "nodejs";

const eventoTokenSchema = z.strictObject({
  type: z.literal("blob.generate-client-token"),
  payload: z.strictObject({
    pathname: z.string().min(1).max(256),
    multipart: z.boolean(),
    clientPayload: z.string().min(1).max(128),
  }),
});
const eventoCompletadoSchema = z.strictObject({
  type: z.literal("blob.upload-completed"),
  payload: z.strictObject({
    blob: z.strictObject({
      pathname: z.string().min(1),
      url: z.url(),
      downloadUrl: z.url(),
      contentType: z.string(),
      contentDisposition: z.string(),
      etag: z.string(),
    }),
    tokenPayload: z.string().nullable().optional(),
  }),
});
const eventoSchema = z.discriminatedUnion("type", [eventoTokenSchema, eventoCompletadoSchema]);
const idIncidenteSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

function rutaFotoValida(pathname: string, id: string): boolean {
  const prefijo = `incidentes/${id}/`;
  if (!pathname.startsWith(prefijo)) return false;
  const nombre = pathname.slice(prefijo.length);
  return /^[A-Za-z0-9_-]{1,80}\.(?:jpe?g|png|webp)$/i.test(nombre);
}

async function validarAcceso(request: Request): Promise<string> {
  const origen = request.headers.get("origin");
  if (!origen || origen !== new URL(request.url).origin) {
    throw new ErrorApi(403, "Origen no permitido");
  }
  const sesion = await obtenerSesionActual();
  if (!sesion) throw new ErrorApi(401, "Inicia sesión para subir una foto");
  if (!process.env.BLOB_READ_WRITE_TOKEN) throw new ErrorApi(503, "Almacenamiento no configurado");
  return sesion.uid;
}

async function leerEvento(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorApi(400, "Datos no válidos");
  }
  const resultado = eventoSchema.safeParse(cuerpo);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  return resultado.data;
}

async function validarPropiedad(uid: string, pathname: string, clientPayload: string) {
  const id = idIncidenteSchema.safeParse(clientPayload);
  if (!id.success || !rutaFotoValida(pathname, clientPayload)) {
    throw new ErrorApi(400, "Ruta de foto no válida");
  }
  const incidente = await repositorioIncidentesFirestore.obtener(clientPayload);
  if (!incidente || incidente.uid !== uid) throw new ErrorApi(404, "Reporte no encontrado");
}

async function procesarSubida(request: Request) {
  const resultado = await leerEvento(request);
  if (resultado.type === "blob.upload-completed") {
    const respuesta = await handleUpload({
      request,
      body: resultado,
      onBeforeGenerateToken: async () => {
        throw new ErrorApi(400, "Tipo de evento no válido");
      },
    });
    return json(respuesta, { headers: { "Cache-Control": "no-store" } });
  }

  const uid = await validarAcceso(request);
  const { pathname, clientPayload } = resultado.payload;
  await validarPropiedad(uid, pathname, clientPayload);

  const respuesta = await handleUpload({
    request,
    body: resultado,
    onBeforeGenerateToken: async (rutaSolicitada, payload) => {
      if (payload !== clientPayload || rutaSolicitada !== pathname) {
        throw new ErrorApi(400, "Solicitud de subida no válida");
      }
      return {
        allowedContentTypes: [...TIPOS_FOTO],
        maximumSizeInBytes: TAMANO_MAXIMO_FOTO,
        addRandomSuffix: true,
        allowOverwrite: false,
      };
    },
  });

  return json(respuesta, { headers: { "Cache-Control": "no-store" } });
}

export const POST = manejar(procesarSubida);
