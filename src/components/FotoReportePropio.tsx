"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { subirFotoReporte } from "@/lib/subir-foto-reporte";
import styles from "./FotoReportePropio.module.css";

type Props = { id: string; fotoUrl: string | null };

type CambiarEstado = (value: boolean) => void;
type CambiarMensaje = (value: string) => void;

async function subirFoto(
  id: string,
  archivo: File | undefined,
  setSubiendo: CambiarEstado,
  setMensaje: CambiarMensaje,
  refrescar: () => void,
) {
  if (!archivo) return;
  setSubiendo(true);
  setMensaje("");
  try {
    await subirFotoReporte(id, archivo);
    setMensaje("Foto guardada.");
    refrescar();
  } catch (error) {
    setMensaje(error instanceof Error ? error.message : "No se pudo guardar la foto.");
  } finally {
    setSubiendo(false);
  }
}

async function eliminarFoto(
  id: string,
  setEliminando: CambiarEstado,
  setMensaje: CambiarMensaje,
  refrescar: () => void,
) {
  setEliminando(true);
  setMensaje("");
  try {
    const respuesta = await fetch(`/api/incidentes/${encodeURIComponent(id)}/foto`, {
      method: "DELETE",
      cache: "no-store",
    });
    if (!respuesta.ok) {
      setMensaje("No se pudo quitar la foto. Inténtalo de nuevo.");
      return;
    }
    setMensaje("Foto eliminada.");
    refrescar();
  } catch {
    setMensaje("No se pudo conectar con el servidor. Inténtalo de nuevo.");
  } finally {
    setEliminando(false);
  }
}

export function FotoReportePropio({ id, fotoUrl }: Props) {
  const router = useRouter();
  const [eliminando, setEliminando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState("");

  return (
    <div className={styles.foto}>
      {fotoUrl && (
        <Image src={fotoUrl} alt="Foto del reporte" width={720} height={480} unoptimized />
      )}
      <label htmlFor={`foto-reporte-${id}`}>{fotoUrl ? "Cambiar foto" : "Agregar foto"}</label>
      <input
        id={`foto-reporte-${id}`}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        disabled={subiendo || eliminando}
        onChange={(evento) =>
          void subirFoto(
            id,
            evento.currentTarget.files?.[0],
            setSubiendo,
            setMensaje,
            router.refresh,
          )
        }
      />
      {fotoUrl && (
        <button
          className="boton boton--secundario"
          type="button"
          onClick={() => void eliminarFoto(id, setEliminando, setMensaje, router.refresh)}
          disabled={eliminando || subiendo}
        >
          {eliminando ? "Quitando foto…" : "Quitar foto"}
        </button>
      )}
      <p role="status" aria-live="polite">
        {mensaje}
      </p>
    </div>
  );
}
