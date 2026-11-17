import { describe, expect, it, vi } from "vitest";
import { INCIDENTES_EJEMPLO } from "@/repositories/incidentes-ejemplo";

// Integración ruta → servicio → repositorio Firestore, con el repositorio simulado.
const { listarPorLatitud } = vi.hoisted(() => ({ listarPorLatitud: vi.fn() }));
vi.mock("@/repositories/incidentes-firestore", () => ({
  repositorioIncidentesFirestore: { listarPorLatitud, obtener: vi.fn(), historial: vi.fn() },
}));
listarPorLatitud.mockImplementation(async () => INCIDENTES_EJEMPLO);

const { GET } = await import("../../app/api/incidentes/route");
const url = (q: string) => new Request(`http://localhost/api/incidentes?${q}`);

describe("GET /api/incidentes", () => {
  it("200: devuelve solo lo del área, filtrando longitud en el servidor", async () => {
    const r = await GET(url("norte=6.3&sur=6.2&este=-75.5&oeste=-75.6&estado=recibido"));
    expect(r.status).toBe(200);
    const cuerpo = (await r.json()) as {
      items: { id: string; uid?: string }[];
      siguienteCursor: null;
    };
    expect(cuerpo.items.map((i) => i.id)).toEqual(["i-004", "i-001"]);
    expect(cuerpo.items.every((item) => !("uid" in item))).toBe(true);
    expect(cuerpo.siguienteCursor).toBeNull();
    expect(listarPorLatitud).toHaveBeenCalledWith(6.2, 6.3, 100);
  });

  it("400: área inválida con detalle por campo", async () => {
    const r = await GET(url("norte=6.1&sur=6.2&este=-75.5&oeste=-75.6"));
    expect(r.status).toBe(400);
    expect(await r.json()).toEqual({
      error: "Datos no válidos",
      detalles: [{ campo: "norte", mensaje: "norte debe ser mayor que sur" }],
    });
  });

  it("400: parámetros desconocidos o categoría inválida", async () => {
    const r = await GET(url("norte=6.3&sur=6.2&este=-75.5&oeste=-75.6&categoria=ovni&admin=1"));
    expect(r.status).toBe(400);
  });

  it("500 sin detalles internos si el repositorio falla", async () => {
    listarPorLatitud.mockRejectedValueOnce(new Error("firestore caído: credenciales xyz"));
    const r = await GET(url("norte=6.3&sur=6.2&este=-75.5&oeste=-75.6"));
    expect(r.status).toBe(500);
    expect(JSON.stringify(await r.json())).not.toMatch(/credenciales/);
  });
});
