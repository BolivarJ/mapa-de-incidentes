import { del, head } from "@vercel/blob";
import { z } from "zod";
import { ErrorApi, errorDeValidacion } from "@/lib/errores";
import { json, manejar } from "@/lib/http";
import { esTipoFoto, TAMANO_MAXIMO_FOTO } from "@/lib/foto";
import { obtenerSesionActual } from "@/lib/sesion";
import { repositorioIncidentesFirestore } from "@/repositories/incidentes-firestore";

export const runtime = "nodejs";

type Contexto = { params: Promise<{ id: string }> };
const idIncidenteSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
const rutaFotoSchema = z.strictObject({ pathname: z.string().min(1).max(256) });

function origenValido(request: Request): boolean {
  const origen = request.headers.get("origin");
  return Boolean(origen && origen === new URL(request.url).origin);
}

function rutaFotoPropia(pathname: string, id: string): boolean {
  const prefijo = `incidentes/${id}/`;
  if (!pathname.startsWith(prefijo)) return false;
  return /^[A-Za-z0-9_-]{1,80}\.(?:jpe?g|png|webp)$/i.test(pathname.slice(prefijo.length));
}

function urlPublicaBlob(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.protocol === "https:" && parsed.hostname.endsWith(".public.blob.vercel-storage.com")
    );
  } catch {
    return false;
  }
}

async function validarSesion(request: Request, accion: string): Promise<string> {
  if (!origenValido(request)) throw new ErrorApi(403, "Origen no permitido");
  const sesion = await obtenerSesionActual();
  if (!sesion) throw new ErrorApi(401, `Inicia sesión para ${accion} una foto`);
  return sesion.uid;
}

async function leerRutaFoto(request: Request): Promise<string> {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorApi(400, "Datos no válidos");
  }
  const resultado = rutaFotoSchema.safeParse(cuerpo);
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  return resultado.data.pathname;
}

async function verificarBlob(pathname: string, id: string) {
  if (!rutaFotoPropia(pathname, id)) throw new ErrorApi(400, "Ruta de foto no válida");
  const blob = await head(pathname);
  const valido =
    blob.pathname === pathname && blob.size <= TAMANO_MAXIMO_FOTO && esTipoFoto(blob.contentType);
  if (!valido) {
    throw new ErrorApi(400, "La foto debe ser JPEG, PNG o WebP de hasta 5 MB");
  }
  return blob;
}

async function asociarFoto(request: Request, id: string, uid: string) {
  const pathname = await leerRutaFoto(request);
  const blob = await verificarBlob(pathname, id);
  const actualizacion = await repositorioIncidentesFirestore.actualizarFoto(id, uid, blob.url);
  if (!actualizacion.ok) throw new ErrorApi(404, "Reporte no encontrado");
  if (actualizacion.urlAnterior && actualizacion.urlAnterior !== blob.url) {
    if (urlPublicaBlob(actualizacion.urlAnterior)) await del(actualizacion.urlAnterior);
  }
  return blob.url;
}

async function quitarFoto(id: string, uid: string): Promise<void> {
  const eliminacion = await repositorioIncidentesFirestore.eliminarFoto(id, uid);
  if (!eliminacion.ok) throw new ErrorApi(404, "Reporte no encontrado");
  if (eliminacion.fotoUrl && urlPublicaBlob(eliminacion.fotoUrl)) await del(eliminacion.fotoUrl);
}

export function PATCH(request: Request, contexto: Contexto): Promise<Response> {
  return manejar(async (request) => {
    const uid = await validarSesion(request, "adjuntar");
    const { id } = await contexto.params;
    if (!idIncidenteSchema.safeParse(id).success) throw new ErrorApi(404, "Reporte no encontrado");
    const fotoUrl = await asociarFoto(request, id, uid);
    return json({ fotoUrl }, { headers: { "Cache-Control": "no-store" } });
  })(request);
}

export function DELETE(request: Request, contexto: Contexto): Promise<Response> {
  return manejar(async (request) => {
    const uid = await validarSesion(request, "quitar");
    const { id } = await contexto.params;
    if (!idIncidenteSchema.safeParse(id).success) throw new ErrorApi(404, "Reporte no encontrado");
    await quitarFoto(id, uid);
    return json({ fotoUrl: null }, { headers: { "Cache-Control": "no-store" } });
  })(request);
}
