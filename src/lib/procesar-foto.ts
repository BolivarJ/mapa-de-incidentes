import { esTipoFoto, TAMANO_MAXIMO_FOTO } from "@/lib/foto";

export { TAMANO_MAXIMO_FOTO } from "@/lib/foto";
const LADO_MAXIMO = 1920;
const INTENTOS_MAXIMOS = 8;

function nombreProcesado(nombre: string, tipo: string): string {
  const base = nombre.replace(/\.[^.]+$/, "");
  const extension = tipo === "image/webp" ? "webp" : tipo === "image/jpeg" ? "jpg" : "png";
  return `${base || "foto"}.${extension}`;
}

function crearCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("El navegador no pudo procesar la imagen.");
  return { canvas, context };
}

function convertirBlob(canvas: HTMLCanvasElement, calidad: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo codificar la imagen."))),
      "image/webp",
      calidad,
    );
  });
}

async function codificarImagen(bitmap: ImageBitmap): Promise<Blob> {
  const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
  let width = Math.max(1, Math.round(bitmap.width * escala));
  let height = Math.max(1, Math.round(bitmap.height * escala));
  const { canvas, context } = crearCanvas(width, height);

  for (let intento = 0; intento < INTENTOS_MAXIMOS; intento += 1) {
    canvas.width = width;
    canvas.height = height;
    context.drawImage(bitmap, 0, 0, width, height);
    const calidad = Math.max(0.4, 0.86 - intento * 0.08);
    const blob = await convertirBlob(canvas, calidad);
    if (blob.size <= TAMANO_MAXIMO_FOTO) return blob;
    width = Math.max(1, Math.floor(width * 0.82));
    height = Math.max(1, Math.floor(height * 0.82));
  }

  throw new Error("La imagen no se pudo reducir a menos de 5 MB.");
}

export async function procesarFoto(
  archivo: File,
  quitarMetadatosUbicacion: boolean,
): Promise<File> {
  if (!esTipoFoto(archivo.type)) throw new Error("Seleccione una foto JPEG, PNG o WebP.");
  if (archivo.size <= TAMANO_MAXIMO_FOTO && !quitarMetadatosUbicacion) return archivo;
  if (typeof createImageBitmap !== "function") {
    throw new Error("Este navegador no permite optimizar la imagen. Pruebe con otra imagen.");
  }

  const bitmap = await createImageBitmap(archivo);
  try {
    const blob = await codificarImagen(bitmap);
    return new File([blob], nombreProcesado(archivo.name, blob.type), {
      type: blob.type || "image/webp",
      lastModified: archivo.lastModified,
    });
  } finally {
    bitmap.close();
  }
}
