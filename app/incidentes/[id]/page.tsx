import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FormaEstado } from "@/components/FormaEstado";
import { formatearFecha, formatearFechaHora } from "@/lib/formato";
import { repositorioIncidentesFirestore } from "@/repositories/incidentes-firestore";
import { ETIQUETA_CATEGORIA, ETIQUETA_ESTADO } from "@/schemas/incidente";
import styles from "./detalle.module.css";

type Props = { params: Promise<{ id: string }> };

export const runtime = "nodejs";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const incidente = await repositorioIncidentesFirestore.obtener(id);
  return { title: incidente ? ETIQUETA_CATEGORIA[incidente.categoria] : "Incidente no encontrado" };
}

export default async function DetalleIncidente({ params }: Props) {
  const { id } = await params;
  const incidente = await repositorioIncidentesFirestore.obtener(id);
  if (!incidente) notFound();
  const historial = await repositorioIncidentesFirestore.historial(id);

  return (
    <article className={styles.detalle}>
      <p>
        <Link href="/">← Volver al mapa</Link>
      </p>
      <h1>{ETIQUETA_CATEGORIA[incidente.categoria]}</h1>
      <p className={styles.meta}>
        <FormaEstado estado={incidente.estado} />
        <span>
          Reportado el{" "}
          <time dateTime={incidente.creadoEn}>{formatearFecha(incidente.creadoEn)}</time>
        </span>
        <span>{incidente.apoyos} vecinos dicen «a mí también me pasa»</span>
      </p>
      <p>{incidente.descripcion}</p>
      <section aria-labelledby="titulo-seguimiento">
        <h2 id="titulo-seguimiento">Seguimiento</h2>
        <ol className={styles.linea}>
          {historial.map((h) => (
            <li key={h.creadoEn} data-estado={h.estado}>
              <strong>{ETIQUETA_ESTADO[h.estado]}</strong>{" "}
              <time dateTime={h.creadoEn}>{formatearFechaHora(h.creadoEn)}</time>
              <p>{h.nota}</p>
            </li>
          ))}
        </ol>
      </section>
    </article>
  );
}
