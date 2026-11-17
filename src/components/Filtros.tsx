"use client";
import type { Filtros as TFiltros } from "@/services/bbox";
import { CATEGORIAS, ESTADOS, ETIQUETA_CATEGORIA, ETIQUETA_ESTADO } from "@/schemas/constantes";
import type { Categoria, Estado } from "@/schemas/constantes";
import styles from "./Filtros.module.css";

type Props = { valor: TFiltros; onCambio: (f: TFiltros) => void };

const opcional = <T extends string>(v: string) => (v === "" ? undefined : (v as T));

type PropsSelector<T extends string> = {
  etiqueta: string;
  nombre: string;
  todos: string;
  opciones: readonly T[];
  textos: Record<T, string>;
  valor: T | undefined;
  onCambio: (v: T | undefined) => void;
};

function Selector<T extends string>(p: PropsSelector<T>) {
  return (
    <label>
      {p.etiqueta}
      <select
        name={p.nombre}
        value={p.valor ?? ""}
        onChange={(e) => p.onCambio(opcional<T>(e.target.value))}
      >
        <option value="">{p.todos}</option>
        {p.opciones.map((o) => (
          <option key={o} value={o}>
            {p.textos[o]}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Filtros({ valor, onCambio }: Props) {
  return (
    <form className={styles.filtros} role="search" aria-label="Filtrar incidentes" method="get">
      <fieldset>
        <legend>Filtrar</legend>
        <Selector<Categoria>
          etiqueta="Categoría"
          nombre="categoria"
          todos="Todas"
          opciones={CATEGORIAS}
          textos={ETIQUETA_CATEGORIA}
          valor={valor.categoria}
          onCambio={(categoria) => onCambio({ ...valor, categoria })}
        />
        <Selector<Estado>
          etiqueta="Estado"
          nombre="estado"
          todos="Todos"
          opciones={ESTADOS}
          textos={ETIQUETA_ESTADO}
          valor={valor.estado}
          onCambio={(estado) => onCambio({ ...valor, estado })}
        />
        <label>
          Desde
          <input
            type="date"
            name="desde"
            value={valor.desde ?? ""}
            onChange={(e) => onCambio({ ...valor, desde: opcional<string>(e.target.value) })}
          />
        </label>
        <button type="reset" className="boton boton--secundario" onClick={() => onCambio({})}>
          Limpiar filtros
        </button>
      </fieldset>
    </form>
  );
}
