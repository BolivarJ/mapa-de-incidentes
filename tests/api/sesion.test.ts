import { beforeEach, describe, expect, it, vi } from "vitest";

const { getAuthAdmin, verifyIdToken, createSessionCookie } = vi.hoisted(() => ({
  getAuthAdmin: vi.fn(),
  verifyIdToken: vi.fn(),
  createSessionCookie: vi.fn(),
}));

vi.mock("@/lib/firebase-admin", () => ({ getAuthAdmin }));

const { POST, DELETE } = await import("../../app/api/sesion/route");

function solicitudSesion(body: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/sesion", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("/api/sesion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getAuthAdmin.mockReturnValue({ verifyIdToken, createSessionCookie });
    verifyIdToken.mockResolvedValue({ uid: "vecino-1", auth_time: Math.floor(Date.now() / 1000) });
    createSessionCookie.mockResolvedValue("cookie-firmada-de-prueba");
  });

  it("verifica el token y establece una cookie HttpOnly de corta duración", async () => {
    const respuesta = await POST(solicitudSesion({ idToken: "token-valido" }));
    const cookie = respuesta.headers.get("set-cookie") ?? "";

    expect(respuesta.status).toBe(204);
    expect(verifyIdToken).toHaveBeenCalledWith("token-valido", true);
    expect(createSessionCookie).toHaveBeenCalledWith("token-valido", { expiresIn: 432_000_000 });
    expect(cookie).toContain("__session=cookie-firmada-de-prueba");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Strict");
    expect(cookie).toContain("Max-Age=432000");
  });

  it("rechaza solicitudes de otro origen", async () => {
    const respuesta = await POST(
      solicitudSesion({ idToken: "token-valido" }, "https://sitio-ajeno.test"),
    );

    expect(respuesta.status).toBe(403);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("rechaza cuerpo inválido sin llamar a Firebase", async () => {
    const respuesta = await POST(solicitudSesion({ idToken: "" }));

    expect(respuesta.status).toBe(400);
    expect(verifyIdToken).not.toHaveBeenCalled();
  });

  it("rechaza tokens inválidos sin exponer detalles del proveedor", async () => {
    verifyIdToken.mockRejectedValue(new Error("token privado inválido"));

    const respuesta = await POST(solicitudSesion({ idToken: "token-invalido" }));

    expect(respuesta.status).toBe(401);
    expect(JSON.stringify(await respuesta.json())).not.toContain("token privado");
  });

  it("rechaza tokens cuya autenticación no sea reciente", async () => {
    verifyIdToken.mockResolvedValue({ uid: "vecino-1", auth_time: 1 });

    const respuesta = await POST(solicitudSesion({ idToken: "token-antiguo" }));

    expect(respuesta.status).toBe(401);
    expect(createSessionCookie).not.toHaveBeenCalled();
  });

  it("elimina la cookie de sesión al cerrar sesión", async () => {
    const respuesta = await DELETE(
      new Request("http://localhost/api/sesion", {
        method: "DELETE",
        headers: { origin: "http://localhost" },
      }),
    );

    expect(respuesta.status).toBe(204);
    expect(respuesta.headers.get("set-cookie")).toContain("Max-Age=0");
  });
});
