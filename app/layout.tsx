import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import Link from "next/link";
import { MenuPrincipal } from "@/components/MenuPrincipal";
import { obtenerSesionActual } from "@/lib/sesion";
import "./globals.css";

// Fuente local (licencia OFL en app/fuentes): no depende de la red al compilar.
const fuente = localFont({
  src: [
    { path: "./fuentes/atkinson-hyperlegible-latin-400-normal.woff2", weight: "400" },
    { path: "./fuentes/atkinson-hyperlegible-latin-700-normal.woff2", weight: "700" },
  ],
  display: "swap",
  fallback: ["system-ui", "Segoe UI", "Roboto", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITIO_URL ?? "http://localhost:3000"),
  title: { default: "Mapa de incidentes ciudadanos", template: "%s · Mapa de incidentes" },
  description: "Reporte huecos, luminarias dañadas o basuras del barrio y vea si se atienden.",
  openGraph: {
    title: "Mapa de incidentes ciudadanos",
    description: "Reporte problemas del barrio en un mapa, con foto y estado de atención.",
    locale: "es_CO",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#111418" },
  ],
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const sesion = await obtenerSesionActual();

  return (
    <html lang="es" className={fuente.className}>
      <body>
        <a className="saltar" href="#contenido">
          Saltar al contenido
        </a>
        <header className="cabecera">
          <div className="contenedor cabecera__fila">
            <Link href="/" className="marca">
              Incidentes del barrio
            </Link>
            <MenuPrincipal sesionActiva={Boolean(sesion)} />
          </div>
        </header>
        <main id="contenido" tabIndex={-1} className="contenedor principal">
          {children}
        </main>
        <footer className="pie">
          <div className="contenedor">
            <p>
              Proyecto académico · Desarrollo Web · Datos del mapa © colaboradores de OpenStreetMap.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
