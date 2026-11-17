import type { Metadata } from "next";
import Link from "next/link";
import { FormularioAcceso } from "@/components/FormularioAcceso";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function PaginaIniciarSesion() {
  return (
    <>
      <h1>Iniciar sesión</h1>
      <p>Accede para consultar y gestionar tus reportes.</p>
      <FormularioAcceso modo="ingreso" />
      <p>
        ¿Aún no tienes cuenta? <Link href="/crear-cuenta">Crear cuenta</Link>
      </p>
    </>
  );
}
