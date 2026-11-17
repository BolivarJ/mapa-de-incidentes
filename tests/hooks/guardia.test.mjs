// Pruebas del hook PreToolUse (node:test). Ejecutar: npm run test:hook
import { test } from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { evaluar } from "../../.claude/hooks/guardia.mjs";

const RAIZ = "/home/ana/proyectos/46-mapa-de-incidentes";
const bash = (command) => evaluar({ tool_name: "Bash", tool_input: { command }, cwd: RAIZ }, RAIZ);
const leer = (file_path) =>
  evaluar({ tool_name: "Read", tool_input: { file_path }, cwd: RAIZ }, RAIZ);

test("1. bloquea leer .env.local con la herramienta Read", () => {
  assert.match(leer(`${RAIZ}/.env.local`), /secretos/);
});

test("2. bloquea cat .env.local y variantes con comillas", () => {
  assert.ok(bash("cat .env.local"));
  assert.ok(bash("head -n1 './.env'"));
  assert.ok(bash("node -e \"require('fs').readFileSync('.env.local')\""));
});

test("3. bloquea claves privadas y cuentas de servicio", () => {
  assert.ok(leer(`${RAIZ}/clave.pem`));
  assert.ok(leer(`${RAIZ}/mi-proyecto-firebase-adminsdk-abc12.json`));
});

test("4. permite env.example", () => {
  assert.equal(leer(`${RAIZ}/env.example`), null);
  assert.equal(bash("cat env.example"), null);
});

test("5. bloquea curl, wget y sudo, también con ruta absoluta", () => {
  assert.match(bash("curl https://ejemplo.com"), /curl/);
  assert.match(bash("/usr/bin/curl https://ejemplo.com"), /curl/);
  assert.match(bash("sh -c 'wget x'"), /wget/);
  assert.match(bash("sudo apt-get install x"), /sudo/);
});

test("6. bloquea salir de la carpeta con ..", () => {
  assert.match(bash("ls .."), /fuera/);
  assert.match(bash("cat ../otro-proyecto/README.md"), /fuera/);
});

test("7. bloquea la carpeta personal (~ y $HOME)", () => {
  assert.ok(bash("cat ~/.bashrc"));
  assert.ok(bash("touch $HOME/archivo"));
  assert.ok(leer("/home/ana/.ssh/id_ed25519"));
});

test("8. bloquea Grep/Glob que buscan secretos", () => {
  const r = evaluar({ tool_name: "Glob", tool_input: { pattern: "**/.env*" }, cwd: RAIZ }, RAIZ);
  assert.ok(r);
});

test("9. permite comandos normales del proyecto", () => {
  assert.equal(bash("npm run check"), null);
  assert.equal(bash("git diff -- src/services/bbox.ts"), null);
  assert.equal(bash("ls src/components > /dev/null"), null);
  assert.equal(leer(`${RAIZ}/src/schemas/incidente.ts`), null);
});

test("10. el proceso sale con código 2 y escribe en stderr", () => {
  const evento = JSON.stringify({ tool_name: "Bash", tool_input: { command: "cat .env.local" } });
  const r = spawnSync("node", [".claude/hooks/guardia.mjs"], {
    input: evento,
    env: { ...process.env, CLAUDE_PROJECT_DIR: RAIZ },
  });
  assert.equal(r.status, 2);
  assert.match(r.stderr.toString(), /Bloqueado/);
});

test("11. una entrada no válida se bloquea por precaución", () => {
  const r = spawnSync("node", [".claude/hooks/guardia.mjs"], { input: "{no es json" });
  assert.equal(r.status, 2);
});
