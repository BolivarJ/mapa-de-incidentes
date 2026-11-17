import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { INCIDENTES_EJEMPLO } from "../src/repositories/incidentes-ejemplo";

export const ANCHOS = [360, 768, 1024] as const;
export const PAGINAS = ["/", "/incidentes/i-003", "/reportar", "/no-existe"] as const;

/** No pedimos teselas reales a OpenStreetMap en las pruebas (política de uso y pruebas estables). */
export async function sinTeselas(page: Page) {
  await page.route("https://tile.openstreetmap.org/**", (r) =>
    r.fulfill({ status: 204, body: "" }),
  );
}

/** Fixtures deterministas para probar mapa/lista sin depender de Firestore real. */
export async function conIncidentesDeEjemplo(page: Page) {
  await page.route("**/api/incidentes?**", async (route) => {
    const parametros = new URL(route.request().url()).searchParams;
    const sur = Number(parametros.get("sur"));
    const norte = Number(parametros.get("norte"));
    const oeste = Number(parametros.get("oeste"));
    const este = Number(parametros.get("este"));
    const categoria = parametros.get("categoria");
    const estado = parametros.get("estado");
    const desde = parametros.get("desde");
    const items = INCIDENTES_EJEMPLO.filter(
      (incidente) =>
        incidente.lat >= sur &&
        incidente.lat <= norte &&
        incidente.lng >= oeste &&
        incidente.lng <= este &&
        (!categoria || incidente.categoria === categoria) &&
        (!estado || incidente.estado === estado) &&
        (!desde || incidente.creadoEn.slice(0, 10) >= desde),
    );

    await route.fulfill({ json: { items, siguienteCursor: null } });
  });
}

/** Contenido mínimo para probar la navegación al detalle sin depender de Firestore. */
export async function conDetalleDeEjemplo(page: Page) {
  await page.route("**/incidentes/i-*", (route) =>
    route.fulfill({
      contentType: "text/html; charset=utf-8",
      body: `<!doctype html>
        <html lang="es">
          <head><meta charset="utf-8"><title>Incidente de ejemplo</title></head>
          <body><main id="contenido"><article>
            <p><a href="/">Volver al mapa</a></p>
            <h1>Hueco en la vía</h1>
            <p>Recibido · Reportado el <time datetime="2026-11-10T14:20:00Z">10 nov 2026</time></p>
            <p>Incidente de ejemplo para pruebas de navegación.</p>
            <section aria-labelledby="titulo-seguimiento">
              <h2 id="titulo-seguimiento">Seguimiento</h2>
              <ol><li><strong>Recibido</strong><p>Reporte recibido</p></li></ol>
            </section>
          </article></main></body>
        </html>`,
    }),
  );
}

export async function hayScrollHorizontal(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
}

export async function violacionesAxe(page: Page) {
  const r = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  return r.violations.map((v) => `${v.id} (${v.nodes.length}): ${v.nodes[0]?.target.join(" ")}`);
}
