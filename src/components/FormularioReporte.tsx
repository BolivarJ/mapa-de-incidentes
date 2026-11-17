"use client";
import Link from "next/link";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { useFormularioReporte } from "@/hooks/useFormularioReporte";
import type { CamposReporte, ErroresReporte } from "@/hooks/useFormularioReporte";
import { CIUDAD } from "@/lib/ciudad";
import { SelectorUbicacionDinamico } from "@/components/mapa/SelectorUbicacionDinamico";
import styles from "./FormularioReporte.module.css";

function Errores({ errores }: { errores: ErroresReporte }) {
  const mensajes = Object.values(errores).filter((error): error is string => Boolean(error));
  if (mensajes.length === 0) return null;
  return (
    <div className={styles.errores} role="alert">
      <p>Revise estos datos antes de continuar:</p>
      <ul>
        {mensajes.map((error) => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    </div>
  );
}

function CampoCategoria({
  valor,
  error,
  cambiar,
}: {
  valor: string;
  error?: string;
  cambiar: (v: string) => void;
}) {
  return (
    <div className={styles.campo}>
      <label htmlFor="categoria">Categoría</label>
      <select
        id="categoria"
        name="categoria"
        value={valor}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "error-categoria" : undefined}
        onChange={(e) => cambiar(e.target.value)}
      >
        <option value="">Seleccione una categoría</option>
        <option value="hueco">Hueco en la vía</option>
        <option value="luminaria">Luminaria dañada</option>
        <option value="basuras">Basuras</option>
        <option value="otro">Otro</option>
      </select>
      {error && (
        <span id="error-categoria" className={styles.errorCampo}>
          {error}
        </span>
      )}
    </div>
  );
}

function CampoDescripcion({
  valor,
  error,
  cambiar,
}: {
  valor: string;
  error?: string;
  cambiar: (v: string) => void;
}) {
  return (
    <div className={styles.campo}>
      <label htmlFor="descripcion">Descripción</label>
      <textarea
        id="descripcion"
        name="descripcion"
        rows={4}
        maxLength={1000}
        value={valor}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "error-descripcion" : "ayuda-descripcion"}
        onChange={(e) => cambiar(e.target.value)}
      />
      <span id="ayuda-descripcion" className={styles.ayuda}>
        Describa el problema con al menos 10 caracteres, sin incluir datos personales.
      </span>
      {error && (
        <span id="error-descripcion" className={styles.errorCampo}>
          {error}
        </span>
      )}
    </div>
  );
}

function CampoCoordenada({
  nombre,
  valor,
  error,
  cambiar,
}: {
  nombre: "lat" | "lng";
  valor: string;
  error?: string;
  cambiar: (v: string) => void;
}) {
  const id = nombre === "lat" ? "latitud" : "longitud";
  const etiqueta = nombre === "lat" ? "Latitud" : "Longitud";
  const idError = `error-${nombre}`;
  return (
    <div className={styles.campo}>
      <label htmlFor={id}>{etiqueta}</label>
      <input
        id={id}
        name={nombre}
        type="number"
        step="any"
        inputMode="decimal"
        value={valor}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? idError : undefined}
        onChange={(e) => cambiar(e.target.value)}
      />
      {error && (
        <span id={idError} className={styles.errorCampo}>
          {error}
        </span>
      )}
    </div>
  );
}

function UbicacionReporte({
  campos,
  errores,
  cambiarCampo,
  usarUbicacion,
}: {
  campos: CamposReporte;
  errores: ErroresReporte;
  cambiarCampo: (c: keyof CamposReporte, v: string) => void;
  usarUbicacion: () => void;
}) {
  return (
    <fieldset className={styles.ubicacion}>
      <legend>Ubicación del incidente</legend>
      <p>
        Puede permitir el acceso a su ubicación o ingresar las coordenadas. Si no concede el
        permiso, el formulario sigue disponible.
      </p>
      <button className="boton boton--secundario" type="button" onClick={usarUbicacion}>
        Usar mi ubicación
      </button>
      <div className={styles.coordenadas}>
        <CampoCoordenada
          nombre="lat"
          valor={campos.lat}
          error={errores.lat}
          cambiar={(v) => cambiarCampo("lat", v)}
        />
        <CampoCoordenada
          nombre="lng"
          valor={campos.lng}
          error={errores.lng}
          cambiar={(v) => cambiarCampo("lng", v)}
        />
      </div>
    </fieldset>
  );
}

function CampoFoto({
  error,
  cambiar,
}: {
  error?: string;
  cambiar: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className={styles.campo}>
      <label htmlFor="foto">Foto (opcional)</label>
      <input
        id="foto"
        name="foto"
        type="file"
        accept="image/*"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "error-foto" : "ayuda-foto"}
        onChange={cambiar}
      />
      <span id="ayuda-foto" className={styles.ayuda}>
        Imagen de hasta 5 MB. Se muestra una vista previa, pero todavía no se adjunta al reporte.
      </span>
      {error && (
        <span id="error-foto" className={styles.errorCampo}>
          {error}
        </span>
      )}
    </div>
  );
}

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

function BotonEnvio({ enviando }: { enviando: boolean }) {
  return (
    <button className="boton" type="submit" disabled={enviando}>
      {enviando ? "Enviando…" : "Enviar reporte"}
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
      <Errores errores={reporte.errores} />
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
      <CampoFoto error={reporte.errores.foto} cambiar={reporte.cambiarFoto} />
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
      <BotonEnvio enviando={reporte.enviando} />
    </form>
  );
}
