import axe from "axe-core";

/** Devuelve las violaciones de axe (WCAG 2.x A/AA) de un contenedor. */
export async function violaciones(contenedor: Element) {
  const r = await axe.run(contenedor, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"] },
    rules: { "color-contrast": { enabled: false } }, // jsdom no calcula estilos: se revisa con Lighthouse
  });
  return r.violations.map((v) => `${v.id}: ${v.help}`);
}
