import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FormularioReporte } from "@/components/FormularioReporte";
import { violaciones } from "./axe";

vi.mock("@/components/mapa/SelectorUbicacion", () => ({
  SelectorUbicacion: ({ seleccionar }: { seleccionar: (lat: number, lng: number) => void }) => (
    <section role="region" aria-label="Elegir ubicación en el mapa">
      <button type="button" onClick={() => seleccionar(6.2442, -75.5812)}>
        Seleccionar punto de prueba
      </button>
    </section>
  ),
}));

function completarCampos() {
  fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "hueco" } });
  fireEvent.change(screen.getByLabelText("Descripción"), {
    target: { value: "Hueco profundo frente al parque" },
  });
  fireEvent.change(screen.getByLabelText("Latitud"), { target: { value: "6.25" } });
  fireEvent.change(screen.getByLabelText("Longitud"), { target: { value: "-75.57" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("FormularioReporte", () => {
  it("presenta campos etiquetados y alternativa de ubicación manual", () => {
    render(<FormularioReporte />);

    expect(screen.getByRole("form", { name: "Reporte de incidente" })).toBeInTheDocument();
    expect(screen.getByLabelText("Categoría")).toBeInTheDocument();
    expect(screen.getByLabelText("Descripción")).toBeInTheDocument();
    expect(screen.getByLabelText("Latitud")).toBeInTheDocument();
    expect(screen.getByLabelText("Longitud")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar mi ubicación" })).toBeInTheDocument();
  });

  it("anuncia errores de validación junto a los campos", async () => {
    const user = userEvent.setup();
    render(<FormularioReporte />);

    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Seleccione una categoría");
    expect(screen.getByLabelText("Descripción")).toHaveAttribute("aria-describedby");
    expect(screen.getByLabelText("Latitud")).toHaveAttribute("aria-describedby");
  });

  it("valida campos completos y aclara que todavía no se guarda", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 201 })));
    render(<FormularioReporte />);
    completarCampos();

    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/incidentes",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({
            categoria: "hueco",
            descripcion: "Hueco profundo frente al parque",
            lat: 6.25,
            lng: -75.57,
          }),
        }),
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Reporte enviado correctamente");
  });

  it("invita a iniciar sesión cuando la API rechaza una sesión ausente", async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ error: "No autenticado" }, { status: 401 })),
    );
    render(<FormularioReporte />);
    completarCampos();

    await user.click(screen.getByRole("button", { name: "Enviar reporte" }));

    expect(await screen.findByText(/inicia sesión para enviar/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toHaveAttribute(
      "href",
      "/iniciar-sesion",
    );
  });

  it("rellena las coordenadas cuando el navegador concede la ubicación", async () => {
    const user = userEvent.setup();
    const getCurrentPosition = vi.fn(
      (success: (position: { coords: { latitude: number; longitude: number } }) => void) =>
        success({ coords: { latitude: 6.25, longitude: -75.57 } }),
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    render(<FormularioReporte />);

    await user.click(screen.getByRole("button", { name: "Usar mi ubicación" }));

    expect(getCurrentPosition).toHaveBeenCalledOnce();
    expect(screen.getByLabelText("Latitud")).toHaveValue(6.25);
    expect(screen.getByLabelText("Longitud")).toHaveValue(-75.57);
  });

  it("ofrece marcar un punto en el mapa si se niega el permiso de ubicación", async () => {
    const user = userEvent.setup();
    const denied = Object.assign(new Error("Permiso denegado"), {
      code: 1,
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    });
    const getCurrentPosition = vi.fn(
      (_success: (position: unknown) => void, failure: (error: GeolocationPositionError) => void) =>
        failure(denied as GeolocationPositionError),
    );
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    render(<FormularioReporte />);

    await user.click(screen.getByRole("button", { name: "Usar mi ubicación" }));

    expect(
      await screen.findByRole("region", { name: "Elegir ubicación en el mapa" }),
    ).toBeVisible();
    expect(screen.getByRole("status")).toHaveTextContent("No se concedió permiso");
    expect(screen.getByLabelText("Latitud")).toBeInTheDocument();
    expect(screen.getByLabelText("Longitud")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Seleccionar punto de prueba" }));

    expect(screen.getByLabelText("Latitud")).toHaveValue(6.2442);
    expect(screen.getByLabelText("Longitud")).toHaveValue(-75.5812);
    expect(screen.getByRole("status")).toHaveTextContent("Ubicación marcada en el mapa");
  });

  it("muestra una vista previa de la foto seleccionada", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:foto-local") }));
    const user = userEvent.setup();
    render(<FormularioReporte />);
    const foto = new File(["imagen"], "incidente.png", { type: "image/png" });

    await user.upload(screen.getByLabelText("Foto (opcional)"), foto);

    expect(
      await screen.findByRole("img", { name: "Vista previa de la foto seleccionada" }),
    ).toHaveAttribute("src", "blob:foto-local");
  });

  it("rechaza fotos que superan 5 MB", async () => {
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: vi.fn(() => "blob:foto-local") }));
    const user = userEvent.setup();
    render(<FormularioReporte />);
    const foto = new File(["imagen"], "grande.png", { type: "image/png" });
    Object.defineProperty(foto, "size", { value: 5 * 1024 * 1024 + 1 });

    await user.upload(screen.getByLabelText("Foto (opcional)"), foto);

    expect(screen.getByRole("alert")).toHaveTextContent("La foto debe pesar máximo 5 MB");
    expect(screen.queryByRole("img", { name: "Vista previa de la foto seleccionada" })).toBeNull();
  });

  it("no tiene violaciones de accesibilidad automatizadas", async () => {
    const { container } = render(<FormularioReporte />);

    await waitFor(async () => expect(await violaciones(container)).toEqual([]));
  });
});
