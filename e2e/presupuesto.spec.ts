import { expect, test } from "@playwright/test";
import type { Page } from "@playwright/test";
import { conIncidentesDeEjemplo, sinTeselas } from "./apoyo";

// Requisito: JS transferido ≤ 200 kB. Reto: ≤ 120 kB (se mide en producción, Vercel usa brotli).
// En local `next start` comprime con gzip (~15 % más que brotli): por eso el reto se exige con BASE_URL.
const REQUISITO_KB = 200;
const RETO_KB = Number(process.env.PRESUPUESTO_KB ?? 120);
const EN_PRODUCCION = Boolean(process.env.BASE_URL);

test.use({ viewport: { width: 360, height: 800 } });

async function jsTransferidoKb(page: Page) {
  const tamanos: Promise<number>[] = [];
  page.on("requestfinished", (req) => {
    if (req.resourceType() === "script") {
      tamanos.push(req.sizes().then((s) => s.responseBodySize + s.responseHeadersSize));
    }
  });
  await sinTeselas(page);
  await conIncidentesDeEjemplo(page);
  await page.goto("/", { waitUntil: "networkidle" });
  return (await Promise.all(tamanos)).reduce((a, b) => a + b, 0) / 1024;
}

test("JS transferido en / (móvil, carga inicial, sin caché)", async ({ page }) => {
  const kb = await jsTransferidoKb(page);
  test.info().annotations.push({ type: "JS transferido (kB)", description: kb.toFixed(1) });
  const donde = EN_PRODUCCION ? "producción" : "local, gzip";
  process.stdout.write(`JS transferido en /: ${kb.toFixed(1)} kB (${donde})
`);
  expect(kb).toBeLessThanOrEqual(REQUISITO_KB);
  if (EN_PRODUCCION) expect(kb).toBeLessThanOrEqual(RETO_KB);
});

test("Leaflet no se descarga hasta pedir el mapa", async ({ page }) => {
  const leaflet: string[] = [];
  page.on("response", async (r) => {
    if (r.request().resourceType() === "script" && (await r.text()).includes("leaflet-container")) {
      leaflet.push(r.url());
    }
  });
  await sinTeselas(page);
  await conIncidentesDeEjemplo(page);
  await page.goto("/", { waitUntil: "networkidle" });
  expect(leaflet).toHaveLength(0);
  await page.getByRole("button", { name: "Mostrar mapa interactivo" }).click();
  await expect(page.locator(".leaflet-container")).toBeVisible();
  expect(leaflet.length).toBeGreaterThan(0);
});
