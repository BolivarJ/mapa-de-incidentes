import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

const { refresh } = vi.hoisted(() => ({ refresh: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
const { upload } = vi.hoisted(() => ({ upload: vi.fn() }));
vi.mock("@vercel/blob/client", () => ({ upload }));

const { FotoReportePropio } = await import("@/components/FotoReportePropio");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("FotoReportePropio", () => {
  it("muestra la foto y permite quitarla desde Mis reportes", async () => {
    const user = userEvent.setup();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ fotoUrl: null })));
    render(
      <FotoReportePropio
        id="incidente-1"
        fotoUrl="https://almacen.public.blob.vercel-storage.com/foto.webp"
      />,
    );

    expect(screen.getByRole("img", { name: "Foto del reporte" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Quitar foto" }));

    await waitFor(() =>
      expect(fetch).toHaveBeenCalledWith(
        "/api/incidentes/incidente-1/foto",
        expect.objectContaining({ method: "DELETE", cache: "no-store" }),
      ),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Foto eliminada.");
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("permite agregar una foto desde Mis reportes si el envío inicial quedó sin foto", async () => {
    const user = userEvent.setup();
    upload.mockResolvedValue({ pathname: "incidentes/incidente-1/foto.webp" });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ fotoUrl: "foto" })));
    render(<FotoReportePropio id="incidente-1" fotoUrl={null} />);

    await user.upload(
      screen.getByLabelText("Agregar foto"),
      new File(["imagen"], "barrio.webp", { type: "image/webp" }),
    );

    await waitFor(() => expect(upload).toHaveBeenCalledOnce());
    expect(await screen.findByRole("status")).toHaveTextContent("Foto guardada.");
    expect(refresh).toHaveBeenCalledOnce();
  });
});
