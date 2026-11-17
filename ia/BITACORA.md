# Bitácora de IA

Formato por entrada: **propósito · evidencia · validación · decisión**.

## AAAA-MM-DD · Andamiaje inicial y configuración

- **Propósito:** generar la base del primer commit (configuración de IA, calidad) y el Hito 1.
- **Evidencia:** conversación con Claude (asistente) · archivos generados: _(lista)_.
- **Validación:** leí cada archivo, reescribí `AGENTS.md` con mis palabras, corrí `npm run check`
  y las pruebas de contención.
- **Decisión:** _(qué acepté, qué cambié y por qué)_.

## Casos en que rechacé o corregí a la IA (mínimo 3)

| Fecha      | Qué propuso la IA                                                  | Por qué estaba mal                                                                                                             | Qué hice                                                                                         |
| ---------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| 2026-11-16 | Crear un repositorio temporal en memoria para el POST de reportes. | El usuario señaló que sería trabajo provisional; además, sin sesión verificada la API no puede asignar correctamente el `uid`. | El estudiante pidió pausar y revisar el enfoque. No se conectó Firestore ni se creó el endpoint. |
|            |                                                                    |                                                                                                                                |                                                                                                  |
|            |                                                                    |                                                                                                                                |                                                                                                  |

## 2026-11-16 · Revisión de reglas y formulario inicial

- **Propósito:** adaptar las reglas del proyecto con aprobación del estudiante y comenzar el formulario accesible de reporte del Hito 2.
- **Evidencia:** `AGENTS.md` actualizado; formulario en `app/reportar` y `src/components/FormularioReporte.tsx`; lógica en `src/hooks/useFormularioReporte.ts`; pruebas en `tests/components/FormularioReporte.test.tsx`; capturas de Playwright en `calidad/capturas/`.
- **Validación:** 7 pruebas específicas del formulario, 44 pruebas Vitest y 11 pruebas del hook, `npm run check`, `npm run build` y 19 pruebas Playwright pasaron. La primera ejecución de `npm run check` detectó finales de línea en cuatro archivos nuevos; tras ejecutar `npm run format`, se volvió a ejecutar y pasó.
- **Decisión:** el formulario valida y muestra la foto localmente, pero no afirma guardar ni enviar el reporte. Firestore y Blob quedan para su integración posterior. El estudiante confirmó que la ruta `/reportar` carga correctamente.

## 2026-11-16 · Verificación antes del endpoint de creación

- **Propósito:** confirmar el estado del formulario y de los controles de calidad antes de comenzar la siguiente parte del Hito 2/3.
- **Evidencia:** página `/reportar`; pruebas `tests/components/FormularioReporte.test.tsx`; aplicación y reportes en `calidad/`.
- **Validación:** nueva ejecución de `npm run check` pasó (44 pruebas Vitest y 11 del hook); `npm run build` pasó; `npm run e2e` pasó (19 pruebas).
- **Decisión:** formulario todavía solo valida y muestra la imagen localmente; no crea ni persiste reportes. La API actual de incidentes continúa leyendo datos de ejemplo. Se propuso un repositorio de demostración, pero el estudiante pidió detener esa opción antes de implementar el endpoint y reconsiderar el diseño para evitar trabajo provisional y escrituras sin sesión verificada.

### Casos reales de revisión de IA

Pendiente: documentar al menos tres casos reales que el estudiante haya revisado, corregido o rechazado. No completar esta tabla con ejemplos inventados.

Nota de seguimiento: antes de que el estudiante pidiera pausar, se inició un borrador de pruebas para el POST en `tests/api/incidentes.test.ts`. No se ejecutó; se retiró al detener el trabajo para no dejar pruebas pendientes sin implementación. El diseño debe acordarse antes de retomarlo.

## 2026-11-16 · Lectura de incidentes desde Firestore

