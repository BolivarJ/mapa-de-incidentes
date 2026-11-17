"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef } from "react";
import type { Area } from "@/lib/ciudad";
import styles from "./SelectorUbicacion.module.css";

export function SelectorUbicacion({
  limites,
  seleccionar,
}: {
  limites: Area;
  seleccionar: (lat: number, lng: number) => void;
}) {
  const nodo = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!nodo.current) return;
    const bounds = L.latLngBounds([limites.sur, limites.oeste], [limites.norte, limites.este]);
    const mapa = L.map(nodo.current, { maxBounds: bounds, minZoom: 11, scrollWheelZoom: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(mapa);
    mapa.fitBounds(bounds);
    let marcador: L.CircleMarker | null = null;
    mapa.on("click", ({ latlng }) => {
      marcador?.remove();
      marcador = L.circleMarker(latlng, { radius: 9, color: "#0b57d0", weight: 3 }).addTo(mapa);
      seleccionar(latlng.lat, latlng.lng);
    });
    return () => {
      mapa.remove();
    };
  }, [limites, seleccionar]);

  return (
    <section className={styles.selector} aria-labelledby="titulo-selector-mapa">
      <h2 id="titulo-selector-mapa">Marca el punto del incidente</h2>
      <p id="ayuda-selector-mapa">
        Pulsa el mapa para elegir el lugar. También puedes escribir las coordenadas.
      </p>
      <div
        ref={nodo}
        className={`mapa ${styles.mapa}`}
        role="region"
        aria-label="Elegir ubicación en el mapa"
        tabIndex={0}
        aria-describedby="ayuda-selector-mapa"
      />
    </section>
  );
}
