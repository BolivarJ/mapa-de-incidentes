import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BotonApoyo } from "@/components/BotonApoyo";

afterEach(() => vi.unstubAllGlobals());

describe("BotonApoyo", () => {
  it("envía el apoyo y muestra el nuevo total", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ apoyos: 1 }, { status: 201 })),
    );
    render(<BotonApoyo id="incidente-1" apoyosIniciales={0} />);

    await user.click(screen.getByRole("button", { name: "A mí también me pasa" }));

    expect(fetch).toHaveBeenCalledWith(
      "/api/incidentes/incidente-1/apoyo",
      expect.objectContaining({ method: "POST" }),
    );
    expect(await screen.findByText("1 vecino dice «a mí también me pasa»")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Gracias, tu apoyo quedó registrado.");
  });

  it("explica cuando ya apoyó y cuando necesita iniciar sesión", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(
          Response.json({ error: "Ya apoyaste este reporte" }, { status: 409 }),
        )
        .mockResolvedValueOnce(Response.json({ error: "Inicia sesión" }, { status: 401 })),
    );
    render(<BotonApoyo id="incidente-1" apoyosIniciales={2} />);

    await user.click(screen.getByRole("button", { name: "A mí también me pasa" }));
    expect(await screen.findByRole("status")).toHaveTextContent("Ya apoyaste este reporte.");

    await user.click(screen.getByRole("button", { name: "A mí también me pasa" }));
    expect(await screen.findByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/iniciar-sesion",
    );
  });
});