- **Propósito:** reemplazar datos de demostración en las lecturas de producción por Firestore con Firebase Admin SDK, sin habilitar escrituras antes de verificar la sesión.
- **Evidencia:** inicializador de Admin SDK en `src/lib/firebase-admin.ts`; repositorio en `src/repositories/incidentes-firestore.ts`; uso desde `app/api/incidentes/route.ts` y `app/incidentes/[id]/page.tsx`; reglas de Firestore mantienen denegadas las lecturas/escrituras directas desde el navegador.
- **Validación:** `npm run check` pasó (50 pruebas Vitest, 11 pruebas del hook y umbrales de cobertura); `npm run build` pasó. La lectura real de `/api/incidentes` respondió `{ items: [], siguienteCursor: null }`; las pruebas automatizadas de repositorio usan dobles.
- **Decisión:** la colección esperada es `incidentes` y el historial vive en su subcolección `historial`, ordenada por `creadoEn`. El envío de reportes, Blob, OpenAPI y Bruno siguen pendientes. Una credencial privada apareció en un adjunto y un reporte de exploración delegado también incluyó contenido local de `.env`; se recomendó revocar las claves expuestas y crear otra. No se guardan valores en la bitácora y la revocación no se puede comprobar desde el asistente.

## 2026-11-16 · Registro e inicio de sesión con cookie de servidor

- **Propósito:** agregar autenticación de correo/contraseña y una sesión comprobada en el servidor antes de habilitar reportes persistentes.
- **Evidencia:** páginas `app/iniciar-sesion` y `app/crear-cuenta`; formulario en `src/components/FormularioAcceso.tsx`; API de sesión en `app/api/sesion/route.ts`; verificación de cookie en `src/lib/sesion.ts`; controles de navegación en `src/components/MenuPrincipal.tsx`.
- **Validación:** 18 pruebas específicas de autenticación y 63 pruebas Vitest totales pasaron; `npm run check` y `npm run build` pasaron. El estudiante confirmó que el flujo de registro/inicio de sesión funcionó en Firebase local y creó la sesión; no se guardan datos de la cuenta en esta bitácora.
- **Decisión:** cookie `__session` HttpOnly, SameSite Strict, Secure en producción, cinco días, origen exacto comprobado y autenticación reciente requerida al crearla. La cookie se valida con comprobación de revocación; no se habilitó escritura ni se implementaron roles. El estudiante informó que rotó la clave de Admin tras la exposición; no se registran valores y queda pendiente proteger el endpoint de creación con la sesión verificada.

## 2026-11-16 · Creación segura de reportes

- **Propósito:** permitir que una persona autenticada envíe los datos validados del incidente y guardar el incidente con su historial inicial.
- **Evidencia:** servicio `src/services/crear-incidente.ts`; método de escritura atómica en `src/repositories/incidentes-firestore.ts`; `POST /api/incidentes`; envío desde `src/hooks/useFormularioReporte.ts` y formulario en `src/components/FormularioReporte.tsx`.
- **Validación:** 20 pruebas enfocadas pasaron; 69 pruebas Vitest totales, 11 pruebas de hooks, `npm run check` y `npm run build` pasaron. El estudiante autorizó y se completó un envío ficticio autenticado en Firebase de desarrollo; la consulta y la página de detalle confirmaron el incidente y el evento inicial de historial.
- **Decisión:** el reporte de prueba se guardó con estado `recibido`, apoyos en cero y `fotoUrl: null`; la foto sigue siendo solo una vista previa local. No se guardan en la bitácora el UID ni el ID del documento de prueba.

## 2026-11-16 · Consulta privada de “Mis reportes”

