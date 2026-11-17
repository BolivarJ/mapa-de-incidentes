import { beforeEach, describe, expect, it, vi } from "vitest";

const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@vercel/blob/client", () => ({ upload }));

const { subirFotoReporte } = await import("@/lib/subir-foto-reporte");

beforeEach(() => {
  vi.clearAllMocks();
  upload.mockResolvedValue({ pathname: "incidentes/reporte-1/imagen.webp" });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 200 })));
});

describe("subirFotoReporte", () => {
  it("sube el archivo procesado y asocia su ruta al reporte", async () => {
    const archivo = new File(["imagen"], "barrio.webp", { type: "image/webp" });

    await subirFotoReporte("reporte-1", archivo);

    expect(upload).toHaveBeenCalledWith(
      expect.stringMatching(/^incidentes\/reporte-1\/[\da-f-]+\.webp$/i),
      archivo,
      expect.objectContaining({
        access: "public",
        handleUploadUrl: "/api/incidentes/blob",
        clientPayload: "reporte-1",
      }),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/incidentes/reporte-1/foto",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ pathname: "incidentes/reporte-1/imagen.webp" }),
      }),
    );
  });

  it("rechaza archivos grandes o de tipo no admitido antes de pedir la subida", async () => {
    const grande = new File(["imagen"], "grande.webp", { type: "image/webp" });
    Object.defineProperty(grande, "size", { value: 5 * 1024 * 1024 + 1 });

    await expect(subirFotoReporte("reporte-1", grande)).rejects.toThrow("hasta 5 MB");
    await expect(
      subirFotoReporte("reporte-1", new File(["texto"], "notas.txt", { type: "text/plain" })),
    ).rejects.toThrow("JPEG, PNG o WebP");
    expect(upload).not.toHaveBeenCalled();
  });

  it("reporta si Blob no logra asociar la foto al reporte", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 500 })));

    await expect(
      subirFotoReporte("reporte-1", new File(["imagen"], "foto.png", { type: "image/png" })),
    ).rejects.toThrow("No se pudo asociar");
  });
});
