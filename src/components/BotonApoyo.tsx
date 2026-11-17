"use client";
import Link from "next/link";
import { useState } from "react";

type Props = { id: string; apoyosIniciales: number };
type Resultado = { apoyos?: number; mensaje: string; requiereSesion?: boolean };

function textoApoyos(total: number): string {
  return `${total} ${total === 1 ? "vecino dice" : "vecinos dicen"} «a mí también me pasa»`;
}

async function enviarApoyo(id: string): Promise<Resultado> {
  try {
    const respuesta = await fetch(`/api/incidentes/${encodeURIComponent(id)}/apoyo`, {
      method: "POST",
      cache: "no-store",
    });
    if (respuesta.status === 401) {
      return { mensaje: "Inicia sesión para apoyar este reporte.", requiereSesion: true };
    }
    if (respuesta.status === 409) return { mensaje: "Ya apoyaste este reporte." };
    if (!respuesta.ok) return { mensaje: "No se pudo registrar tu apoyo. Inténtalo de nuevo." };
    const cuerpo = (await respuesta.json()) as { apoyos: number };
    return { apoyos: cuerpo.apoyos, mensaje: "Gracias, tu apoyo quedó registrado." };
  } catch {
    return { mensaje: "No se pudo conectar con el servidor. Inténtalo de nuevo." };
  }
}

export function BotonApoyo({ id, apoyosIniciales }: Props) {
  const [apoyos, setApoyos] = useState(apoyosIniciales);
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function apoyar() {
    setEnviando(true);
    const nuevo = await enviarApoyo(id);
    if (nuevo.apoyos !== undefined) setApoyos(nuevo.apoyos);
    setResultado(nuevo);
    setEnviando(false);
  }

  return (
    <div>
      <p>{textoApoyos(apoyos)}</p>
      <button
        className="boton boton--secundario"
        type="button"
        onClick={apoyar}
        disabled={enviando}
      >
        A mí también me pasa
      </button>
      <p role="status" aria-live="polite">
        {resultado?.mensaje}
        {resultado?.requiereSesion && (
          <>
            {" "}
            <Link href="/iniciar-sesion">Iniciar sesión</Link>
          </>
        )}
      </p>
    </div>
  );
}
