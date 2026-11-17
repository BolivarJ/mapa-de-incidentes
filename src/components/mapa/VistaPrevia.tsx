import type { Area } from "@/lib/ciudad";
import type { IncidentePublico } from "@/schemas/constantes";
import { SvgEstado } from "../FormaEstado";
import styles from "./VistaPrevia.module.css";

type Props = { incidentes: IncidentePublico[]; limites: Area; onActivar: () => void };

/** Posición en % dentro del rectángulo de la ciudad (0–100). */
export function posicion(i: { lat: number; lng: number }, a: Area) {
  const x = ((i.lng - a.oeste) / (a.este - a.oeste)) * 100;
  const y = ((a.norte - i.lat) / (a.norte - a.sur)) * 100;
  return { left: `${x.toFixed(2)}%`, top: `${y.toFixed(2)}%` };
}

/**
 * Fachada del mapa: muestra dónde están los incidentes sin cargar Leaflet (~40 kB).
 * El mapa interactivo se carga solo si la persona lo pide (presupuesto de JavaScript).
 */
export function VistaPrevia({ incidentes, limites, onActivar }: Props) {
  return (
    <div className={`mapa ${styles.vista}`}>
      <div className={styles.puntos} aria-hidden="true">
        {incidentes.map((i) => (
          <span key={i.id} className={styles.punto} style={posicion(i, limites)}>
            <SvgEstado estado={i.estado} tamano={20} />
          </span>
        ))}
      </div>
      <button type="button" className={`boton ${styles.activar}`} onClick={onActivar}>
        Mostrar mapa interactivo
      </button>
    </div>
  );
}
