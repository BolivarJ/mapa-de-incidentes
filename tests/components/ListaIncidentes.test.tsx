import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ListaIncidentes } from "@/components/ListaIncidentes";
import { INCIDENTES_EJEMPLO } from "@/repositories/incidentes-ejemplo";
import { violaciones } from "./axe";

describe("ListaIncidentes (alternativa accesible al mapa)", () => {
  it("muestra un elemento de lista por incidente con enlace al detalle", () => {
    render(<ListaIncidentes incidentes={INCIDENTES_EJEMPLO} />);
    const lista = screen.getByRole("list");
    expect(within(lista).getAllByRole("listitem")).toHaveLength(INCIDENTES_EJEMPLO.length);
    const enlaces = within(lista).getAllByRole("link", { name: "Hueco en la vía" });
    expect(enlaces[0]).toHaveAttribute("href", "/incidentes/i-001");
  });

  it("comunica el estado con texto, no solo con color", () => {
    render(<ListaIncidentes incidentes={INCIDENTES_EJEMPLO.slice(2, 3)} />);
    expect(screen.getByText("Resuelto")).toBeInTheDocument();
  });

  it("no tiene violaciones de axe", async () => {
    const { container } = render(<ListaIncidentes incidentes={INCIDENTES_EJEMPLO} />);
    expect(await violaciones(container)).toEqual([]);
  });
});
