# IA.md · índice de la configuración de IA

| Archivo                                                         | Qué contiene                                                |
| --------------------------------------------------------------- | ----------------------------------------------------------- |
| [`../AGENTS.md`](../AGENTS.md) · [`../CLAUDE.md`](../CLAUDE.md) | Reglas del proyecto para la IA (orientan, no protegen)      |
| [`../.claude/settings.json`](../.claude/settings.json)          | Permisos, sandbox, red y hook (lo hace cumplir el programa) |
| [`../.claude/hooks/guardia.mjs`](../.claude/hooks/guardia.mjs)  | Hook PreToolUse propio · pruebas en `tests/hooks/`          |
| [`CONFIGURACION.md`](CONFIGURACION.md)                          | Riesgo que cubre cada barrera, límites y ajustes            |
| [`PRUEBAS-CONTENCION.md`](PRUEBAS-CONTENCION.md)                | Las 10 pruebas obligatorias con prompt, resultado y captura |
| [`BITACORA.md`](BITACORA.md)                                    | Bitácora de uso de la IA                                    |
| [`capturas/`](capturas/)                                        | Capturas de las pruebas                                     |

## Retos de excelencia de IA elegidos

1. **Hook PreToolUse propio** con 11 pruebas `node:test` (`npm run test:hook`).
   Reproducir: `npm run test:hook` y `echo '{"tool_name":"Bash","tool_input":{"command":"cat .env.local"}}' | node .claude/hooks/guardia.mjs; echo $?` → `2`.
2. **Escaneo de secretos con gitleaks** en pre-commit y CI, con reglas propias y prueba con clave falsa: [`SECRETOS.md`](SECRETOS.md).

## Salida de calidad

- `npm run check`: _(pegue la salida o enlace a `calidad/check.txt`)_
- CI en verde: _(enlace a GitHub Actions)_
