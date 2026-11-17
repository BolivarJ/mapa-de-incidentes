import { defineConfig, devices } from "@playwright/test";

const PUERTO = 3200;
// BASE_URL=https://su-app.vercel.app npm run e2e → mide producción (brotli) y no arranca servidor local.
const BASE_URL = process.env.BASE_URL;
// Para usar un Chrome ya instalado: CHROME_PATH=/usr/bin/google-chrome npm run e2e
const executablePath = process.env.CHROME_PATH;

export default defineConfig({
  testDir: "e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { outputFolder: "calidad/playwright", open: "never" }]],
  use: {
    baseURL: BASE_URL ?? `http://localhost:${PUERTO}`,
    locale: "es-CO",
    launchOptions: executablePath ? { executablePath } : {},
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: BASE_URL
    ? undefined
    : {
        command: `npm run build && npm run start -- -p ${PUERTO}`,
        url: `http://localhost:${PUERTO}`,
        reuseExistingServer: !process.env.CI,
        timeout: 180_000,
      },
});
