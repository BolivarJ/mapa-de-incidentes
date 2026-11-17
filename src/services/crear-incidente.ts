import type { RepositorioCreacionIncidente } from "@/repositories/incidentes";
import type { NuevoIncidente } from "@/schemas/incidente";

export async function crearIncidente(
  repo: RepositorioCreacionIncidente,
  uid: string,
  nuevo: NuevoIncidente,
) {
  return repo.crear(nuevo, uid);
}
