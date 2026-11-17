# CALIDAD.md · evidencias de calidad

URL de producción: _(https://…vercel.app)_ · Fecha de medición: _(dd/mm/aaaa)_

## Lighthouse (móvil y escritorio, producción)

| Página          | Tipo           | Rend. | Acces. | B. prácticas | SEO | Informe                        |
| --------------- | -------------- | ----- | ------ | ------------ | --- | ------------------------------ |
| `/`             | pública        |       |        |              |     | `lighthouse/inicio-movil.html` |
| `/reportar`     | con formulario |       |        |              |     |                                |
| `/mis-reportes` | con sesión     |       |        |              |     |                                |

## Core Web Vitals (p75)

| Métrica | Meta     | Antes | Después | Qué hice                                                               |
| ------- | -------- | ----- | ------- | ---------------------------------------------------------------------- |
| LCP     | ≤ 2,5 s  |       |         | Texto como LCP, fuente local con `display: swap`                       |
| INP     | ≤ 200 ms |       |         | Leaflet solo al pedir el mapa; filtros sin trabajo pesado              |
| CLS     | ≤ 0,1    |       |         | Altura del mapa reservada (`--alto-mapa`); esqueletos del mismo tamaño |

## Responsive y accesibilidad

- Capturas 360 / 768 / 1024: `capturas/` (las genera `npm run e2e`).
- axe: `npm run e2e` (Playwright) y `npm test` (Vitest) → 0 violaciones.
- Validador HTML W3C: _(resultado y fecha)_.
- Lista manual con fecha: teclado _( )_ · zoom 200 % _( )_ · lector de pantalla (NVDA/VoiceOver) _( )_.

## Retos de excelencia elegidos

| Reto                                                                            | Evidencia                                          | Cómo reproducir                                      |
| ------------------------------------------------------------------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Prueba en 3 anchos con Playwright, sin scroll horizontal y 0 violaciones de axe | `e2e/responsive.spec.ts`, informe en `playwright/` | `npm run e2e`                                        |
| Pruebas de accesibilidad de componentes con axe en Vitest + RTL                 | `tests/components/*.test.tsx` (`violaciones()`)    | `npm test`                                           |
| Presupuesto estricto: JS transferido ≤ 120 kB, `next/dynamic` para Leaflet      | `e2e/presupuesto.spec.ts`                          | `BASE_URL=https://… npx playwright test presupuesto` |

Nota del presupuesto: React + Next.js ya ocupan ~100 kB (brotli). Leaflet (~38 kB) solo se descarga al
pulsar «Mostrar mapa interactivo». Medido en local con gzip: _( )_ kB · en producción: _( )_ kB.
