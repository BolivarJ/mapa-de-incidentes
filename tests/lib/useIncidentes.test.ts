import { describe, expect, it } from "vitest";
import { construirUrl } from "@/hooks/useIncidentes";

describe("construirUrl", () => {
  it("incluye el área y solo los filtros definidos", () => {
    const u = construirUrl(
      { norte: 6.3, sur: 6.2, este: -75.5, oeste: -75.6 },
      { estado: "resuelto" },
    );
    expect(u).toBe(
      "/api/incidentes?norte=6.30000&sur=6.20000&este=-75.50000&oeste=-75.60000&estado=resuelto",
    );
  });
});
