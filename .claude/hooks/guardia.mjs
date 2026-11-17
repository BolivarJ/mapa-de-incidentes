// Hook PreToolUse: bloquea secretos, rutas fuera del proyecto y comandos de red/privilegio.
// Sale con código 2 y un mensaje en stderr para que Claude Code niegue la herramienta.
import path from "node:path";
import { fileURLToPath } from "node:url";

const SECRETO =
  /(^|[\\/\s"'=])(\.env(\.[\w.-]+)?|[\w.-]*firebase-adminsdk[\w.-]*\.json|[\w.-]+\.(pem|key))(?=$|[\s"';|&)<>])/i;
const PATRON_SECRETO = /(^|[\\/\s{,])\.env|\.(pem|key)\b|adminsdk/i;
const PERMITIDOS = new Set(["env.example"]);
const COMANDOS_PROHIBIDOS = new Set(["curl", "wget", "sudo", "su", "nc", "ncat", "ssh", "scp"]);
const RUTAS_SISTEMA = ["/dev/null", "/tmp/", "/usr/", "/bin/"];
const CAMPOS_RUTA = ["file_path", "path", "notebook_path"];

/** @param {string} texto */
export function mencionaSecreto(texto) {
  const coincidencia = SECRETO.exec(texto);
  if (!coincidencia) return false;
  return !PERMITIDOS.has(path.basename(coincidencia[2] ?? ""));
}

/** @param {string} ruta @param {string} raiz @param {string} cwd */
export function estaFuera(ruta, raiz, cwd) {
  if (RUTAS_SISTEMA.some((p) => ruta === p.replace(/\/$/, "") || ruta.startsWith(p))) return false;
  const expandida = ruta.replace(/^(~|\$HOME|\$\{HOME\})(?=\/|$)/, "/__home__");
  const absoluta = path.resolve(cwd, expandida);
  const relativa = path.relative(raiz, absoluta);
  return relativa.startsWith("..") || path.isAbsolute(relativa);
}

/** @param {string} comando */
export function tokens(comando) {
  return comando
    .split(/[\s;|&()<>`]+/)
    .map((t) => t.replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

/** @param {string} token */
function pareceRuta(token) {
  return /^(\/|~|\$HOME|\$\{HOME\}|\.\.)/.test(token) || token.includes("/..");
}

/** @param {string} comando @param {string} raiz @param {string} cwd */
export function revisarBash(comando, raiz, cwd) {
  const lista = tokens(comando);
  const prohibido = lista.find((t) => COMANDOS_PROHIBIDOS.has(path.basename(t)));
  if (prohibido) return `comando prohibido: ${path.basename(prohibido)}`;
  if (mencionaSecreto(comando)) return "el comando menciona un archivo de secretos";
  const fuera = lista.find((t) => pareceRuta(t) && estaFuera(t, raiz, cwd));
  if (fuera) return `ruta fuera del proyecto: ${fuera}`;
  return null;
}

/** @param {Record<string, unknown>} entrada @param {string} raiz @param {string} cwd */
export function revisarArchivo(entrada, raiz, cwd) {
  for (const campo of CAMPOS_RUTA) {
    const valor = entrada[campo];
    if (typeof valor !== "string") continue;
    if (mencionaSecreto(valor)) return `archivo de secretos: ${path.basename(valor)}`;
    if (estaFuera(valor, raiz, cwd)) return `ruta fuera del proyecto: ${valor}`;
  }
  const patron = [entrada.pattern, entrada.glob].filter((v) => typeof v === "string").join(" ");
  if (patron && PATRON_SECRETO.test(patron)) return "el patrón busca archivos de secretos";
  return null;
}

/**
 * @param {{ tool_name?: string, tool_input?: Record<string, unknown>, cwd?: string }} evento
 * @param {string} raiz
 * @returns {string | null} motivo del bloqueo o null si se permite
 */
export function evaluar(evento, raiz) {
  const cwd = evento.cwd ?? raiz;
  const entrada = evento.tool_input ?? {};
  if (evento.tool_name === "Bash") {
    return revisarBash(String(entrada.command ?? ""), raiz, cwd);
  }
  return revisarArchivo(entrada, raiz, cwd);
}

async function leerEntrada() {
  let datos = "";
  for await (const trozo of process.stdin) datos += trozo;
  return JSON.parse(datos || "{}");
}

async function principal() {
  const evento = await leerEntrada();
  const raiz = process.env.CLAUDE_PROJECT_DIR ?? evento.cwd ?? process.cwd();
  const motivo = evaluar(evento, raiz);
  if (motivo) {
    process.stderr.write(`Bloqueado por .claude/hooks/guardia.mjs: ${motivo}. Ver AGENTS.md.\n`);
    process.exit(2);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  principal().catch(() => {
    process.stderr.write("guardia.mjs: entrada no válida, se bloquea por precaución.\n");
    process.exit(2);
  });
}
