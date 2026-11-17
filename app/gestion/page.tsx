import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Gestión" };

export default function Pagina() {
  return (
    <>
      <h1>Cola de atención</h1>
      <p>Solo para funcionarios; disponible en el Hito 4.</p>
      <p>
        <Link href="/">Volver al mapa</Link>
      </p>
    </>
  );
}
