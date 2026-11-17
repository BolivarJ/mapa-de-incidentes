"use client";

export default function ErrorDeRuta({ reset }: { error: Error; reset: () => void }) {
  return (
    <div role="alert">
      <h1>Algo salió mal</h1>
      <p>No pudimos mostrar esta página. Intente de nuevo.</p>
      <button type="button" className="boton" onClick={reset}>
        Reintentar
      </button>
    </div>
  );
}
