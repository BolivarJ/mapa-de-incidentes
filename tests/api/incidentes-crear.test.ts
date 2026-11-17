import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerSesionActual, crear } = vi.hoisted(() => ({
  obtenerSesionActual: vi.fn(),
  crear: vi.fn(),
}));

vi.mock("@/lib/sesion", () => ({ obtenerSesionActual }));
vi.mock("@/repositories/incidentes-firestore", () => ({
  repositorioIncidentesFirestore: {
    listarPorLatitud: vi.fn(),
    obtener: vi.fn(),
    historial: vi.fn(),
    crear,
  },
}));

const { POST } = await import("../../app/api/incidentes/route");

const datos = {
  categoria: "hueco",
  descripcion: "Hueco profundo frente al parque del barrio",
  lat: 6.2442,
  lng: -75.5812,
};

function solicitud(body: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/incidentes", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/incidentes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerSesionActual.mockResolvedValue({ uid: "uid-verificado", email: "vecino@example.test" });
    crear.mockResolvedValue({ id: "incidente-nuevo", ...datos, uid: "uid-verificado" });
  });

  it("exige una sesión verificada antes de crear", async () => {
    obtenerSesionActual.mockResolvedValue(null);

    const respuesta = await POST(solicitud(datos));

    expect(respuesta.status).toBe(401);
    expect(crear).not.toHaveBeenCalled();
  });

  it("rechaza solicitudes de otro origen", async () => {
    const respuesta = await POST(solicitud(datos, "https://sitio-ajeno.test"));

    expect(respuesta.status).toBe(403);
    expect(obtenerSesionActual).not.toHaveBeenCalled();
    expect(crear).not.toHaveBeenCalled();
  });

  it("valida datos estrictos y rechaza campos adicionales", async () => {
    const respuesta = await POST(solicitud({ ...datos, uid: "uid-falso" }));

    expect(respuesta.status).toBe(400);
    expect(crear).not.toHaveBeenCalled();
  });

  it("usa el uid de la sesión, devuelve 201 y no filtra datos de sesión", async () => {
    const respuesta = await POST(solicitud(datos));

    expect(respuesta.status).toBe(201);
    expect(crear).toHaveBeenCalledWith(datos, "uid-verificado");
    expect(await respuesta.json()).toEqual({
      item: { id: "incidente-nuevo", ...datos, uid: "uid-verificado" },
    });
    expect(respuesta.headers.get("cache-control")).toBe("no-store");
  });
});
