import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { FormularioAcceso } from "@/components/FormularioAcceso";

const {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdToken,
  setPersistence,
  inMemoryPersistence,
  signOut,
  replace,
  auth,
} = vi.hoisted(() => ({
  createUserWithEmailAndPassword: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  getIdToken: vi.fn(),
  setPersistence: vi.fn(),
  inMemoryPersistence: {},
  signOut: vi.fn(),
  replace: vi.fn(),
  auth: {},
}));

vi.mock("firebase/auth", () => ({
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  getIdToken,
  setPersistence,
  inMemoryPersistence,
  signOut,
}));
vi.mock("@/lib/firebase-client", () => ({ getFirebaseClientAuth: () => auth }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ replace, refresh: vi.fn() }) }));

describe("FormularioAcceso", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getIdToken.mockResolvedValue("id-token-prueba");
    signOut.mockResolvedValue(undefined);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(null, { status: 204 })));
  });

  it("inicia sesión, intercambia el token por cookie y redirige al mapa", async () => {
    const user = { uid: "vecino-1" };
    signInWithEmailAndPassword.mockResolvedValue({ user });
    const usuario = userEvent.setup();
    render(<FormularioAcceso modo="ingreso" />);

    await usuario.type(screen.getByLabelText("Correo electrónico"), "vecino@example.test");
    await usuario.type(screen.getByLabelText("Contraseña"), "clave-segura-123");
    await usuario.click(screen.getByRole("button", { name: "Iniciar sesión" }));

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "vecino@example.test",
      "clave-segura-123",
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/sesion",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ idToken: "id-token-prueba" }),
      }),
    );
    expect(signOut).toHaveBeenCalled();
    expect(replace).toHaveBeenCalledWith("/");
  });

  it("permite registrar una cuenta y comunica errores accesiblemente", async () => {
    createUserWithEmailAndPassword.mockRejectedValue({ code: "auth/email-already-in-use" });
    const usuario = userEvent.setup();
    render(<FormularioAcceso modo="registro" />);

    await usuario.type(screen.getByLabelText("Correo electrónico"), "vecino@example.test");
    await usuario.type(screen.getByLabelText("Contraseña"), "clave-segura-123");
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(createUserWithEmailAndPassword).toHaveBeenCalled();
    expect(await screen.findByRole("alert")).toHaveTextContent(/si ya tienes cuenta/i);
    expect(replace).not.toHaveBeenCalled();
  });

  it("crea la cuenta y establece la sesión de servidor", async () => {
    const user = { uid: "vecino-nuevo" };
    createUserWithEmailAndPassword.mockResolvedValue({ user });
    const usuario = userEvent.setup();
    render(<FormularioAcceso modo="registro" />);

    await usuario.type(screen.getByLabelText("Correo electrónico"), "nuevo@example.test");
    await usuario.type(screen.getByLabelText("Contraseña"), "clave-segura-123");
    await usuario.click(screen.getByRole("button", { name: "Crear cuenta" }));

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.anything(),
      "nuevo@example.test",
      "clave-segura-123",
    );
    expect(fetch).toHaveBeenCalledWith("/api/sesion", expect.any(Object));
    expect(replace).toHaveBeenCalledWith("/");
  });
});
