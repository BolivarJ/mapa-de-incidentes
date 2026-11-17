"use client";
import dynamic from "next/dynamic";
import { useCallback, useState } from "react";
import type { Area } from "@/lib/ciudad";
import type { Filtros as TFiltros } from "@/services/bbox";
import { useDebounce } from "@/hooks/useDebounce";
import { useIncidentes } from "@/hooks/useIncidentes";
import type { EstadoCarga } from "@/hooks/useIncidentes";
import { Filtros } from "./Filtros";
import { Leyenda } from "./Leyenda";
import { VistaPrevia } from "./mapa/VistaPrevia";
import { ListaIncidentes } from "./ListaIncidentes";
import { ErrorConReintento, Esqueleto, Vacio } from "./EstadoDatos";
import styles from "./ExploradorIncidentes.module.css";

// Leaflet usa window: solo en el navegador, en un bloque aparte y solo cuando la persona
// pide el mapa interactivo. Así no cuenta en la carga inicial (presupuesto ≤ 120 kB).
const MarcadorDePosicion = () => <div className="mapa mapa--cargando">Cargando mapa…</div>;
const MapaLeaflet = dynamic(() => import("./mapa/MapaLeaflet"), {
  ssr: false,
  loading: MarcadorDePosicion,
});

function anuncio(estado: EstadoCarga): string {
  if (estado.tipo === "cargando") return "Cargando incidentes…";
  if (estado.tipo === "error") return "Error al cargar los incidentes.";
  const n = estado.items.length;
  return n === 1 ? "1 incidente en el área visible." : `${n} incidentes en el área visible.`;
}

function Resultados({ estado, onReintentar }: { estado: EstadoCarga; onReintentar: () => void }) {
  if (estado.tipo === "cargando") return <Esqueleto />;
  if (estado.tipo === "error")
    return <ErrorConReintento mensaje={estado.mensaje} onReintentar={onReintentar} />;
  if (estado.items.length === 0)
    return (
      <Vacio>
        No hay incidentes en esta zona con esos filtros. Mueva el mapa o limpie los filtros.
      </Vacio>
    );
  return <ListaIncidentes incidentes={estado.items} />;
}

export function ExploradorIncidentes({ limites }: { limites: Area }) {
  const [area, setArea] = useState<Area>(limites);
  const [filtros, setFiltros] = useState<TFiltros>({});
  const areaEstable = useDebounce(area, 250);
  const { estado, reintentar } = useIncidentes(areaEstable, filtros);
  const items = estado.tipo === "listo" ? estado.items : [];
  const onArea = useCallback((a: Area) => setArea(a), []);
  const [mapaActivo, setMapaActivo] = useState(false);

  return (
    <div className={styles.explorador}>
      <div className={styles.controles}>
        <Filtros valor={filtros} onCambio={setFiltros} />
        <Leyenda />
      </div>
      <div className={styles.mapa}>
        {mapaActivo ? (
          <MapaLeaflet incidentes={items} limites={limites} onArea={onArea} enfocar />
        ) : (
          <VistaPrevia incidentes={items} limites={limites} onActivar={() => setMapaActivo(true)} />
        )}
      </div>
      <div className={styles.resultados}>
        <p className="visualmente-oculto" aria-live="polite">
          {anuncio(estado)}
        </p>
        <Resultados estado={estado} onReintentar={reintentar} />
      </div>
    </div>
  );
}
