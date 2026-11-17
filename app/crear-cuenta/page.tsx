import type { Metadata } from "next";
import Link from "next/link";
import { FormularioAcceso } from "@/components/FormularioAcceso";

export const metadata: Metadata = { title: "Crear cuenta" };

export default function PaginaCrearCuenta() {
  return (
    <>
      <h1>Crear cuenta</h1>
      <p>Usa tu correo para guardar y consultar tus reportes.</p>
      <FormularioAcceso modo="registro" />
      <p>
        ¿Ya tienes cuenta? <Link href="/iniciar-sesion">Iniciar sesión</Link>
      </p>
    </>
  );
}
