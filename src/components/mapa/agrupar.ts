export type Punto<T> = { x: number; y: number; dato: T };
export type Grupo<T> = { x: number; y: number; datos: T[] };

/**
 * Agrupa puntos (en píxeles de pantalla) cuya distancia a la semilla del grupo es menor que `radio`.
 * Con radio ≥ tamaño del marcador × √2 dos semillas nunca se solapan (WCAG 2.5.8, tamaño del objetivo).
 */
export function agrupar<T>(puntos: Punto<T>[], radio: number): Grupo<T>[] {
  const grupos: Grupo<T>[] = [];
  for (const p of puntos) {
    const cercano = grupos.find((g) => Math.hypot(g.x - p.x, g.y - p.y) < radio);
    if (cercano) cercano.datos.push(p.dato);
    else grupos.push({ x: p.x, y: p.y, datos: [p.dato] });
  }
  return grupos;
}
