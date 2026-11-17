import { describe, expect, it, vi } from "vitest";
import { listarReportesUsuario } from "@/services/mis-reportes";

describe("listarReportesUsuario", () => {
  it("delega al repositorio el uid verificado y no acepta identidad de cliente", async () => {
    const reportes = [{ id: "incidente-1", uid: "uid-sesion" }];
    const repo = { listarPorUsuario: vi.fn().mockResolvedValue(reportes) };

    await expect(listarReportesUsuario(repo, "uid-sesion")).resolves.toEqual(reportes);
    expect(repo.listarPorUsuario).toHaveBeenCalledWith("uid-sesion");
  });
});
