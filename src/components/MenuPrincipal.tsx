"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import styles from "./MenuPrincipal.module.css";

export const ENLACES = [
  { href: "/", texto: "Mapa" },
  { href: "/reportar", texto: "Reportar" },
  { href: "/mis-reportes", texto: "Mis reportes" },
  { href: "/gestion", texto: "Gestión" },
] as const;

export function MenuPrincipal({ sesionActiva }: { sesionActiva: boolean }) {
  const ruta = usePathname();
  const [abierto, setAbierto] = useState(false);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const cerrar = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("keydown", cerrar);
    return () => document.removeEventListener("keydown", cerrar);
  }, [abierto]);

  return (
    <nav aria-label="Principal" className={styles.nav}>
      <button
        type="button"
        className={styles.alternar}
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((v) => !v)}
      >
        Menú
      </button>
      <ul id={id} className={styles.enlaces} data-abierto={abierto} role="list">
        {ENLACES.map((e) => (
          <li key={e.href}>
            <Link
              href={e.href}
              aria-current={ruta === e.href ? "page" : undefined}
              onClick={() => setAbierto(false)}
            >
              {e.texto}
            </Link>
          </li>
        ))}
        <li>
          <AccionSesion activa={sesionActiva} ruta={ruta} cerrarMenu={() => setAbierto(false)} />
        </li>
      </ul>
    </nav>
  );
}

function AccionSesion({
  activa,
  ruta,
  cerrarMenu,
}: {
  activa: boolean;
  ruta: string;
  cerrarMenu: () => void;
}) {
  const router = useRouter();
  const [error, setError] = useState("");

  async function cerrarSesion() {
    setError("");
    try {
      const respuesta = await fetch("/api/sesion", { method: "DELETE", cache: "no-store" });
      if (!respuesta.ok) throw new Error("No fue posible cerrar sesión.");
      router.replace("/iniciar-sesion");
      router.refresh();
    } catch {
      setError("No fue posible cerrar sesión. Intenta de nuevo.");
    }
  }

  if (!activa) {
    return (
      <Link
        href="/iniciar-sesion"
        aria-current={ruta === "/iniciar-sesion" ? "page" : undefined}
        onClick={cerrarMenu}
      >
        Iniciar sesión
      </Link>
    );
  }

  return (
    <>
      <button type="button" className={styles.cerrar} onClick={cerrarSesion}>
        Cerrar sesión
      </button>
      {error && <span role="alert">{error}</span>}
    </>
  );
}
