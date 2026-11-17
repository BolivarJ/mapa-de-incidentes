import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorConReintento, Vacio } from "@/components/EstadoDatos";

describe("Estados de la interfaz", () => {
  it("el error se anuncia y permite reintentar", async () => {
    const onReintentar = vi.fn();
    render(<ErrorConReintento mensaje="El servidor respondió 500" onReintentar={onReintentar} />);
    expect(screen.getByRole("alert")).toHaveTextContent("No se pudieron cargar");
    await userEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    expect(onReintentar).toHaveBeenCalledOnce();
  });

  it("el estado vacío explica qué hacer", () => {
    render(<Vacio>No hay incidentes en esta zona.</Vacio>);
    expect(screen.getByText(/No hay incidentes/)).toBeInTheDocument();
  });
});
