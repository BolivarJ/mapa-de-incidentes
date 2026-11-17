"use client";
import { useCallback, useState } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useFotoReporte } from "@/hooks/useFotoReporte";
import { subirFotoReporte } from "@/lib/subir-foto-reporte";
import { nuevoIncidenteSchema } from "@/schemas/incidente";
import { z } from "zod";

export type CamposReporte = {
  categoria: string;
  descripcion: string;
  lat: string;
  lng: string;
};
export type ErroresReporte = Partial<Record<keyof CamposReporte | "foto", string>>;
type CambiarCampos = Dispatch<SetStateAction<CamposReporte>>;
type CambiarErrores = Dispatch<SetStateAction<ErroresReporte>>;
type CambiarMensaje = Dispatch<SetStateAction<string>>;
type CambiarEstado = Dispatch<SetStateAction<boolean>>;
const CAMPOS_INICIALES: CamposReporte = {
  categoria: "",
  descripcion: "",
  lat: "",
  lng: "",
};

function cambiarCampo(
  campo: keyof CamposReporte,
  valor: string,
  setCampos: CambiarCampos,
  setErrores: CambiarErrores,
  setMensaje: CambiarMensaje,
) {
  setCampos((actuales) => ({ ...actuales, [campo]: valor }));
  setErrores((actuales) => ({ ...actuales, [campo]: undefined }));
  setMensaje("");
}

function mensajeDeUbicacion(error: GeolocationPositionError): string {
  if (error.code === error.PERMISSION_DENIED) return "No se concedió permiso para la ubicación.";
  if (error.code === error.POSITION_UNAVAILABLE) return "No se pudo determinar la ubicación.";
  return "La solicitud de ubicación tardó demasiado. Inténtelo de nuevo.";
}

function usarUbicacion(
  setCampos: CambiarCampos,
  setErrores: CambiarErrores,
  setMensaje: CambiarMensaje,
  setSelectorVisible: CambiarEstado,
) {
  if (!("geolocation" in navigator)) {
    setMensaje(
      "Este navegador no permite obtener la ubicación. Ingrese las coordenadas manualmente.",
    );
    return;
  }
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      cambiarCampo("lat", coords.latitude.toFixed(5), setCampos, setErrores, setMensaje);
      cambiarCampo("lng", coords.longitude.toFixed(5), setCampos, setErrores, setMensaje);
      setMensaje("Ubicación obtenida. Puede ajustar las coordenadas manualmente.");
    },
    (error) => {
      setMensaje(mensajeDeUbicacion(error));
      if (error.code === error.PERMISSION_DENIED) setSelectorVisible(true);
    },
    { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
  );
}

function marcarUbicacion(
  lat: number,
  lng: number,
  setCampos: CambiarCampos,
  setErrores: CambiarErrores,
  setMensaje: CambiarMensaje,
) {
  setCampos((actuales) => ({ ...actuales, lat: lat.toFixed(5), lng: lng.toFixed(5) }));
  setErrores((actuales) => ({ ...actuales, lat: undefined, lng: undefined }));
  setMensaje("Ubicación marcada en el mapa. Puede ajustar las coordenadas manualmente.");
}

async function adjuntarFotoGuardada(
  respuesta: Response,
  foto: File,
  limpiarFormulario: () => void,
  setMensaje: CambiarMensaje,
): Promise<boolean> {
  const resultado = z
    .object({ item: z.object({ id: z.string().min(1) }) })
    .safeParse(await respuesta.json().catch(() => null));
  if (!resultado.success) {
    limpiarFormulario();
    setMensaje("El reporte se guardó, pero no se pudo adjuntar la foto.");
    return false;
  }
  try {
    await subirFotoReporte(resultado.data.item.id, foto);
    return true;
  } catch {
    limpiarFormulario();
    setMensaje("El reporte se guardó, pero no se pudo adjuntar la foto.");
    return false;
  }
}

function mensajeDeFallo(foto: File | null): string {
  return foto
    ? "El reporte se guardó, pero no se pudo adjuntar la foto. Puedes agregarla desde Mis reportes."
    : "No se pudo conectar con el servidor. Inténtalo de nuevo.";
}

