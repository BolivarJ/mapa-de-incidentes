import { ESTADOS, ETIQUETA_ESTADO } from "@/schemas/constantes";
import { SvgEstado } from "./FormaEstado";

export function Leyenda() {
  return (
    <figure className="leyenda">
      <figcaption>Forma del marcador según el estado</figcaption>
      <ul role="list">
        {ESTADOS.map((e) => (
          <li key={e}>
            <SvgEstado estado={e} tamano={22} /> {ETIQUETA_ESTADO[e]}
          </li>
        ))}
      </ul>
    </figure>
  );
}
