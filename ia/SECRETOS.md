# Escaneo de secretos con gitleaks (reto de IA)

**Qué cubre:** que una clave real (cuenta de servicio de Firebase, token de Vercel Blob, clave privada o el
canario de las pruebas) llegue a Git, aunque la haya escrito yo o la IA.

| Capa       | Dónde                                           | Comando                                                                                    |
| ---------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Pre-commit | `.husky/pre-commit`                             | `gitleaks git --pre-commit --staged --redact --verbose --config .gitleaks.toml`            |
| CI         | `.github/workflows/ci.yml` (trabajo `secretos`) | `gitleaks git --redact --verbose --config .gitleaks.toml .` sobre todo el historial        |
| Reglas     | `.gitleaks.toml`                                | Reglas por defecto + `vercel-blob-token`, `firebase-service-account`, `canario-contencion` |

## Instalar (WSL2 / Linux)

```bash
V=8.30.1
curl -sSfL -o /tmp/gl.tgz "https://github.com/gitleaks/gitleaks/releases/download/v$V/gitleaks_${V}_linux_x64.tar.gz"
tar -xzf /tmp/gl.tgz -C /tmp gitleaks && sudo mv /tmp/gitleaks /usr/local/bin/ && gitleaks version
```

macOS: `brew install gitleaks`.

## Prueba con una clave falsa plantada (evidencia)

```bash
printf 'BLOB=vercel_blob_rw_AbCdEfGh12345678_ZyXwVuTs87654321\n' > planta.txt
git add planta.txt
git commit -m "test: planta"        # debe FALLAR: gitleaks encuentra vercel-blob-token
git restore --staged planta.txt && rm planta.txt
```

Repita con `CANARIO=ZZZ-NO-ES-UN-SECRETO` (regla `canario-contencion`).
En la CI: abra una rama, haga commit con `git commit --no-verify` y push → el trabajo `secretos` queda en rojo. Borre la rama.

| Fecha | Prueba                            | Resultado | Captura                           |
| ----- | --------------------------------- | --------- | --------------------------------- |
|       | Clave de Blob falsa en pre-commit |           | `capturas/gitleaks-precommit.png` |
|       | Canario en pre-commit             |           |                                   |
|       | `--no-verify` + push → CI roja    |           | `capturas/gitleaks-ci.png`        |

## Límites

- Solo detecta patrones conocidos: una clave sin formato reconocible puede pasar.
- `git commit --no-verify` salta el pre-commit; por eso también corre en la CI sobre todo el historial.
- Si una clave real llega a GitHub: **rotarla**. Borrar el commit no basta.
