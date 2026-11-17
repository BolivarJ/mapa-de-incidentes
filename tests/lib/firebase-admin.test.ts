import { beforeEach, describe, expect, it, vi } from "vitest";

const { cert, getApps, initializeApp, getFirestore } = vi.hoisted(() => ({
  cert: vi.fn(),
  getApps: vi.fn(),
  initializeApp: vi.fn(),
  getFirestore: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("firebase-admin/app", () => ({ cert, getApps, initializeApp }));
vi.mock("firebase-admin/firestore", () => ({ getFirestore }));

describe("getFirestoreAdmin", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.unstubAllEnvs();
    vi.stubEnv("FIREBASE_PROJECT_ID", "");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "");
  });

  it("devuelve null si faltan credenciales del servidor", async () => {
    const { getFirestoreAdmin } = await import("@/lib/firebase-admin");

    expect(getFirestoreAdmin()).toBeNull();
    expect(initializeApp).not.toHaveBeenCalled();
  });

  it("inicializa Admin con credenciales del entorno y normaliza los saltos de línea", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "mapa-incidentes-dev");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "admin@example.test");
    vi.stubEnv(
      "FIREBASE_PRIVATE_KEY",
      "linea-privada-de-prueba-uno\\nlinea-privada-de-prueba-dos\\n",
    );
    const app = { name: "mapa-incidentes-admin" };
    const firestore = {};
    getApps.mockReturnValue([]);
    initializeApp.mockReturnValue(app);
    getFirestore.mockReturnValue(firestore);

    const { getFirestoreAdmin } = await import("@/lib/firebase-admin");

    expect(getFirestoreAdmin()).toBe(firestore);
    expect(cert).toHaveBeenCalledWith({
      projectId: "mapa-incidentes-dev",
      clientEmail: "admin@example.test",
      privateKey: "linea-privada-de-prueba-uno\nlinea-privada-de-prueba-dos\n",
    });
    expect(initializeApp).toHaveBeenCalledOnce();
  });

  it("reutiliza una app Admin ya inicializada", async () => {
    vi.stubEnv("FIREBASE_PROJECT_ID", "mapa-incidentes-dev");
    vi.stubEnv("FIREBASE_CLIENT_EMAIL", "admin@example.test");
    vi.stubEnv("FIREBASE_PRIVATE_KEY", "clave-de-prueba");
    const app = { name: "mapa-incidentes-admin" };
    const firestore = {};
    getApps.mockReturnValue([app]);
    getFirestore.mockReturnValue(firestore);

    const { getFirestoreAdmin } = await import("@/lib/firebase-admin");

    expect(getFirestoreAdmin()).toBe(firestore);
    expect(initializeApp).not.toHaveBeenCalled();
    expect(getFirestore).toHaveBeenCalledWith(app);
  });
});
