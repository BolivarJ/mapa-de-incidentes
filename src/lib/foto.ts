export const TAMANO_MAXIMO_FOTO = 5 * 1024 * 1024;
export const TIPOS_FOTO = ["image/jpeg", "image/png", "image/webp"] as const;

export type TipoFoto = (typeof TIPOS_FOTO)[number];

export function esTipoFoto(tipo: string): tipo is TipoFoto {
  return TIPOS_FOTO.some((permitido) => permitido === tipo);
}
