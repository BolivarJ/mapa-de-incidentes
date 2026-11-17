# 46 · Mapa de incidentes ciudadanos

Reporta problemas del barrio (huecos, luminarias dañadas, basuras) en un mapa, con foto y estado de atención.

Next.js 16 (App Router) · React 19 · TypeScript strict · Leaflet + OpenStreetMap · Zod · Firebase (Auth + Firestore vía Admin SDK) · Vercel Blob.

## Ejecutar

```bash
npm ci
cp env.example .env.local   # valores de un proyecto Firebase SOLO de desarrollo
npm run dev                 # http://localhost:3000
npm run check               # typecheck + lint + formato + pruebas (con cobertura) + pruebas del hook
npm run e2e                 # Playwright: 3 anchos, axe, flujos y presupuesto de JS
npm run build && npm start
```

Requiere Node ≥ 22. En Windows, trabaje en WSL2 (Ubuntu) para que funcione el sandbox de la IA.

## Estado por hito

| Hito                                                                         | Estado                                                                                                  |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 1 · Mapa + lista accesible, fetch con carga/vacío/error, configuración de IA | ✅ Interfaz y estados; los datos de ejemplo quedan como fixtures de pruebas                             |
| 2 · Formularios, rutas, reportar con foto y ubicación                        | Parcial: formulario, mapa alternativo, diseño responsive y fotos optimizadas localmente; Blob pendiente |
| 3 · API por capas con Firestore, `openapi.yaml`, Bruno                       | Parcial: lecturas y creación con Firestore; OpenAPI y Bruno pendientes                                  |
| 4 · Auth con cookie de sesión, roles, despliegue, evidencias                 | Parcial: auth y “Mis reportes”; roles de Gestión y despliegue pendientes                                |

## API disponible

`GET /api/incidentes?norte=&sur=&este=&oeste=&categoria=&estado=&desde=&limite=` → `{ items, siguienteCursor }`.
Consulta el rango de latitud en el repositorio y filtra la longitud en el servidor (Firestore solo admite rango en un campo). Errores `{ error, detalles? }`.

`POST /api/incidentes` requiere una sesión verificada y acepta `{ categoria, descripcion, lat, lng }`. El servidor asigna el `uid`, estado inicial y fecha, y escribe el incidente junto con el primer evento de historial en un lote atómico. La foto se optimiza localmente a un máximo de 5 MB y existe una opción para quitar metadatos reencodeándola, pero aún no se adjunta ni se sube a Blob.

La lectura usa la colección `incidentes`; el ID del documento es el ID del incidente y sus campos se validan con el esquema compartido. El historial se lee desde la subcolección `historial`, ordenado por `creadoEn`. El endpoint público omite `uid`; “Mis reportes” filtra en el servidor por el UID de la sesión verificada.

La autenticación intercambia un ID token reciente de Firebase por la cookie HttpOnly `__session`, con comprobación de origen y expiración de cinco días. El servidor valida la sesión con Firebase Admin y comprueba revocación.

## Dependencias y por qué

| Paquete                                                      | Motivo                                                                                                                   |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| `leaflet`                                                    | Mapa ligero (~40 kB gzip), cargado con `next/dynamic` y `ssr: false`                                                     |
| `zod`                                                        | Un solo esquema de validación para cliente y servidor                                                                    |
| `firebase`, `firebase-admin`                                 | Auth en el navegador; Firestore y cookies de sesión en el servidor. Admin 13.10 evita incompatibilidad CJS/ESM de Vercel |
| `@vercel/blob`                                               | Fotos de los incidentes                                                                                                  |
| `vitest`, `@testing-library/*`, `jsdom`, `axe-core`          | Pruebas unitarias, de componentes y de accesibilidad                                                                     |
| `eslint-config-prettier`, `prettier`, `husky`, `lint-staged` | Calidad automática en commit y push                                                                                      |

`overrides` en `package.json` fuerza versiones parcheadas de `@grpc/grpc-js`, `zod` y `minimatch` (avisos altos de `npm audit` en dependencias transitivas de `firebase` y `@vercel/blob`).

## Decisiones

- **Fuente local** (`app/fuentes`, licencia OFL) en lugar de `next/font/google`: la compilación no depende de la red (tampoco dentro del sandbox de la IA).
- **Constantes sin Zod** (`src/schemas/constantes.ts`) para el navegador: importar el esquema en componentes de cliente subía el JS de ~135 kB a ~210 kB gzip.
- **Fachada del mapa:** una vista previa sin librería muestra los puntos; Leaflet (~38 kB) se descarga solo al pulsar «Mostrar mapa interactivo» (reto JS ≤ 120 kB).
- **Agrupación de marcadores** propia (`src/components/mapa/agrupar.ts`): evita marcadores superpuestos (WCAG 2.5.8) sin otra dependencia.
- **El estado del marcador cambia de forma** (círculo, triángulo, cuadrado con chulo) además de color, y la lista muestra el estado en texto.

## IA y calidad

- Configuración de la IA: [`ia/IA.md`](ia/IA.md) · Secretos: [`ia/SECRETOS.md`](ia/SECRETOS.md) · Evidencias de calidad: [`calidad/CALIDAD.md`](calidad/CALIDAD.md).
