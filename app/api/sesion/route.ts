import { z } from "zod";
import { ErrorApi, errorDeValidacion } from "@/lib/errores";
import { getAuthAdmin } from "@/lib/firebase-admin";
import { manejar } from "@/lib/http";
import { NOMBRE_COOKIE_SESION } from "@/lib/sesion";

export const runtime = "nodejs";

const DURACION_SESION_MS = 5 * 24 * 60 * 60 * 1000;
const DURACION_SESION_SEGUNDOS = DURACION_SESION_MS / 1000;
const ANTIGUEDAD_MAXIMA_AUTENTICACION_SEGUNDOS = 5 * 60;
const cuerpoSesionSchema = z.strictObject({ idToken: z.string().min(1).max(8192) });

function origenValido(request: Request): boolean {
  const origen = request.headers.get("origin");
  return origen !== null && origen === new URL(request.url).origin;
}

function cookieSesion(valor: string, maxAge: number): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${NOMBRE_COOKIE_SESION}=${encodeURIComponent(valor)}; Max-Age=${maxAge}; Path=/; HttpOnly; SameSite=Strict${secure}`;
}

export const POST = manejar(async (request) => {
  if (!origenValido(request)) throw new ErrorApi(403, "Origen no permitido");

  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    throw new ErrorApi(400, "Datos no válidos");
  }

  const resultado = cuerpoSesionSchema.safeParse(cuerpo);
  if (!resultado.success) throw errorDeValidacion(resultado.error);

  const auth = getAuthAdmin();
  if (!auth) throw new ErrorApi(503, "Autenticación no disponible");

  let token: Awaited<ReturnType<typeof auth.verifyIdToken>>;
  try {
    token = await auth.verifyIdToken(resultado.data.idToken, true);
  } catch {
    throw new ErrorApi(401, "No se pudo verificar el inicio de sesión");
  }

  const ahora = Math.floor(Date.now() / 1000);
  if (
    !Number.isInteger(token.auth_time) ||
    ahora - token.auth_time > ANTIGUEDAD_MAXIMA_AUTENTICACION_SEGUNDOS ||
    token.auth_time > ahora + 60
  ) {
    throw new ErrorApi(401, "Vuelva a iniciar sesión para continuar");
  }

  const cookie = await auth.createSessionCookie(resultado.data.idToken, {
    expiresIn: DURACION_SESION_MS,
  });
  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": cookieSesion(cookie, DURACION_SESION_SEGUNDOS),
    },
  });
});

export const DELETE = manejar(async (request) => {
  if (!origenValido(request)) throw new ErrorApi(403, "Origen no permitido");

  return new Response(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": cookieSesion("", 0),
    },
  });
});
