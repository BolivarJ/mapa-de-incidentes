import { z } from "zod";
import { ErrorApi } from "@/lib/errores";
import { json, manejar } from "@/lib/http";
import { obtenerSesionActual } from "@/lib/sesion";
import { repositorioIncidentesFirestore } from "@/repositories/incidentes-firestore";

export const runtime = "nodejs";

const idIncidenteSchema = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);

export function POST(
  request: Request,
  contexto: { params: Promise<{ id: string }> },
): Promise<Response> {
  return manejar(async (request) => {
    const origen = request.headers.get("origin");
    if (!origen || origen !== new URL(request.url).origin) {
      throw new ErrorApi(403, "Origen no permitido");
    }
    const sesion = await obtenerSesionActual();
    if (!sesion) throw new ErrorApi(401, "Inicia sesión para apoyar un reporte");
    const { id } = await contexto.params;
    if (!idIncidenteSchema.safeParse(id).success) throw new ErrorApi(404, "Reporte no encontrado");

    const resultado = await repositorioIncidentesFirestore.apoyar(id, sesion.uid);
    if (!resultado.ok) {
      if (resultado.motivo === "ya-apoyado") throw new ErrorApi(409, "Ya apoyaste este reporte");
      throw new ErrorApi(404, "Reporte no encontrado");
    }
    return json(
      { apoyos: resultado.apoyos },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  })(request);
}
