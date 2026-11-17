import type { Estado } from "@/schemas/constantes";
import { ETIQUETA_ESTADO } from "@/schemas/constantes";
import { FIGURAS } from "./mapa/iconos";

export function SvgEstado({ estado, tamano = 18 }: { estado: Estado; tamano?: number }) {
  return (
    <svg
      viewBox="0 0 32 32"
      width={tamano}
      height={tamano}
      className={`forma forma--${estado}`}
      aria-hidden="true"
      focusable="false"
    >
      {FIGURAS[estado].map(({ etiqueta: Etiqueta, atributos }, i) => {
        const { class: clase, ...resto } = atributos;
        return <Etiqueta key={i} className={clase} {...resto} />;
      })}
    </svg>
  );
}

/** Insignia de estado: forma + texto visible. */
export function FormaEstado({ estado }: { estado: Estado }) {
  return (
    <span className="insignia" data-estado={estado}>
      <SvgEstado estado={estado} />
      {ETIQUETA_ESTADO[estado]}
    </span>
  );
}
