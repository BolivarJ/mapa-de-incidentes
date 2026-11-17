import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Filtros } from "@/components/Filtros";
import { violaciones } from "./axe";

describe("Filtros", () => {
  it("cada control tiene etiqueta y avisa el cambio", async () => {
    const onCambio = vi.fn();
    render(<Filtros valor={{}} onCambio={onCambio} />);
    await userEvent.selectOptions(screen.getByLabelText("Estado"), "resuelto");
    expect(onCambio).toHaveBeenLastCalledWith({ estado: "resuelto" });
    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "luminaria");
    expect(onCambio).toHaveBeenLastCalledWith({ categoria: "luminaria" });
  });

  it("volver a «Todas» quita el filtro y «Limpiar filtros» los borra", async () => {
    const onCambio = vi.fn();
    render(<Filtros valor={{ categoria: "hueco", estado: "recibido" }} onCambio={onCambio} />);
    await userEvent.selectOptions(screen.getByLabelText("Categoría"), "");
    expect(onCambio).toHaveBeenLastCalledWith({ categoria: undefined, estado: "recibido" });
    await userEvent.click(screen.getByRole("button", { name: "Limpiar filtros" }));
    expect(onCambio).toHaveBeenLastCalledWith({});
  });

  it("se usa con teclado y no tiene violaciones de axe", async () => {
    const { container } = render(<Filtros valor={{}} onCambio={vi.fn()} />);
    await userEvent.tab();
    expect(screen.getByLabelText("Categoría")).toHaveFocus();
    expect(await violaciones(container)).toEqual([]);
  });
});
