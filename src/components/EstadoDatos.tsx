import styles from "./EstadoDatos.module.css";

export function Esqueleto({ filas = 3 }: { filas?: number }) {
  return (
    <div className={styles.esqueleto} aria-hidden="true">
      {Array.from({ length: filas }, (_, i) => (
        <div key={i} className={styles.fila} />
      ))}
    </div>
  );
}

export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className={styles.vacio}>{children}</p>;
}

export function ErrorConReintento({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div className={styles.error} role="alert">
      <p>No se pudieron cargar los incidentes. {mensaje}.</p>
      <button type="button" className="boton" onClick={onReintentar}>
        Reintentar
      </button>
    </div>
  );
}
