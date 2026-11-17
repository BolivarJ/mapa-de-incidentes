import { describe, expect, it } from "vitest";
import {
  cumpleFiltros,
  dentroDeArea,
  filtrarIncidentes,
  intersecar,
  rectanguloDe,
} from "@/services/bbox";
import { INCIDENTES_EJEMPLO } from "@/repositories/incidentes-ejemplo";
import type { Incidente } from "@/schemas/incidente";

const area = { sur: 6.2, norte: 6.3, oeste: -75.6, este: -75.5 };
const base = INCIDENTES_EJEMPLO[0] as Incidente;

describe("dentroDeArea", () => {
  it("incluye los bordes del rectángulo", () => {
    expect(dentroDeArea({ lat: 6.2, lng: -75.6 }, area)).toBe(true);
    expect(dentroDeArea({ lat: 6.3, lng: -75.5 }, area)).toBe(true);
  });
  it("excluye puntos fuera por latitud o por longitud", () => {
    expect(dentroDeArea({ lat: 6.31, lng: -75.55 }, area)).toBe(false);
    expect(dentroDeArea({ lat: 6.25, lng: -75.49 }, area)).toBe(false);
  });
});

describe("rectanguloDe", () => {
  it("devuelve null sin puntos", () => expect(rectanguloDe([])).toBeNull());
  it("calcula el rectángulo con margen", () => {
    const r = rectanguloDe(
      [
        { lat: 1, lng: 2 },
        { lat: 3, lng: -1 },
      ],
      0.5,
    );
    expect(r).toEqual({ sur: 0.5, norte: 3.5, oeste: -1.5, este: 2.5 });
  });
});

describe("intersecar", () => {
  it("recorta al área común", () => {
    expect(intersecar(area, { sur: 6.25, norte: 7, oeste: -76, este: -75.55 })).toEqual({
      sur: 6.25,
      norte: 6.3,
      oeste: -75.6,
      este: -75.55,
    });
  });
  it("devuelve null si no se cruzan", () => {
    expect(intersecar(area, { sur: 7, norte: 8, oeste: -75.6, este: -75.5 })).toBeNull();
  });
});

describe("filtros", () => {
  it("filtra por categoría, estado y fecha", () => {
    expect(cumpleFiltros(base, { categoria: "hueco" })).toBe(true);
    expect(cumpleFiltros(base, { categoria: "basuras" })).toBe(false);
    expect(cumpleFiltros(base, { estado: "resuelto" })).toBe(false);
    expect(cumpleFiltros(base, { desde: "2026-11-10" })).toBe(true);
    expect(cumpleFiltros(base, { desde: "2026-11-11" })).toBe(false);
  });
  it("filtrarIncidentes combina área y filtros y ordena por fecha descendente", () => {
    const r = filtrarIncidentes(INCIDENTES_EJEMPLO, area, { categoria: "hueco" });
    expect(r.map((i) => i.id)).toEqual(["i-004", "i-001"]);
  });
});
