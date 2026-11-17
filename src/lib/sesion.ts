import "server-only";
import { cookies } from "next/headers";
import { getAuthAdmin } from "@/lib/firebase-admin";

export const NOMBRE_COOKIE_SESION = "__session";

export type UsuarioSesion = { uid: string; email: string | null };

export async function obtenerSesionActual(): Promise<UsuarioSesion | null> {
  const cookie = (await cookies()).get(NOMBRE_COOKIE_SESION)?.value;
  if (!cookie) return null;

  const auth = getAuthAdmin();
  if (!auth) return null;

  try {
    const token = await auth.verifySessionCookie(cookie, true);
    return { uid: token.uid, email: typeof token.email === "string" ? token.email : null };
  } catch {
    return null;
  }
}
