import { beforeEach, describe, expect, it, vi } from "vitest";

const { obtenerSesionActual, apoyar } = vi.hoisted(() => ({
  obtenerSesionActual: vi.fn(),
  apoyar: vi.fn(),
}));

vi.mock("@/lib/sesion", () => ({ obtenerSesionActual }));
vi.mock("@/repositories/incidentes-firestore", () => ({
  repositorioIncidentesFirestore: { apoyar },
}));

const { POST } = await import("../../app/api/incidentes/[id]/apoyo/route");
const contexto = { params: Promise.resolve({ id: "incidente-1" }) };

function solicitud(origin = "http://localhost") {
  return new Request("http://localhost/api/incidentes/incidente-1/apoyo", {
    method: "POST",
    headers: { origin },
  });
}

describe("POST /api/incidentes/[id]/apoyo", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerSesionActual.mockResolvedValue({ uid: "uid-verificado" });
    apoyar.mockResolvedValue({ ok: true, apoyos: 3 });
  });

  it("rechaza origen ajeno y sesión ausente sin escribir", async () => {
    expect((await POST(solicitud("https://sitio-ajeno.test"), contexto)).status).toBe(403);
    obtenerSesionActual.mockResolvedValue(null);

    expect((await POST(solicitud(), contexto)).status).toBe(401);
    expect(apoyar).not.toHaveBeenCalled();
  });

  it("registra el apoyo con el uid de la sesión y devuelve 201 con el total", async () => {
    const respuesta = await POST(solicitud(), contexto);

    expect(respuesta.status).toBe(201);
    expect(apoyar).toHaveBeenCalledWith("incidente-1", "uid-verificado");
    expect(await respuesta.json()).toEqual({ apoyos: 3 });
  });

  it("devuelve 409 si el usuario ya apoyó ese incidente", async () => {
    apoyar.mockResolvedValue({ ok: false, motivo: "ya-apoyado" });

    const respuesta = await POST(solicitud(), contexto);

    expect(respuesta.status).toBe(409);
    expect(await respuesta.json()).toEqual({ error: "Ya apoyaste este reporte" });
  });

  it("devuelve 404 si el incidente no existe", async () => {
    apoyar.mockResolvedValue({ ok: false, motivo: "no-encontrado" });

    expect((await POST(solicitud(), contexto)).status).toBe(404);
  });
});