- **Propósito:** mostrar a cada persona únicamente los reportes asociados a su sesión verificada y evitar exponer el UID interno en el mapa público.
- **Evidencia:** consulta `uid == sesión.uid` en `src/repositories/incidentes-firestore.ts`; servicio `src/services/mis-reportes.ts`; página `app/mis-reportes/page.tsx`; tipo público `IncidentePublico` y proyección en `app/api/incidentes/route.ts`.
- **Validación:** 13 pruebas enfocadas y 71 pruebas Vitest totales pasaron; 11 pruebas de hooks y `npm run build` pasaron. En navegador, la sesión mostró el reporte de prueba y su consulta no incluyó el UID. Typecheck y lint pasaron; el último `npm run check` quedó detenido por Prettier en cuatro archivos.
- **Decisión:** el estado se muestra pero aún no se puede modificar: no existe interfaz ni endpoint de transición. El siguiente flujo sería una pantalla de Gestión protegida por rol y una operación que cambie estado e inserte el evento de historial en la misma transacción/lote. No se permite al reportante cambiar su propio estado.

## 2026-11-16 · Aislar e2e de los datos de Firestore

- **Propósito:** corregir pruebas de Hito 1 que asumían que los seis incidentes demo seguían disponibles en la aplicación, aunque la fuente real ya es Firestore.
- **Evidencia:** helper `conIncidentesDeEjemplo` en `e2e/apoyo.ts`, usado por los dos flujos que requieren datos; los datos de ejemplo se mantienen fuera del repositorio de producción.
- **Validación:** `npm run e2e` pasó (19/19); `npm run check` pasó (71 pruebas Vitest, 11 pruebas del hook, typecheck, lint y Prettier).
- **Decisión:** Playwright intercepta `/api/incidentes` para esos escenarios; no se reintroduce fallback de datos de ejemplo en producción. La prueba de teclado valida el enlace y su navegación, sin exigir que el ID de ejemplo exista en Firestore.

## 2026-11-16 · Alternativa de ubicación al denegar permiso

- **Propósito:** cumplir el pendiente de Hito 2: permitir marcar manualmente el punto cuando el navegador deniega la geolocalización, sin retirar los campos de latitud/longitud.
- **Evidencia:** `src/components/mapa/SelectorUbicacion.tsx` muestra Leaflet limitado a la ciudad; `src/hooks/useFormularioReporte.ts` abre el selector solo ante `PERMISSION_DENIED` y copia el punto elegido a los campos; prueba en `tests/components/FormularioReporte.test.tsx`.
- **Validación:** `npm run check` pasó (72 pruebas Vitest y 11 de seguridad); `npm run build` pasó; `npm run e2e` pasó (19/19). La prueba del formulario cubre permiso denegado, mapa visible, selección y actualización de coordenadas.
- **Decisión:** Leaflet se carga bajo demanda para el formulario solo cuando hace falta. Se conservan las coordenadas manuales; el mapa no pide permiso de ubicación ni escribe datos automáticamente.

## 2026-11-16 · Formulario en dos columnas desde 768 px

- **Propósito:** cumplir el requisito responsive del Hito 2 sin reducir la usabilidad en móvil.
- **Evidencia:** grupo accesible “Datos del incidente” en `src/components/FormularioReporte.tsx`; CSS mobile-first en `src/components/FormularioReporte.module.css`; prueba de layout en `e2e/responsive.spec.ts`.
- **Validación:** Playwright midió una columna a 360 px y dos columnas a 768 px; `npm run e2e` pasó (20/20), `npm run check` pasó (72 Vitest y 11 hooks de seguridad) y `npm run build` pasó.
- **Decisión:** solo categoría y descripción comparten las dos columnas; ubicación, foto y envío conservan ancho completo para mantener etiquetas y controles legibles.

## 2026-11-16 · Publicación inicial en GitHub y corrección de escaneo

