import type { Metadata } from "next";
import Link from "next/link";
import { FormularioReporte } from "@/components/FormularioReporte";

export const metadata: Metadata = { title: "Reportar" };

export default function Pagina() {
  return (
    <>
      <h1>Reportar un incidente</h1>
      <FormularioReporte />
      <p>
        <Link href="/">Volver al mapa</Link>
      </p>
    </>
  );
}
