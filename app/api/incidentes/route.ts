import { repositorioIncidentesFirestore } from "@/repositories/incidentes-firestore";
import { consultaAreaSchema, parametros } from "@/schemas/consulta";
import { errorDeValidacion, ErrorApi } from "@/lib/errores";
import { json, manejar } from "@/lib/http";
import { obtenerSesionActual } from "@/lib/sesion";
import { nuevoIncidenteSchema } from "@/schemas/incidente";
import type { Incidente, IncidentePublico } from "@/schemas/constantes";
import { crearIncidente } from "@/services/crear-incidente";
import { listarPorArea } from "@/services/incidentes";

export const runtime = "nodejs";

function incidenteParaPublico({ uid: _uid, ...publico }: Incidente): IncidentePublico {
  return publico;
}

/** GET /api/incidentes?norte=&sur=&este=&oeste=&categoria=&estado=&desde= (lectura pública). */
export const GET = manejar(async (request) => {
  const busqueda = new URL(request.url).searchParams;
  const resultado = consultaAreaSchema.safeParse(parametros(busqueda));
  if (!resultado.success) throw errorDeValidacion(resultado.error);
  const items = (await listarPorArea(repositorioIncidentesFirestore, resultado.data)).map(
    incidenteParaPublico,
  );
  return json(
    { items, siguienteCursor: null },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
});

export const POST = manejar(async (request) => {
  const origen = request.headers.get("origin");
  if (!origen || origen !== new URL(request.url).origin) {
    throw new ErrorApi(403, "Origen no permitido");
  }

  const sesion = await obtenerSesionActual();
  if (!sesion) throw new ErrorApi(401, "Inicia sesión para enviar un reporte");

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorApi(400, "Datos no válidos");
  }

  const resultado = nuevoIncidenteSchema.safeParse(cuerpo);
  if (!resultado.success) throw errorDeValidacion(resultado.error);

  const creacion = await crearIncidente(repositorioIncidentesFirestore, sesion.uid, resultado.data);
  if (!creacion.ok) {
    throw new ErrorApi(429, "Has alcanzado el límite de 5 reportes por día");
  }

  const item = creacion.incidente;
  return json({ item }, { status: 201, headers: { "Cache-Control": "no-store" } });
});