- **Propósito:** publicar el estado verificado del proyecto en el remoto autorizado, en el orden de commits indicado por `PASOS.md`, y revisar el escaneo de secretos del historial.
- **Evidencia:** cuatro commits ordenados en `main`; `.env.local` confirmado fuera del índice; hooks de Husky instalados después de inicializar Git.
- **Validación:** `npm run check` pasó (72 pruebas Vitest y 11 de seguridad); el push pasó su hook pre-push. Gitleaks señaló un falso positivo en el fixture de clave PEM de una prueba; se reemplazó el fixture por líneas ficticias, se añadió una excepción exacta para el marcador histórico y el escaneo local reportó “no leaks found”.
- **Decisión:** no se reescribió el historial remoto ni se saltaron hooks. Los commits se publicaron en GitHub. La CI completa quedó finalmente confirmada en verde en la ejecución posterior al commit de procesamiento de fotos; no se guardan secretos ni identificadores personales.

## 2026-11-16 · E2E de CI independientes de Firebase

- **Propósito:** corregir el job e2e de GitHub Actions, que no dispone de `.env.local` ni debe necesitar credenciales reales de Firebase.
- **Evidencia:** Playwright proporciona fixtures para `/api/incidentes` y una página de detalle de ejemplo desde `e2e/apoyo.ts`; filtros, presupuesto, responsive y navegación no requieren Firestore.
- **Validación:** reproducción local con credenciales Admin deliberadamente inválidas: `npm run e2e` pasó (20/20). `npm run check` pasó (72 Vitest y 11 hooks) y `npm run build` pasó. La ejecución CI previa falló por Axe `document-title` en la página de detalle real y pruebas del mapa que consultaban Firestore sin credenciales; la ejecución CI posterior, asociada al commit `5a4ca62`, terminó correctamente.
- **Decisión:** fixtures solo dentro de Playwright; producción sigue usando Firestore. El arreglo está publicado y la CI final se confirmó en verde.

## 2026-11-16 · Procesamiento local y privacidad de fotos

- **Propósito:** avanzar el requisito de Hito 2 de reducir imágenes a ≤ 5 MB y permitir solicitar la eliminación de metadatos de ubicación.
- **Evidencia:** procesamiento con `createImageBitmap` y Canvas en `src/lib/procesar-foto.ts`; elección de privacidad y vista previa en `src/components/CamposFormularioReporte.tsx`; estado temporal del archivo en `src/hooks/useFormularioReporte.ts`; pruebas en `tests/lib/procesar-foto.test.ts` y `tests/components/FormularioReporte.test.tsx`.
- **Validación:** 15 pruebas focalizadas del procesador/formulario pasaron; `npm run check` pasó (78 pruebas Vitest y 11 hooks), `npm run build` pasó y Playwright pasó (20/20).
- **Decisión:** archivos bajo 5 MB se conservan si no se solicita quitar metadatos; si se solicita, o si exceden el límite, se reencodean como imagen optimizada y la conversión elimina metadatos EXIF. La foto permanece local y aún no se envía a Vercel Blob; el mensaje de interfaz lo aclara.

## 2026-11-16 · Corrección del 500 en Vercel

- **Propósito:** corregir el error 500 de producción identificado en los logs de runtime de Vercel.
- **Evidencia:** `/`, `/reportar` y `/api/incidentes` fallaban al cargar `firebase-admin/auth`: `jwks-rsa@4.1.0` usaba `require()` para cargar `jose@6`, ESM no compatible con el cargador CommonJS observado en Vercel.
- **Validación:** se cambió Firebase Admin a 13.10.0, que resuelve `jwks-rsa@3.2.2` y `jose@4.15.9`; Node cargó Auth y Firestore, `npm run check` (78 Vitest + 11 hooks), `npm run build` y Playwright (20/20) pasaron. El cambio está listo para push y redeploy; aún no se ha verificado el dominio tras el redeploy.
- **Decisión:** mantener Admin SDK 13.10.0 por compatibilidad con el runtime de producción. `npm audit` reporta avisos moderados en dependencias transitivas; el umbral CI `high` no los bloquea. No se editaron variables ni secretos de Vercel.
