"use client";
import Image from "next/image";
import Link from "next/link";
import { useFormularioReporte } from "@/hooks/useFormularioReporte";
import { CIUDAD } from "@/lib/ciudad";
import { SelectorUbicacionDinamico } from "@/components/mapa/SelectorUbicacionDinamico";
import {
  CampoCategoria,
  CampoDescripcion,
  CampoFoto,
  ErroresFormulario,
  UbicacionReporte,
} from "./CamposFormularioReporte";
import styles from "./FormularioReporte.module.css";

function MensajeEnvio({ mensaje, requiereSesion }: { mensaje: string; requiereSesion: boolean }) {
  return (
    <p className={styles.ubicacionMensaje} role="status" aria-live="polite">
      {mensaje}
      {requiereSesion && (
        <>
          {" "}
          <Link href="/iniciar-sesion">Iniciar sesión</Link>
        </>
      )}
    </p>
  );
}

function BotonEnvio({ enviando, procesandoFoto }: { enviando: boolean; procesandoFoto: boolean }) {
  return (
    <button className="boton" type="submit" disabled={enviando || procesandoFoto}>
      {procesandoFoto ? "Procesando foto…" : enviando ? "Enviando…" : "Enviar reporte"}
    </button>
  );
}

function UbicacionConSelector({ reporte }: { reporte: ReturnType<typeof useFormularioReporte> }) {
  return (
    <>
      <UbicacionReporte
        campos={reporte.campos}
        errores={reporte.errores}
        cambiarCampo={reporte.cambiarCampo}
        usarUbicacion={reporte.usarUbicacion}
      />
      {reporte.selectorVisible && (
        <SelectorUbicacionDinamico limites={CIUDAD.limites} seleccionar={reporte.marcarUbicacion} />
      )}
    </>
  );
}

export function FormularioReporte() {
  const reporte = useFormularioReporte();
  return (
    <form
      className={styles.formulario}
      aria-label="Reporte de incidente"
      noValidate
      onSubmit={reporte.validarReporte}
    >
      <p className="intro">
        Complete los datos del problema. La ubicación puede obtenerse con el dispositivo o
        escribirse manualmente. Para enviar el reporte debe iniciar sesión.
      </p>
      <ErroresFormulario errores={reporte.errores} />
      <div className={styles.camposPrincipales} role="group" aria-label="Datos del incidente">
        <CampoCategoria
          valor={reporte.campos.categoria}
          error={reporte.errores.categoria}
          cambiar={(v) => reporte.cambiarCampo("categoria", v)}
        />
        <CampoDescripcion
          valor={reporte.campos.descripcion}
          error={reporte.errores.descripcion}
          cambiar={(v) => reporte.cambiarCampo("descripcion", v)}
        />
      </div>
      <UbicacionConSelector reporte={reporte} />
      <CampoFoto
        error={reporte.errores.foto}
        quitarMetadatos={reporte.quitarMetadatosUbicacion}
        cambiandoMetadatos={reporte.cambiarQuitarMetadatosUbicacion}
        procesando={reporte.procesandoFoto}
        cambiar={reporte.cambiarFoto}
      />
      {reporte.fotoUrl && (
        <Image
          className={styles.vistaPrevia}
          src={reporte.fotoUrl}
          alt="Vista previa de la foto seleccionada"
          width={720}
          height={480}
          unoptimized
        />
      )}
      <MensajeEnvio mensaje={reporte.mensaje} requiereSesion={reporte.requiereSesion} />
      <BotonEnvio enviando={reporte.enviando} procesandoFoto={reporte.procesandoFoto} />
    </form>
  );
}
