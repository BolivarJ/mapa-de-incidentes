import { ErrorApi } from "./errores";

type Manejador = (request: Request) => Promise<Response>;

export function json(datos: unknown, init: ResponseInit = {}): Response {
  return Response.json(datos, init);
}

function respuestaDeError(error: unknown, idSolicitud: string): Response {
  const conocido = error instanceof ErrorApi;
  const estado = conocido ? error.estado : 500;
  const cuerpo = conocido
    ? { error: error.message, ...(error.detalles ? { detalles: error.detalles } : {}) }
    : { error: "Error interno del servidor" };
  return json(cuerpo, {
    status: estado,
    headers: { "Cache-Control": "no-store", "X-Request-Id": idSolicitud },
  });
}

/** Envoltorio común: agrega id de solicitud y convierte errores en `{ error, detalles? }`. */
export function manejar(handler: Manejador): Manejador {
  return async (request) => {
    const idSolicitud = request.headers.get("x-request-id") ?? crypto.randomUUID();
    try {
      const respuesta = await handler(request);
      respuesta.headers.set("X-Request-Id", idSolicitud);
      return respuesta;
    } catch (error) {
      return respuestaDeError(error, idSolicitud);
    }
  };
}
