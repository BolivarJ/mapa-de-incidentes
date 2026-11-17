import type { EventoHistorial, Incidente } from "@/schemas/incidente";
import type { RepositorioIncidentes } from "./incidentes";

// Datos de ejemplo del Hito 1 (Medellín). Se reemplazan por Firestore en el Hito 3.
export const INCIDENTES_EJEMPLO: Incidente[] = [
  ejemplo(
    "i-001",
    "hueco",
    "Hueco profundo en el carril derecho frente al parque",
    6.2442,
    -75.5812,
    "recibido",
    12,
    "2026-11-10T14:20:00Z",
  ),
  ejemplo(
    "i-002",
    "luminaria",
    "Tres luminarias apagadas en la cuadra, muy oscuro de noche",
    6.2518,
    -75.5636,
    "en_proceso",
    8,
    "2026-11-08T22:05:00Z",
  ),
  ejemplo(
    "i-003",
    "basuras",
    "Acumulación de basuras en la esquina desde hace una semana",
    6.2308,
    -75.5906,
    "resuelto",
    21,
    "2026-11-02T09:40:00Z",
  ),
  ejemplo(
    "i-004",
    "hueco",
    "Hueco que ya dañó varias llantas, cerca de la estación",
    6.2675,
    -75.5679,
    "recibido",
    3,
    "2026-11-12T07:15:00Z",
  ),
  ejemplo(
    "i-005",
    "otro",
    "Andén levantado por raíces, peligroso para sillas de ruedas",
    6.2101,
    -75.5703,
    "en_proceso",
    5,
    "2026-11-05T16:30:00Z",
  ),
  ejemplo(
    "i-006",
    "luminaria",
    "Poste de luz parpadeando toda la noche en el sendero",
    6.2894,
    -75.5551,
    "resuelto",
    2,
    "2026-10-28T20:10:00Z",
  ),
];

const HISTORIAL: Record<string, EventoHistorial[]> = {
  "i-002": [
    { estado: "recibido", nota: "Reporte recibido", creadoEn: "2026-11-08T22:05:00Z" },
    { estado: "en_proceso", nota: "Cuadrilla asignada", creadoEn: "2026-11-09T13:00:00Z" },
  ],
  "i-003": [
    { estado: "recibido", nota: "Reporte recibido", creadoEn: "2026-11-02T09:40:00Z" },
    { estado: "en_proceso", nota: "Programada la recolección", creadoEn: "2026-11-03T08:00:00Z" },
    { estado: "resuelto", nota: "Esquina limpia", creadoEn: "2026-11-04T11:30:00Z" },
  ],
};

function ejemplo(
  id: string,
  categoria: Incidente["categoria"],
  descripcion: string,
  lat: number,
  lng: number,
  estado: Incidente["estado"],
  apoyos: number,
  creadoEn: string,
): Incidente {
  return {
    id,
    uid: "vecino-demo",
    categoria,
    descripcion,
    lat,
    lng,
    fotoUrl: null,
    estado,
    apoyos,
    creadoEn,
  };
}

export function crearRepositorioEjemplo(
  datos: Incidente[] = INCIDENTES_EJEMPLO,
): RepositorioIncidentes {
  return {
    async listarPorLatitud(sur, norte, limite) {
      return datos.filter((i) => i.lat >= sur && i.lat <= norte).slice(0, limite);
    },
    async obtener(id) {
      return datos.find((i) => i.id === id) ?? null;
    },
    async historial(id) {
      const incidente = datos.find((i) => i.id === id);
      if (!incidente) return [];
      return (
        HISTORIAL[id] ?? [
          { estado: "recibido", nota: "Reporte recibido", creadoEn: incidente.creadoEn },
        ]
      );
    },
  };
}

export const repositorioIncidentes = crearRepositorioEjemplo();
