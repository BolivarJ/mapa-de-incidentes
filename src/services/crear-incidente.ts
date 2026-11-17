import type {
  RepositorioCreacionIncidente,
  ResultadoCreacionIncidente,
} from "@/repositories/incidentes";
import type { NuevoIncidente } from "@/schemas/incidente";

export async function crearIncidente(
  repo: RepositorioCreacionIncidente,
  uid: string,
  nuevo: NuevoIncidente,
): Promise<ResultadoCreacionIncidente> {
  return repo.crear(nuevo, uid);
}
