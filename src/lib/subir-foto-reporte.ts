import { upload } from "@vercel/blob/client";
import { esTipoFoto, TAMANO_MAXIMO_FOTO, type TipoFoto } from "@/lib/foto";

const EXTENSIONES: Record<TipoFoto, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export async function subirFotoReporte(id: string, archivo: File): Promise<void> {
  if (!esTipoFoto(archivo.type) || archivo.size > TAMANO_MAXIMO_FOTO) {
    throw new Error("La foto debe ser JPEG, PNG o WebP de hasta 5 MB.");
  }

  const pathname = `incidentes/${id}/${crypto.randomUUID()}.${EXTENSIONES[archivo.type]}`;
  const blob = await upload(pathname, archivo, {
    access: "public",
    handleUploadUrl: "/api/incidentes/blob",
    clientPayload: id,
  });
  const respuesta = await fetch(`/api/incidentes/${encodeURIComponent(id)}/foto`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pathname: blob.pathname }),
    cache: "no-store",
  });

  if (!respuesta.ok) {
    throw new Error("No se pudo asociar la foto al reporte.");
  }
}
