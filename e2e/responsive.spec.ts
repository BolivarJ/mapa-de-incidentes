import { expect, test } from "@playwright/test";
import { ANCHOS, PAGINAS, hayScrollHorizontal, sinTeselas, violacionesAxe } from "./apoyo";

// Reto: prueba en 3 anchos sin scroll horizontal y 0 violaciones de axe.
for (const ancho of ANCHOS) {
  test.describe(`${ancho} px`, () => {
    test.use({ viewport: { width: ancho, height: 800 } });

    for (const ruta of PAGINAS) {
      test(`${ruta}: sin scroll horizontal y sin violaciones de axe`, async ({ page }) => {
        await sinTeselas(page);
        await page.goto(ruta);
        await expect(page.locator("h1")).toHaveCount(1);
        if (ruta === "/") {
          await page.getByRole("button", { name: "Mostrar mapa interactivo" }).click();
          await expect(page.locator(".leaflet-container")).toBeVisible();
          await expect(page.locator(".leaflet-container")).toBeFocused();
          await expect(
            page.getByRole("heading", { name: /Incidentes en el área visible/ }),
          ).toBeVisible();
        }
        expect(await hayScrollHorizontal(page)).toBe(false);
        expect(await violacionesAxe(page)).toEqual([]);
        await page.screenshot({
          path: `calidad/capturas/${ancho}${ruta.replaceAll("/", "_")}.png`,
          fullPage: true,
        });
      });
    }
  });
}

test.describe("reflow a 320 px (WCAG 1.4.10)", () => {
  test.use({ viewport: { width: 320, height: 640 } });
  test("la página principal no tiene scroll horizontal", async ({ page }) => {
    await sinTeselas(page);
    await page.goto("/");
    expect(await hayScrollHorizontal(page)).toBe(false);
  });
});

test("el formulario pasa a dos columnas desde 768 px y conserva una en móvil", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/reportar");
  const campos = page.getByRole("group", { name: "Datos del incidente" });
  const columnasMovil = await campos.evaluate(
    (elemento) => getComputedStyle(elemento).gridTemplateColumns.split(" ").length,
  );
  expect(columnasMovil).toBe(1);

  await page.setViewportSize({ width: 768, height: 800 });
  const columnasTablet = await campos.evaluate(
    (elemento) => getComputedStyle(elemento).gridTemplateColumns.split(" ").length,
  );
  expect(columnasTablet).toBe(2);
});
