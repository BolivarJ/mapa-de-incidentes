import Link from "next/link";
import type { IncidentePublico } from "@/schemas/constantes";
import { ETIQUETA_CATEGORIA } from "@/schemas/constantes";
import { formatearFecha } from "@/lib/formato";
import { FormaEstado } from "./FormaEstado";
import styles from "./ListaIncidentes.module.css";

type Props = { incidentes: IncidentePublico[]; titulo?: string };

/** Alternativa accesible al mapa: misma información, navegable con teclado. */
export function ListaIncidentes({ incidentes, titulo = "Incidentes en el área visible" }: Props) {
  return (
    <section aria-labelledby="titulo-lista" className={styles.lista}>
      <h2 id="titulo-lista">
        {titulo} <span className={styles.conteo}>({incidentes.length})</span>
      </h2>
      <ul role="list">
        {incidentes.map((i) => (
          <li key={i.id}>
            <article className={styles.tarjeta} aria-labelledby={`inc-${i.id}`}>
              <h3 id={`inc-${i.id}`} className={styles.titulo}>
                <Link href={`/incidentes/${i.id}`}>{ETIQUETA_CATEGORIA[i.categoria]}</Link>
              </h3>
              <p className={styles.descripcion}>{i.descripcion}</p>
              <p className={styles.meta}>
                <FormaEstado estado={i.estado} />
                <span>
                  <time dateTime={i.creadoEn}>{formatearFecha(i.creadoEn)}</time>
                </span>
                <span>
                  {i.apoyos} {i.apoyos === 1 ? "vecino apoya" : "vecinos apoyan"}
                </span>
              </p>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
