"use client";
import { useCallback, useEffect, useState } from "react";
import type { ChangeEvent, Dispatch, SetStateAction } from "react";
import { procesarFoto } from "@/lib/procesar-foto";

type CambiarMensaje = Dispatch<SetStateAction<string>>;
type Procesar = (foto: File, quitar: boolean) => Promise<void>;

function crearAccionesFoto({
  original,
  quitarMetadatos,
  procesar,
  setArchivo,
  setOriginal,
  setUrl,
  setError,
  setMensaje,
  setQuitarMetadatos,
  setProcesando,
}: {
  original: File | null;
  quitarMetadatos: boolean;
  procesar: Procesar;
  setArchivo: Dispatch<SetStateAction<File | null>>;
  setOriginal: Dispatch<SetStateAction<File | null>>;
  setUrl: CambiarMensaje;
  setError: CambiarMensaje;
  setMensaje: CambiarMensaje;
  setQuitarMetadatos: Dispatch<SetStateAction<boolean>>;
  setProcesando: Dispatch<SetStateAction<boolean>>;
}) {
  return {
    cambiar(evento: ChangeEvent<HTMLInputElement>) {
      const foto = evento.currentTarget.files?.[0];
      setOriginal(foto ?? null);
      setArchivo(null);
      setUrl("");
      setError("");
      setMensaje("");
      if (foto) return procesar(foto, quitarMetadatos);
    },
    cambiarPreferencia(quitar: boolean) {
      setQuitarMetadatos(quitar);
      if (original) return procesar(original, quitar);
    },
    limpiar() {
      setArchivo(null);
      setOriginal(null);
      setUrl("");
      setError("");
      setQuitarMetadatos(false);
      setProcesando(false);
    },
  };
}

async function procesarArchivo(
  foto: File,
  quitarMetadatos: boolean,
  setArchivo: Dispatch<SetStateAction<File | null>>,
  setUrl: CambiarMensaje,
  setError: CambiarMensaje,
  setMensaje: CambiarMensaje,
  setProcesando: Dispatch<SetStateAction<boolean>>,
) {
  setProcesando(true);
  setError("");
  try {
    const resultado = await procesarFoto(foto, quitarMetadatos);
    setArchivo(resultado);
    setUrl(URL.createObjectURL(resultado));
    setMensaje(
      resultado === foto
        ? "Foto lista. Se conserva el archivo original y sus metadatos."
        : "Foto optimizada en este dispositivo; la conversión elimina los metadatos del archivo.",
    );
  } catch (causa) {
    setError(causa instanceof Error ? causa.message : "No se pudo procesar la foto.");
  } finally {
    setProcesando(false);
  }
}

export function useFotoReporte(setMensaje: CambiarMensaje) {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [original, setOriginal] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [quitarMetadatos, setQuitarMetadatos] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url);
    },
    [url],
  );

  const procesar = useCallback(
    (foto: File, quitar: boolean) =>
      procesarArchivo(foto, quitar, setArchivo, setUrl, setError, setMensaje, setProcesando),
    [setMensaje],
  );

  const acciones = crearAccionesFoto({
    original,
    quitarMetadatos,
    procesar,
    setArchivo,
    setOriginal,
    setUrl,
    setError,
    setMensaje,
    setQuitarMetadatos,
    setProcesando,
  });

  return {
    archivo,
    url: url || null,
    error,
    quitarMetadatos,
    procesando,
    ...acciones,
  };
}
