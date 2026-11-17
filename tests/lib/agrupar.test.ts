import { describe, expect, it } from "vitest";
import { agrupar } from "@/components/mapa/agrupar";

describe("agrupar (clustering de marcadores)", () => {
  it("une puntos cercanos y deja solos los lejanos", () => {
    const g = agrupar(
      [
        { x: 0, y: 0, dato: "a" },
        { x: 10, y: 10, dato: "b" },
        { x: 100, y: 0, dato: "c" },
      ],
      46,
    );
    expect(g.map((x) => x.datos)).toEqual([["a", "b"], ["c"]]);
  });

  it("las semillas de los grupos quedan a una distancia mayor o igual al radio", () => {
    const puntos = Array.from({ length: 50 }, (_, i) => ({
      x: (i * 37) % 200,
      y: (i * 53) % 200,
      dato: i,
    }));
    const g = agrupar(puntos, 46);
    for (const a of g)
      for (const b of g)
        if (a !== b) expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThanOrEqual(46);
    expect(g.flatMap((x) => x.datos)).toHaveLength(50);
  });

  it("sin puntos no hay grupos", () => expect(agrupar([], 46)).toEqual([]));
});
