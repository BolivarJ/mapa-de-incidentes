import type { Area } from "@/lib/ciudad";
import type { Categoria, Estado, Incidente } from "@/schemas/constantes";

export type Filtros = { categoria?: Categoria; estado?: Estado; desde?: string };

export function dentroDeArea(punto: { lat: number; lng: number }, area: Area): boolean {
  return (
    punto.lat >= area.sur &&
    punto.lat <= area.norte &&
    punto.lng >= area.oeste &&
    punto.lng <= area.este
  );
}

/** Rectángulo que contiene todos los puntos, con un margen en grados. */
export function rectanguloDe(puntos: { lat: number; lng: number }[], margen = 0): Area | null {
  if (puntos.length === 0) return null;
  const lats = puntos.map((p) => p.lat);
  const lngs = puntos.map((p) => p.lng);
  return {
    sur: Math.min(...lats) - margen,
    norte: Math.max(...lats) + margen,
    oeste: Math.min(...lngs) - margen,
    este: Math.max(...lngs) + margen,
  };
}

/** Recorta un área a los límites de la ciudad. Devuelve null si no se cruzan. */
export function intersecar(a: Area, b: Area): Area | null {
  const r = {
    sur: Math.max(a.sur, b.sur),
    norte: Math.min(a.norte, b.norte),
    oeste: Math.max(a.oeste, b.oeste),
    este: Math.min(a.este, b.este),
  };
  return r.sur <= r.norte && r.oeste <= r.este ? r : null;
}

export function cumpleFiltros(incidente: Incidente, filtros: Filtros): boolean {
  if (filtros.categoria && incidente.categoria !== filtros.categoria) return false;
  if (filtros.estado && incidente.estado !== filtros.estado) return false;
  if (filtros.desde && incidente.creadoEn.slice(0, 10) < filtros.desde) return false;
  return true;
}

/** Filtra por área y filtros, ordena del más reciente al más antiguo. */
export function filtrarIncidentes(
  lista: Incidente[],
  area: Area,
  filtros: Filtros = {},
): Incidente[] {
  return lista
    .filter((i) => dentroDeArea(i, area) && cumpleFiltros(i, filtros))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}
