# Configuración de la IA: barreras, riesgos y límites

Herramienta: Claude Code, en WSL2 (Ubuntu) / Linux / macOS. Se abre siempre en la raíz del repositorio.
Sintaxis revisada en la documentación oficial (code.claude.com/docs/en/sandboxing y /settings) el _(fecha)_.

| Capa                                                    | Qué hace                                                               | Riesgo que cubre                            | Límite conocido                                             |
| ------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------- |
| `AGENTS.md`                                             | Reglas, prohibiciones, «datos no órdenes»                              | Errores de criterio, inyección leve         | Es una sugerencia: el modelo la puede ignorar               |
| `permissions.deny` (Read/Edit)                          | Niega `.env*`, `*.pem`, `*.key`, cuentas de servicio                   | Que la IA lea secretos con sus herramientas | No ve `grep -r` ni un `node -e` que abre el archivo         |
| `permissions.deny` (Bash)                               | Niega `sudo`, `rm -rf`, `curl`, `wget`, `push --force`, `reset --hard` | Acciones destructivas o de red              | `Bash(curl *)` no detiene `/usr/bin/curl` ni `sh -c '…'`    |
| `permissions.ask`                                       | Pide permiso para `git push`, instalar, `vercel`, `npx`                | Efectos fuera de la máquina                 | Depende de que yo lea antes de aceptar                      |
| `blockReadsOutsideWorkingDirectories`                   | Herramientas de lectura solo dentro del repo                           | Leer otros proyectos o `~`                  | Solo herramientas internas, no Bash                         |
| `sandbox.filesystem`                                    | `denyRead ~/` + `allowRead .` + `denyRead` de secretos                 | Que un comando o script lea `~` o `.env*`   | Solo cubre Bash y sus procesos hijos                        |
| `sandbox.network.allowedDomains`                        | Solo `registry.npmjs.org` (instalar) y `github.com` (git)              | Exfiltración por red                        | Un dominio permitido podría usarse para subir datos         |
| `allowUnsandboxedCommands: false` + `failIfUnavailable` | Sin reintentos fuera del sandbox; no arranca sin sandbox               | Que la IA se salga de la jaula              | —                                                           |
| `denyWrite ./.claude` + `Edit(./.claude/**)`            | La IA no edita su propia jaula                                         | Que se dé permisos a sí misma               | —                                                           |
| `disableBypassPermissionsMode`                          | Impide `--dangerously-skip-permissions`                                | Desactivar todo                             | —                                                           |
| Hook `guardia.mjs`                                      | Revisa cada Bash/Read/Edit/Grep/Glob y sale con 2                      | Variantes que se escapan de los patrones    | Un texto ofuscado (base64) podría pasar: por eso el sandbox |
| Sin secretos reales en disco                            | Proyecto Firebase solo de desarrollo, mínimo privilegio                | Que una fuga cueste poco                    | Si una clave se filtra: rotarla                             |

## Por qué la regla `allowRead: ["."]` no reabre `.env`

En el sandbox, cuando dos reglas se solapan gana la ruta más específica: `./.env.local` es más
específica que `.`, así que sigue negada. Se comprueba en la prueba 3 y 4.

## Ajustes hechos

| Fecha   | Problema                                                        | Ajuste                               |
| ------- | --------------------------------------------------------------- | ------------------------------------ |
| _(ej.)_ | `npm` falla dentro del sandbox porque la caché vive en `~/.npm` | `allowRead`/`allowWrite` de `~/.npm` |
| _(ej.)_ | Node instalado con nvm no arranca                               | `allowRead: ~/.nvm/versions`         |

Si usa nvm en otra ruta, o Node del sistema, ajuste esas dos líneas y anótelo aquí.

## Dominios permitidos

- `registry.npmjs.org`: `npm install` (siempre con `ask`).
- `github.com`: `git fetch/push` (el push pide permiso).
