// Constantes y tipos sin Zod: los usa el navegador sin cargar la librería de validación.
export const CATEGORIAS = ["hueco", "luminaria", "basuras", "otro"] as const;
export const ESTADOS = ["recibido", "en_proceso", "resuelto"] as const;

export const ETIQUETA_CATEGORIA: Record<Categoria, string> = {
  hueco: "Hueco en la vía",
  luminaria: "Luminaria dañada",
  basuras: "Basuras",
  otro: "Otro",
};

export const ETIQUETA_ESTADO: Record<Estado, string> = {
  recibido: "Recibido",
  en_proceso: "En proceso",
  resuelto: "Resuelto",
};

export type Categoria = (typeof CATEGORIAS)[number];
export type Estado = (typeof ESTADOS)[number];

export type Incidente = {
  id: string;
  uid: string;
  categoria: Categoria;
  descripcion: string;
  lat: number;
  lng: number;
  fotoUrl: string | null;
  estado: Estado;
  apoyos: number;
  creadoEn: string;
};

export type IncidentePublico = Omit<Incidente, "uid">;

export type EventoHistorial = { estado: Estado; nota: string; creadoEn: string };
