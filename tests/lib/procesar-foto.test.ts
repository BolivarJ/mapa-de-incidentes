import { afterEach, describe, expect, it, vi } from "vitest";
import { TAMANO_MAXIMO_FOTO, procesarFoto } from "@/lib/procesar-foto";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("procesarFoto", () => {
  it("conserva una imagen pequeña si no se pidió quitar metadatos", async () => {
    const archivo = new File(["imagen"], "barrio.png", { type: "image/png" });
    const crearBitmap = vi.fn();
    vi.stubGlobal("createImageBitmap", crearBitmap);

    await expect(procesarFoto(archivo, false)).resolves.toBe(archivo);
    expect(crearBitmap).not.toHaveBeenCalled();
  });

  it("rechaza archivos que no son imágenes", async () => {
    const archivo = new File(["texto"], "nota.txt", { type: "text/plain" });

    await expect(procesarFoto(archivo, false)).rejects.toThrow("Seleccione un archivo de imagen");
  });

  it("reencodea por canvas cuando se solicita eliminar metadatos", async () => {
    const archivo = new File(["imagen"], "barrio.png", { type: "image/png" });
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 1200, height: 900, close: vi.fn() }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["imagen optimizada"], { type: "image/webp" }));
    });

    const procesada = await procesarFoto(archivo, true);

    expect(procesada).not.toBe(archivo);
    expect(procesada.type).toBe("image/webp");
    expect(procesada.size).toBeLessThan(TAMANO_MAXIMO_FOTO);
    expect(procesada.name).toBe("barrio.webp");
  });

  it("reduce imágenes grandes hasta quedar dentro de 5 MB", async () => {
    const archivo = new File([new Uint8Array(TAMANO_MAXIMO_FOTO + 1)], "grande.jpg", {
      type: "image/jpeg",
    });
    vi.stubGlobal(
      "createImageBitmap",
      vi.fn().mockResolvedValue({ width: 3200, height: 2400, close: vi.fn() }),
    );
    vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue({
      drawImage: vi.fn(),
    } as unknown as CanvasRenderingContext2D);
    vi.spyOn(HTMLCanvasElement.prototype, "toBlob").mockImplementation((callback) => {
      callback(new Blob(["foto reducida"], { type: "image/webp" }));
    });

    const procesada = await procesarFoto(archivo, false);

    expect(procesada.size).toBeLessThanOrEqual(TAMANO_MAXIMO_FOTO);
    expect(HTMLCanvasElement.prototype.toBlob).toHaveBeenCalled();
  });
});
