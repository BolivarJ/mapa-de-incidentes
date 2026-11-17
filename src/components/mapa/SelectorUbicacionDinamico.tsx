"use client";
import dynamic from "next/dynamic";
import type { Area } from "@/lib/ciudad";

const SelectorUbicacion = dynamic(
  () => import("./SelectorUbicacion").then((m) => m.SelectorUbicacion),
  {
    ssr: false,
    loading: () => <p role="status">Cargando mapa para elegir ubicación…</p>,
  },
);

export function SelectorUbicacionDinamico({
  limites,
  seleccionar,
}: {
  limites: Area;
  seleccionar: (lat: number, lng: number) => void;
}) {
  return <SelectorUbicacion limites={limites} seleccionar={seleccionar} />;
}
