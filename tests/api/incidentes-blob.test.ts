import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleUpload } from "@vercel/blob/client";

const { obtenerSesionActual, obtener } = vi.hoisted(() => ({
  obtenerSesionActual: vi.fn(),
  obtener: vi.fn(),
}));

vi.mock("@/lib/sesion", () => ({ obtenerSesionActual }));
vi.mock("@/repositories/incidentes-firestore", () => ({
  repositorioIncidentesFirestore: { obtener },
}));
vi.mock("@vercel/blob/client", () => ({ handleUpload: vi.fn() }));

const { POST } = await import("../../app/api/incidentes/blob/route");

const evento = {
  type: "blob.generate-client-token",
  payload: {
    pathname: "incidentes/incidente-1/foto.webp",
    multipart: false,
    clientPayload: "incidente-1",
  },
};

function solicitud(body: unknown, origin = "http://localhost") {
  return new Request("http://localhost/api/incidentes/blob", {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/incidentes/blob", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "token-falso-de-prueba");
    obtenerSesionActual.mockResolvedValue({ uid: "uid-verificado" });
    obtener.mockResolvedValue({ id: "incidente-1", uid: "uid-verificado", fotoUrl: null });
    vi.mocked(handleUpload).mockResolvedValue({
      type: "blob.generate-client-token",
      clientToken: "token-cliente",
    });
  });

  it("exige origen propio y sesión verificada antes de emitir un token", async () => {
    obtenerSesionActual.mockResolvedValue(null);

    const respuesta = await POST(solicitud(evento));

    expect(respuesta.status).toBe(401);
    expect(handleUpload).not.toHaveBeenCalled();
  });

  it("rechaza origen ajeno y almacenamiento no configurado", async () => {
    expect((await POST(solicitud(evento, "https://sitio-ajeno.test"))).status).toBe(403);
    vi.stubEnv("BLOB_READ_WRITE_TOKEN", "");

    const respuesta = await POST(solicitud(evento));

    expect(respuesta.status).toBe(503);
    expect(handleUpload).not.toHaveBeenCalled();
  });

  it("no emite tokens para incidentes ajenos o inexistentes", async () => {
    obtener.mockResolvedValue({ id: "incidente-1", uid: "otra-persona", fotoUrl: null });

    const respuesta = await POST(solicitud(evento));

    expect(respuesta.status).toBe(404);
    expect(handleUpload).not.toHaveBeenCalled();
  });

  it("limita el token al incidente propio, imágenes permitidas y 5 MB", async () => {
    vi.mocked(handleUpload).mockImplementation(async (opciones) => {
      const token = await opciones.onBeforeGenerateToken(
        evento.payload.pathname,
        evento.payload.clientPayload,
        false,
      );
      expect(token).toMatchObject({
        allowedContentTypes: ["image/jpeg", "image/png", "image/webp"],
        maximumSizeInBytes: 5 * 1024 * 1024,
        addRandomSuffix: true,
        allowOverwrite: false,
      });
      return { type: "blob.generate-client-token", clientToken: "token-cliente" };
    });

    const respuesta = await POST(solicitud(evento));

    expect(respuesta.status).toBe(200);
    expect(await respuesta.json()).toEqual({
      type: "blob.generate-client-token",
      clientToken: "token-cliente",
    });
  });

  it("delega al SDK el callback de finalización firmado por Vercel sin exigir sesión de navegador", async () => {
    obtenerSesionActual.mockResolvedValue(null);
    vi.mocked(handleUpload).mockResolvedValue({
      type: "blob.upload-completed",
      response: "ok",
    });
    const callback = {
      type: "blob.upload-completed",
      payload: {
        blob: {
          pathname: evento.payload.pathname,
          url: "https://almacen.public.blob.vercel-storage.com/foto.webp",
          downloadUrl: "https://almacen.public.blob.vercel-storage.com/foto.webp?download=1",
          contentType: "image/webp",
          contentDisposition: "inline",
          etag: "etag-de-prueba",
        },
        tokenPayload: null,
      },
    };
    const request = new Request("http://localhost/api/incidentes/blob", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(callback),
    });

    const respuesta = await POST(request);

    expect(respuesta.status).toBe(200);
    expect(handleUpload).toHaveBeenCalledOnce();
    expect(obtenerSesionActual).not.toHaveBeenCalled();
  });

  it("rechaza rutas de archivo que no pertenezcan al incidente autorizado", async () => {
    const rutaAjena = {
      ...evento,
      payload: { ...evento.payload, pathname: "incidentes/otro/foto.webp" },
    };
    vi.mocked(handleUpload).mockImplementation(async (opciones) => {
      await opciones.onBeforeGenerateToken(
        rutaAjena.payload.pathname,
        rutaAjena.payload.clientPayload,
        false,
      );
      return { type: "blob.generate-client-token", clientToken: "token-cliente" };
    });

    const respuesta = await POST(solicitud(evento));

    expect(respuesta.status).toBe(400);
  });
});
