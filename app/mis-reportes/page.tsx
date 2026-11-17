import type { Metadata } from "next";
import Link from "next/link";
import { FormaEstado } from "@/components/FormaEstado";
import { FotoReportePropio } from "@/components/FotoReportePropio";
import { formatearFecha } from "@/lib/formato";
import { obtenerSesionActual } from "@/lib/sesion";
import { repositorioIncidentesFirestore } from "@/repositories/incidentes-firestore";
import { ETIQUETA_CATEGORIA } from "@/schemas/constantes";
import type { Incidente } from "@/schemas/incidente";
import { listarReportesUsuario } from "@/services/mis-reportes";
import styles from "./mis-reportes.module.css";

export const metadata: Metadata = { title: "Mis reportes" };

function TarjetaReporte({ reporte }: { reporte: Incidente }) {
  return (
    <li className={styles.tarjeta}>
      <article>
        <h2 className={styles.titulo}>
          <Link href={`/incidentes/${reporte.id}`}>{ETIQUETA_CATEGORIA[reporte.categoria]}</Link>
        </h2>
        <p className={styles.meta}>
          <FormaEstado estado={reporte.estado} />
          <span>
            Reportado el <time dateTime={reporte.creadoEn}>{formatearFecha(reporte.creadoEn)}</time>
          </span>
        </p>
        <p>{reporte.descripcion}</p>
        <FotoReportePropio id={reporte.id} fotoUrl={reporte.fotoUrl} />
      </article>
    </li>
  );
}

export default async function Pagina() {
  const sesion = await obtenerSesionActual();
  if (!sesion) {
    return (
      <>
        <h1>Mis reportes</h1>
        <p>
          Para consultar tus reportes, primero <Link href="/iniciar-sesion">inicia sesión</Link>.
        </p>
      </>
    );
  }

  const reportes = await listarReportesUsuario(repositorioIncidentesFirestore, sesion.uid);
  return (
    <>
      <h1>Mis reportes</h1>
      {reportes.length > 0 ? (
        <ul className={styles.lista}>
          {reportes.map((reporte) => (
            <TarjetaReporte key={reporte.id} reporte={reporte} />
          ))}
        </ul>
      ) : (
        <p>
          Aún no tienes reportes. <Link href="/reportar">Puedes crear uno aquí</Link>.
        </p>
      )}
      <p>
        <Link href="/">Volver al mapa</Link>
      </p>
    </>
  );
}
