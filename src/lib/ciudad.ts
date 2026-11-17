export type Area = { norte: number; sur: number; este: number; oeste: number };

const POR_DEFECTO: Area = { sur: 6.13, norte: 6.37, oeste: -75.7, este: -75.47 };

/** Lee "sur,norte,oeste,este" de NEXT_PUBLIC_CIUDAD_LIMITES; si falta o es inválido usa Medellín. */
export function leerLimites(texto: string | undefined): Area {
  const partes = (texto ?? "").split(",").map(Number);
  const [sur, norte, oeste, este] = partes;
  const validos =
    partes.length === 4 &&
    partes.every(Number.isFinite) &&
    sur !== undefined &&
    norte !== undefined &&
    oeste !== undefined &&
    este !== undefined &&
    sur < norte &&
    oeste < este;
  return validos ? { sur, norte, oeste, este } : POR_DEFECTO;
}

export const CIUDAD = {
  nombre: process.env.NEXT_PUBLIC_CIUDAD_NOMBRE ?? "Medellín",
  limites: leerLimites(process.env.NEXT_PUBLIC_CIUDAD_LIMITES),
};
