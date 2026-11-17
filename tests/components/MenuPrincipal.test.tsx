import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { MenuPrincipal } from "@/components/MenuPrincipal";

const { replace, refresh } = vi.hoisted(() => ({ replace: vi.fn(), refresh: vi.fn() }));
vi.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({ replace, refresh }),
}));

describe("MenuPrincipal", () => {
  it("el botón abre y cierra el menú y Escape lo cierra", async () => {
    render(<MenuPrincipal sesionActiva={false} />);
    const boton = screen.getByRole("button", { name: "Menú" });
    expect(boton).toHaveAttribute("aria-expanded", "false");
    await userEvent.click(boton);
    expect(boton).toHaveAttribute("aria-expanded", "true");
    await userEvent.keyboard("{Escape}");
    expect(boton).toHaveAttribute("aria-expanded", "false");
  });

  it("marca la página actual", () => {
    render(<MenuPrincipal sesionActiva={false} />);
    expect(screen.getByRole("link", { name: "Mapa" })).toHaveAttribute("aria-current", "page");
  });

  it("muestra acceso para visitantes y cierre de sesión para usuarios autenticados", async () => {
    const { rerender } = render(<MenuPrincipal sesionActiva={false} />);
    expect(screen.getByRole("link", { name: "Iniciar sesión" })).toBeInTheDocument();

    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
    rerender(<MenuPrincipal sesionActiva />);
    await userEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(fetch).toHaveBeenCalledWith("/api/sesion", { method: "DELETE", cache: "no-store" });
    expect(replace).toHaveBeenCalledWith("/iniciar-sesion");
    expect(refresh).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
