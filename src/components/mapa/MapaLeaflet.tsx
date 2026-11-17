"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Area } from "@/lib/ciudad";
import type { IncidentePublico } from "@/schemas/constantes";
import { ETIQUETA_CATEGORIA, ETIQUETA_ESTADO } from "@/schemas/constantes";
import { svgEstado } from "./iconos";
import { agrupar } from "./agrupar";

const RADIO_GRUPO = 46; // 32 px del marcador × √2

type Props = {
  incidentes: IncidentePublico[];
  limites: Area;
  onArea: (a: Area) => void;
  /** Mueve el foco al mapa al crearlo (cuando se activó con el botón). */
  enfocar?: boolean;
};

const aArea = (b: L.LatLngBounds): Area => ({
  norte: b.getNorth(),
  sur: b.getSouth(),
  este: b.getEast(),
  oeste: b.getWest(),
});

/** Contenido del popup construido con nodos de texto: nunca HTML del usuario. */
function contenidoPopup(i: IncidentePublico): HTMLElement {
  const caja = document.createElement("div");
  const titulo = document.createElement("strong");
  titulo.textContent = `${ETIQUETA_CATEGORIA[i.categoria]} · ${ETIQUETA_ESTADO[i.estado]}`;
  const texto = document.createElement("p");
  texto.textContent = i.descripcion;
  const enlace = document.createElement("a");
  enlace.href = `/incidentes/${i.id}`;
  enlace.textContent = "Ver detalle y seguimiento";
  caja.append(titulo, texto, enlace);
  return caja;
}

function crearMarcador(i: IncidentePublico): L.Marker {
  const icon = L.divIcon({
    html: svgEstado(i.estado),
    className: `marcador marcador--${i.estado}`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -14],
  });
  const titulo = `${ETIQUETA_CATEGORIA[i.categoria]}, ${ETIQUETA_ESTADO[i.estado]}`;
  return L.marker([i.lat, i.lng], { icon, title: titulo, alt: titulo, keyboard: true }).bindPopup(
    () => contenidoPopup(i),
  );
}

function crearGrupo(mapa: L.Map, datos: IncidentePublico[], centro: L.LatLng): L.Marker {
  const n = datos.length;
  const icon = L.divIcon({
    html: `<span>${n}</span>`,
    className: "grupo-marcadores",
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
  const titulo = `${n} incidentes cercanos. Pulse para acercar.`;
  const marcador = L.marker(centro, { icon, title: titulo, alt: titulo, keyboard: true });
  const caja = L.latLngBounds(datos.map((i) => [i.lat, i.lng] as L.LatLngTuple));
  return marcador.on("click", () => mapa.fitBounds(caja.pad(0.5)));
}

/** Dibuja marcadores sueltos o agrupados según el zoom actual. */
function dibujar(mapa: L.Map, capa: L.LayerGroup, incidentes: IncidentePublico[]) {
  capa.clearLayers();
  const puntos = incidentes.map((i) => {
    const p = mapa.latLngToLayerPoint([i.lat, i.lng]);
    return { x: p.x, y: p.y, dato: i };
  });
  for (const g of agrupar(puntos, RADIO_GRUPO)) {
    const [unico] = g.datos;
    const centro = mapa.layerPointToLatLng([g.x, g.y]);
    capa.addLayer(
      g.datos.length === 1 && unico ? crearMarcador(unico) : crearGrupo(mapa, g.datos, centro),
    );
  }
}

function crearMapa(nodo: HTMLDivElement, limites: Area, onArea: (a: Area) => void): L.Map {
  const caja = L.latLngBounds([limites.sur, limites.oeste], [limites.norte, limites.este]);
  const mapa = L.map(nodo, { maxBounds: caja.pad(0.2), minZoom: 11, zoomControl: true });
  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);
  mapa.on("moveend", () => onArea(aArea(mapa.getBounds())));
  mapa.fitBounds(caja);
  return mapa;
}

export default function MapaLeaflet({ incidentes, limites, onArea, enfocar = false }: Props) {
  const nodo = useRef<HTMLDivElement>(null);
  const mapa = useRef<L.Map | null>(null);
  const capa = useRef<L.LayerGroup | null>(null);
  const onAreaRef = useRef(onArea);

  useEffect(() => {
    onAreaRef.current = onArea;
  }, [onArea]);

  useEffect(() => {
    if (!nodo.current) return;
    const m = crearMapa(nodo.current, limites, (a) => onAreaRef.current(a));
    mapa.current = m;
    capa.current = L.layerGroup().addTo(m);
    if (enfocar) nodo.current.focus();
    return () => {
      m.remove();
      mapa.current = null;
    };
  }, [limites, enfocar]);

  useEffect(() => {
    const m = mapa.current;
    const c = capa.current;
    if (!m || !c) return;
    const redibujar = () => dibujar(m, c, incidentes);
    redibujar();
    m.on("zoomend", redibujar);
    return () => {
      m.off("zoomend", redibujar);
    };
  }, [incidentes]);

  return (
    <div
      ref={nodo}
      className="mapa"
      role="region"
      aria-label="Mapa de incidentes. Use las flechas para desplazarse y + o − para acercar. La lista siguiente contiene la misma información."
    />
  );
}
