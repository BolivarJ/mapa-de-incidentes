import { beforeEach, describe, expect, it, vi } from "vitest";
import { del, head } from "@vercel/blob";

const { obtenerSesionActual, actualizarFoto, eliminarFoto } = vi.hoisted(() => ({
  obtenerSesionActual: vi.fn(),
  actualizarFoto: vi.fn(),
  eliminarFoto: vi.fn(),
}));

vi.mock("@/lib/sesion", () => ({ obtenerSesionActual }));
vi.mock("@/repositories/incidentes-firestore", () => ({
  repositorioIncidentesFirestore: { actualizarFoto, eliminarFoto },
}));
vi.mock("@vercel/blob", () => ({ del: vi.fn(), head: vi.fn() }));

const { PATCH, DELETE } = await import("../../app/api/incidentes/[id]/foto/route");
const contexto = { params: Promise.resolve({ id: "incidente-1" }) };
const blob = {
  pathname: "incidentes/incidente-1/foto.webp",
  url: "https://almacen.public.blob.vercel-storage.com/incidentes/incidente-1/foto.webp",
  size: 1024,
  contentType: "image/webp",
};

function solicitud(metodo: string, body?: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/incidentes/incidente-1/foto", {
    method: metodo,
    headers: { origin, ...(body ? { "content-type": "application/json" } : {}) },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

describe("/api/incidentes/[id]/foto", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerSesionActual.mockResolvedValue({ uid: "uid-verificado" });
    vi.mocked(head).mockResolvedValue(blob as Awaited<ReturnType<typeof head>>);
    actualizarFoto.mockResolvedValue({ ok: true, urlAnterior: null });
    eliminarFoto.mockResolvedValue({ ok: true, fotoUrl: blob.url });
    vi.mocked(del).mockResolvedValue(undefined);
  });

  it("asocia solo una foto existente, de tipo y tamaño permitidos, al incidente propio", async () => {
    const respuesta = await PATCH(solicitud("PATCH", { pathname: blob.pathname }), contexto);

    expect(respuesta.status).toBe(200);
    expect(head).toHaveBeenCalledWith(blob.pathname);
    expect(actualizarFoto).toHaveBeenCalledWith("incidente-1", "uid-verificado", blob.url);
    expect(await respuesta.json()).toEqual({ fotoUrl: blob.url });
  });

  it("rechaza origen ajeno y sesión ausente sin consultar Blob", async () => {
    obtenerSesionActual.mockResolvedValue(null);

    const respuesta = await PATCH(
      solicitud("PATCH", { pathname: blob.pathname }, "https://sitio-ajeno.test"),
      contexto,
    );

    expect(respuesta.status).toBe(403);
    expect(head).not.toHaveBeenCalled();
    expect(actualizarFoto).not.toHaveBeenCalled();
  });

  it("rechaza contenido que exceda 5 MB o no sea una imagen permitida", async () => {
    vi.mocked(head).mockResolvedValue({
      ...blob,
      size: 5 * 1024 * 1024 + 1,
    } as Awaited<ReturnType<typeof head>>);

    const respuesta = await PATCH(solicitud("PATCH", { pathname: blob.pathname }), contexto);

    expect(respuesta.status).toBe(400);
    expect(actualizarFoto).not.toHaveBeenCalled();
  });

  it("rechaza la eliminación si el reporte no pertenece a la sesión", async () => {
    eliminarFoto.mockResolvedValue({ ok: false, motivo: "no_autorizado" });

    const respuesta = await DELETE(solicitud("DELETE"), contexto);

    expect(respuesta.status).toBe(404);
    expect(del).not.toHaveBeenCalled();
  });

  it("desasocia y elimina del Blob la foto propia", async () => {
    const respuesta = await DELETE(solicitud("DELETE"), contexto);

    expect(respuesta.status).toBe(200);
    expect(eliminarFoto).toHaveBeenCalledWith("incidente-1", "uid-verificado");
    expect(del).toHaveBeenCalledWith(blob.url);
    expect(await respuesta.json()).toEqual({ fotoUrl: null });
  });
});
