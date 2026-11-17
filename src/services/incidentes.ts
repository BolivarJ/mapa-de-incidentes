import type { RepositorioIncidentes } from "@/repositories/incidentes";
import type { ConsultaArea } from "@/schemas/consulta";
import type { Incidente } from "@/schemas/constantes";
import { filtrarIncidentes } from "./bbox";

export async function listarPorArea(
  repo: RepositorioIncidentes,
  consulta: ConsultaArea,
): Promise<Incidente[]> {
  const { norte, sur, este, oeste, categoria, estado, desde, limite } = consulta;
  const candidatos = await repo.listarPorLatitud(sur, norte, limite);
  return filtrarIncidentes(candidatos, { norte, sur, este, oeste }, { categoria, estado, desde });
}
