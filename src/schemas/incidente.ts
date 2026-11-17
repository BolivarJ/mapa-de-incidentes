import { z } from "zod";
import { CIUDAD } from "@/lib/ciudad";
import { CATEGORIAS, ESTADOS } from "./constantes";
import type { EventoHistorial, Incidente } from "./constantes";

export * from "./constantes";

const { limites } = CIUDAD;
export const latitud = z
  .number()
  .min(limites.sur, "La ubicación está fuera de la ciudad")
  .max(limites.norte, "La ubicación está fuera de la ciudad");
export const longitud = z
  .number()
  .min(limites.oeste, "La ubicación está fuera de la ciudad")
  .max(limites.este, "La ubicación está fuera de la ciudad");

export const categoriaSchema = z.enum(CATEGORIAS);
export const estadoSchema = z.enum(ESTADOS);

export const eventoHistorialSchema = z.strictObject({
  estado: estadoSchema,
  nota: z.string().max(500),
  creadoEn: z.iso.datetime(),
});

export const incidenteSchema = z.strictObject({
  id: z.string().min(1),
  uid: z.string().min(1),
  categoria: categoriaSchema,
  descripcion: z.string().min(10).max(1000),
  lat: latitud,
  lng: longitud,
  fotoUrl: z.url().nullable(),
  estado: estadoSchema,
  apoyos: z.number().int().min(0),
  creadoEn: z.iso.datetime(),
});

export const nuevoIncidenteSchema = z.strictObject({
  categoria: categoriaSchema,
  descripcion: z
    .string()
    .trim()
    .min(10, "Describa el problema con al menos 10 caracteres")
    .max(1000, "Máximo 1000 caracteres"),
  lat: latitud,
  lng: longitud,
});

export type NuevoIncidente = z.infer<typeof nuevoIncidenteSchema>;

// Comprobación en compilación: el esquema y el tipo del cliente coinciden.
type Igual<A, B> = [A] extends [B] ? ([B] extends [A] ? true : false) : false;
export const _incidenteCoincide: Igual<z.infer<typeof incidenteSchema>, Incidente> = true;
export const _historialCoincide: Igual<
  z.infer<typeof eventoHistorialSchema>,
  EventoHistorial
> = true;
