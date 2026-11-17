import "server-only";
import type { RepositorioReportesUsuario } from "@/repositories/incidentes";

export function listarReportesUsuario(repo: RepositorioReportesUsuario, uid: string) {
  return repo.listarPorUsuario(uid);
}