async function guardarReporte(
  datos: { categoria: string; descripcion: string; lat: number; lng: number },
  foto: File | null,
  limpiarFormulario: () => void,
  setMensaje: CambiarMensaje,
  setRequiereSesion: CambiarEstado,
  setEnviando: CambiarEstado,
) {
  setEnviando(true);
  setMensaje("Enviando reporte…");
  try {
    const respuesta = await fetch("/api/incidentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
      cache: "no-store",
    });
    if (respuesta.status === 401) {
      setRequiereSesion(true);
      setMensaje("Inicia sesión para enviar este reporte.");
      return;
    }
    if (!respuesta.ok) {
      setMensaje("No se pudo guardar el reporte. Revisa los datos e inténtalo de nuevo.");
      return;
    }

    setRequiereSesion(false);
    if (foto && !(await adjuntarFotoGuardada(respuesta, foto, limpiarFormulario, setMensaje)))
      return;
    limpiarFormulario();
    setMensaje(foto ? "Reporte enviado correctamente con foto." : "Reporte enviado correctamente.");
  } catch {
    setMensaje(mensajeDeFallo(foto));
  } finally {
    setEnviando(false);
  }
}

async function validarReporte(
  evento: FormEvent<HTMLFormElement>,
  campos: CamposReporte,
  errores: ErroresReporte,
  foto: File | null,
  setErrores: CambiarErrores,
  setCampos: CambiarCampos,
  setMensaje: CambiarMensaje,
  setRequiereSesion: CambiarEstado,
  setEnviando: CambiarEstado,
  limpiarFoto: () => void,
) {
  const formulario = evento.currentTarget;
  evento.preventDefault();
  setMensaje("");
  if (errores.foto) return;
  const resultado = nuevoIncidenteSchema.safeParse({
    categoria: campos.categoria,
    descripcion: campos.descripcion,
    lat: Number(campos.lat),
    lng: Number(campos.lng),
  });
  if (!resultado.success) {
    const nuevosErrores: ErroresReporte = {};
    for (const issue of resultado.error.issues) {
      const campo = issue.path[0];
      if (campo === "categoria" || campo === "descripcion" || campo === "lat" || campo === "lng") {
        nuevosErrores[campo] =
          campo === "categoria" && !campos.categoria ? "Seleccione una categoría." : issue.message;
      }
    }
    setErrores(nuevosErrores);
    return;
  }
  setErrores({});
  await guardarReporte(
    resultado.data,
    foto,
    () => {
      formulario.reset();
      setCampos(CAMPOS_INICIALES);
      limpiarFoto();
    },
    setMensaje,
    setRequiereSesion,
    setEnviando,
  );
}

export function useFormularioReporte() {
  const [campos, setCampos] = useState<CamposReporte>(CAMPOS_INICIALES);
  const [errores, setErrores] = useState<ErroresReporte>({});
  const [mensaje, setMensaje] = useState("");
  const [requiereSesion, setRequiereSesion] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [selectorVisible, setSelectorVisible] = useState(false);
  const foto = useFotoReporte(setMensaje);

  const seleccionarUbicacion = useCallback(
    (lat: number, lng: number) => marcarUbicacion(lat, lng, setCampos, setErrores, setMensaje),
    [],
  );

  return {
    campos,
    errores: { ...errores, ...(foto.error ? { foto: foto.error } : {}) },
    mensaje,
    requiereSesion,
    enviando,
    selectorVisible,
    fotoArchivo: foto.archivo,
    quitarMetadatosUbicacion: foto.quitarMetadatos,
    procesandoFoto: foto.procesando,
    fotoUrl: foto.url,
    cambiarCampo: (campo: keyof CamposReporte, valor: string) =>
      cambiarCampo(campo, valor, setCampos, setErrores, setMensaje),
    cambiarFoto: foto.cambiar,
    cambiarQuitarMetadatosUbicacion: foto.cambiarPreferencia,
    usarUbicacion: () => usarUbicacion(setCampos, setErrores, setMensaje, setSelectorVisible),
    marcarUbicacion: seleccionarUbicacion,
    validarReporte: (evento: FormEvent<HTMLFormElement>) =>
      validarReporte(
        evento,
        campos,
        errores,
        foto.archivo,
        setErrores,
        setCampos,
        setMensaje,
        setRequiereSesion,
        setEnviando,
        foto.limpiar,
      ),
  };
}
