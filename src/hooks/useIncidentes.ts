"use client";
import { useCallback, useEffect, useState } from "react";
import type { Area } from "@/lib/ciudad";
import type { Filtros } from "@/services/bbox";
import type { IncidentePublico } from "@/schemas/constantes";

export type EstadoCarga =
  | { tipo: "cargando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "listo"; items: IncidentePublico[] };

export function construirUrl(area: Area, filtros: Filtros): string {
  const p = new URLSearchParams({
    norte: area.norte.toFixed(5),
    sur: area.sur.toFixed(5),
    este: area.este.toFixed(5),
    oeste: area.oeste.toFixed(5),
  });
  for (const [k, v] of Object.entries(filtros)) if (v) p.set(k, v);
  return `/api/incidentes?${p.toString()}`;
}

async function pedir(url: string, signal: AbortSignal): Promise<IncidentePublico[]> {
  const r = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`El servidor respondió ${r.status}`);
  const datos = (await r.json()) as { items: IncidentePublico[] };
  return datos.items;
}

type Resultado = { clave: string; estado: EstadoCarga };

/** Pide al servidor solo los incidentes del área visible, con filtros. */
export function useIncidentes(area: Area, filtros: Filtros) {
  const [resultado, setResultado] = useState<Resultado | null>(null);
  const [intento, setIntento] = useState(0);
  const url = construirUrl(area, filtros);
  const clave = `${url}#${intento}`;

  useEffect(() => {
    const control = new AbortController();
    pedir(url, control.signal)
      .then((items) => setResultado({ clave, estado: { tipo: "listo", items } }))
      .catch((e: unknown) => {
        if (control.signal.aborted) return;
        const mensaje = e instanceof Error ? e.message : "Error de red";
        setResultado({ clave, estado: { tipo: "error", mensaje } });
      });
    return () => control.abort();
  }, [url, clave]);

  const reintentar = useCallback(() => setIntento((n) => n + 1), []);
  const estado: EstadoCarga = resultado?.clave === clave ? resultado.estado : { tipo: "cargando" };
  return { estado, reintentar };
}
