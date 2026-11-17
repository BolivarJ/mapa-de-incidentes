import { describe, expect, it } from "vitest";
import { manejar } from "@/lib/http";
import { ErrorApi } from "@/lib/errores";

describe("manejar", () => {
  it("convierte ErrorApi en { error, detalles } con su código", async () => {
    const h = manejar(async () => {
      throw new ErrorApi(409, "Conflicto", [{ campo: "x", mensaje: "y" }]);
    });
    const r = await h(new Request("http://localhost/api"));
    expect(r.status).toBe(409);
    expect(await r.json()).toEqual({
      error: "Conflicto",
      detalles: [{ campo: "x", mensaje: "y" }],
    });
  });
  it("oculta los detalles de errores inesperados (500)", async () => {
    const h = manejar(async () => {
      throw new Error("conexión a la base con contraseña 123");
    });
    const r = await h(new Request("http://localhost/api"));
    expect(r.status).toBe(500);
    expect(await r.json()).toEqual({ error: "Error interno del servidor" });
    expect(r.headers.get("x-request-id")).toBeTruthy();
  });
  it("conserva el id de solicitud recibido", async () => {
    const h = manejar(async () => Response.json({ ok: true }));
    const r = await h(new Request("http://localhost/api", { headers: { "x-request-id": "abc" } }));
    expect(r.headers.get("x-request-id")).toBe("abc");
  });
});
