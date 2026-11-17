import type { Estado } from "@/schemas/constantes";

// La forma cambia con el estado (criterio 2: no depender solo del color).
// recibido = círculo · en proceso = triángulo · resuelto = cuadrado con chulo.
type Figura = { etiqueta: "circle" | "path" | "rect"; atributos: Record<string, string> };

export const FIGURAS: Record<Estado, Figura[]> = {
  recibido: [{ etiqueta: "circle", atributos: { cx: "16", cy: "16", r: "11" } }],
  en_proceso: [{ etiqueta: "path", atributos: { d: "M16 4 L29 27 H3 Z" } }],
  resuelto: [
    { etiqueta: "rect", atributos: { x: "5", y: "5", width: "22", height: "22", rx: "3" } },
    { etiqueta: "path", atributos: { d: "M10 16.5l4 4 8-9", class: "chulo" } },
  ],
};

function aTexto(figura: Figura): string {
  const attrs = Object.entries(figura.atributos)
    .map(([k, v]) => `${k}="${v}"`)
    .join(" ");
  return `<${figura.etiqueta} ${attrs} />`;
}

/** SVG como texto para los marcadores de Leaflet (solo datos constantes, nunca del usuario). */
export function svgEstado(estado: Estado, tamano = 32): string {
  const cuerpo = FIGURAS[estado].map(aTexto).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${tamano}" height="${tamano}" class="forma forma--${estado}" aria-hidden="true" focusable="false">${cuerpo}</svg>`;
}
