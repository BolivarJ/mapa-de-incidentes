import { beforeEach, describe, expect, it, vi } from "vitest";

const { cookies, getAuthAdmin, verifySessionCookie } = vi.hoisted(() => ({
  cookies: vi.fn(),
  getAuthAdmin: vi.fn(),
  verifySessionCookie: vi.fn(),
}));

vi.mock("next/headers", () => ({ cookies }));
vi.mock("@/lib/firebase-admin", () => ({ getAuthAdmin }));

describe("obtenerSesionActual", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookies.mockResolvedValue({ get: vi.fn().mockReturnValue(undefined) });
    getAuthAdmin.mockReturnValue({ verifySessionCookie });
  });

  it("devuelve null si no hay cookie", async () => {
    const { obtenerSesionActual } = await import("@/lib/sesion");

    await expect(obtenerSesionActual()).resolves.toBeNull();
    expect(verifySessionCookie).not.toHaveBeenCalled();
  });

  it("verifica la cookie con comprobación de revocación y devuelve solo datos mínimos", async () => {
    cookies.mockResolvedValue({ get: vi.fn().mockReturnValue({ value: "cookie-firmada" }) });
    verifySessionCookie.mockResolvedValue({
      uid: "vecino-1",
      email: "vecino@example.test",
      admin: true,
    });
    const { obtenerSesionActual } = await import("@/lib/sesion");

    await expect(obtenerSesionActual()).resolves.toEqual({
      uid: "vecino-1",
      email: "vecino@example.test",
    });
    expect(verifySessionCookie).toHaveBeenCalledWith("cookie-firmada", true);
  });

  it("trata una cookie inválida o revocada como sesión ausente", async () => {
    cookies.mockResolvedValue({ get: vi.fn().mockReturnValue({ value: "cookie-invalida" }) });
    verifySessionCookie.mockRejectedValue(new Error("error interno del proveedor"));
    const { obtenerSesionActual } = await import("@/lib/sesion");

    await expect(obtenerSesionActual()).resolves.toBeNull();
  });
});
