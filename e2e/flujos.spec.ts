import { expect, test } from "@playwright/test";
import { conIncidentesDeEjemplo, sinTeselas } from "./apoyo";

test.use({ viewport: { width: 1024, height: 800 } });

test("criterio 4: la lista equivalente al mapa se recorre con teclado", async ({ page }) => {
  await sinTeselas(page);
  await conIncidentesDeEjemplo(page);
  await page.goto("/");
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Saltar al contenido" })).toBeFocused();
  const enlaces = page
    .getByRole("region", { name: /Incidentes en el área visible/ })
    .getByRole("link");
  await expect(enlaces).toHaveCount(6);
  await enlaces.first().focus();
  await expect(enlaces.first()).toHaveAttribute("href", /\/incidentes\/i-/);
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/incidentes\/i-/);
});

test("criterio 2: un incidente resuelto se distingue por forma y texto, no solo color", async ({
  page,
}) => {
  await sinTeselas(page);
  await conIncidentesDeEjemplo(page);
  await page.goto("/");
  await page.getByRole("button", { name: "Mostrar mapa interactivo" }).click();
  await page.getByLabel("Estado").selectOption("resuelto");
  await expect(page.getByText("2 incidentes en el área visible.")).toBeAttached();
  // Forma: el marcador resuelto es un cuadrado con chulo (rect), el recibido un círculo.
  await expect(page.locator(".marcador--resuelto svg rect").first()).toBeVisible();
  await expect(page.locator(".marcador--recibido")).toHaveCount(0);
  // Texto: la lista dice «Resuelto» en cada tarjeta.
  const lista = page.getByRole("region", { name: /Incidentes en el área visible/ });
  await expect(lista.getByText("Resuelto", { exact: true })).toHaveCount(2);
});

test("filtros: el estado vacío explica qué hacer", async ({ page }) => {
  await sinTeselas(page);
  await page.goto("/");
  await page.getByLabel("Categoría").selectOption("basuras");
  await page.getByLabel("Estado").selectOption("recibido");
  await expect(page.getByText(/No hay incidentes en esta zona/)).toBeVisible();
});

test("error del servidor: se anuncia y se puede reintentar", async ({ page }) => {
  await sinTeselas(page);
  let fallar = true;
  await page.route("**/api/incidentes?**", async (r) => {
    if (fallar) return r.fulfill({ status: 500, json: { error: "x" } });
    return r.continue();
  });
  await page.goto("/");
  await expect(page.getByRole("alert").filter({ hasText: "No se pudieron cargar" })).toBeVisible();
  fallar = false;
  await page.getByRole("button", { name: "Reintentar" }).click();
  await expect(page.getByRole("heading", { name: /Incidentes en el área visible/ })).toBeVisible();
});
