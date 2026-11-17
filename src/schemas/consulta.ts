import { z } from "zod";
import { categoriaSchema, estadoSchema } from "./incidente";

const coordenada = z.coerce.number().refine(Number.isFinite, "Debe ser un número");

export const consultaAreaSchema = z
  .strictObject({
    norte: coordenada.pipe(z.number().min(-90).max(90)),
    sur: coordenada.pipe(z.number().min(-90).max(90)),
    este: coordenada.pipe(z.number().min(-180).max(180)),
    oeste: coordenada.pipe(z.number().min(-180).max(180)),
    categoria: categoriaSchema.optional(),
    estado: estadoSchema.optional(),
    desde: z.iso.date().optional(),
    limite: z.coerce.number().int().min(1).max(100).default(100),
  })
  .refine((c) => c.norte > c.sur, { path: ["norte"], message: "norte debe ser mayor que sur" })
  .refine((c) => c.este > c.oeste, { path: ["este"], message: "este debe ser mayor que oeste" });

export type ConsultaArea = z.infer<typeof consultaAreaSchema>;

/** Convierte URLSearchParams en objeto, ignorando parámetros vacíos. */
export function parametros(busqueda: URLSearchParams): Record<string, string> {
  return Object.fromEntries([...busqueda.entries()].filter(([, v]) => v !== ""));
}
