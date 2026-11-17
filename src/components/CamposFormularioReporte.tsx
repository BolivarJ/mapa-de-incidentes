import type { ChangeEvent } from "react";
import type { CamposReporte, ErroresReporte } from "@/hooks/useFormularioReporte";
import styles from "./FormularioReporte.module.css";

export function CampoCategoria({
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

export function CampoDescripcion({
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

function OpcionMetadatosFoto({
  quitarMetadatos,
  cambiandoMetadatos,
  procesando,
}: {
  quitarMetadatos: boolean;
  cambiandoMetadatos: (quitar: boolean) => void;
  procesando: boolean;
}) {
  return (
    <div className={styles.opcionMetadatos}>
      <input
        id="quitar-metadatos-foto"
        name="quitarMetadatosUbicacion"
        type="checkbox"
        checked={quitarMetadatos}
        disabled={procesando}
        onChange={(evento) => cambiandoMetadatos(evento.target.checked)}
      />
      <label htmlFor="quitar-metadatos-foto">Quitar metadatos de ubicación de la foto</label>
    </div>
  );
}

export function CampoFoto({
  error,
  quitarMetadatos,
  cambiandoMetadatos,
  procesando,
  cambiar,
}: {
  error?: string;
  quitarMetadatos: boolean;
  cambiandoMetadatos: (quitar: boolean) => void;
  procesando: boolean;
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
        disabled={procesando}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? "error-foto" : "ayuda-foto"}
        onChange={cambiar}
      />
      <OpcionMetadatosFoto
        quitarMetadatos={quitarMetadatos}
        cambiandoMetadatos={cambiandoMetadatos}
        procesando={procesando}
      />
      <span id="ayuda-foto" className={styles.ayuda}>
        Se procesa en este dispositivo y se limita a 5 MB. Marque la casilla para quitar metadatos;
        las imágenes que se comprimen también se reescriben y pierden sus metadatos. La foto aún no
        se sube ni se guarda.
      </span>
      {procesando && <span role="status">Procesando foto en este dispositivo…</span>}
      {error && (
        <span id="error-foto" className={styles.errorCampo}>
          {error}
        </span>
      )}
    </div>
  );
}

export function ErroresFormulario({ errores }: { errores: ErroresReporte }) {
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

export function UbicacionReporte({
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
