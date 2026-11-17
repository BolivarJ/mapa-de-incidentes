import Link from "next/link";

export default function NoEncontrado() {
  return (
    <>
      <h1>Página no encontrada</h1>
      <p>La dirección no existe o el incidente fue retirado.</p>
      <p>
        <Link href="/">Ir al mapa de incidentes</Link>
      </p>
    </>
  );
}
