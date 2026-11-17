import type { z } from "zod";

export type Detalle = { campo: string; mensaje: string };

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    mensaje: string,
    readonly detalles?: Detalle[],
  ) {
    super(mensaje);
    this.name = "ErrorApi";
  }
}

export function detallesDeZod(error: z.ZodError): Detalle[] {
  return error.issues.map((i) => ({ campo: i.path.join(".") || "(raíz)", mensaje: i.message }));
}

export function errorDeValidacion(error: z.ZodError): ErrorApi {
  return new ErrorApi(400, "Datos no válidos", detallesDeZod(error));
}
