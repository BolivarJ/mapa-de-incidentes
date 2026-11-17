import { describe, expect, it } from "vitest";
import { nuevoIncidenteSchema } from "@/schemas/incidente";
import { consultaAreaSchema, parametros } from "@/schemas/consulta";
import { leerLimites } from "@/lib/ciudad";

describe("nuevoIncidenteSchema", () => {
  const valido = {
    categoria: "hueco",
    descripcion: "Hueco grande en la vía",
    lat: 6.25,
    lng: -75.57,
  };

  it("acepta un reporte válido", () => {
    expect(nuevoIncidenteSchema.safeParse(valido).success).toBe(true);
  });
  it("rechaza coordenadas fuera de la ciudad", () => {
    const r = nuevoIncidenteSchema.safeParse({ ...valido, lat: 4.6 });
    expect(r.success).toBe(false);
    expect(r.error?.issues[0]?.message).toMatch(/fuera de la ciudad/);
  });
  it("rechaza campos desconocidos (mass assignment)", () => {
    expect(nuevoIncidenteSchema.safeParse({ ...valido, estado: "resuelto" }).success).toBe(false);
  });
});

describe("consultaAreaSchema", () => {
  it("convierte texto a número y aplica el límite por defecto", () => {
    const r = consultaAreaSchema.parse({ norte: "6.3", sur: "6.2", este: "-75.5", oeste: "-75.6" });
    expect(r).toMatchObject({ norte: 6.3, limite: 100 });
  });
  it("exige norte > sur y este > oeste", () => {
    const r = consultaAreaSchema.safeParse({
      norte: "6.1",
      sur: "6.2",
      este: "-75.7",
      oeste: "-75.6",
    });
    expect(r.error?.issues.map((i) => i.path[0])).toEqual(["norte", "este"]);
  });
  it("parametros ignora valores vacíos", () => {
    expect(parametros(new URLSearchParams("a=1&b="))).toEqual({ a: "1" });
  });
});

describe("leerLimites", () => {
  it("lee límites válidos", () => {
    expect(leerLimites("1,2,3,4")).toEqual({ sur: 1, norte: 2, oeste: 3, este: 4 });
  });
  it("usa Medellín si el texto es inválido o falta", () => {
    expect(leerLimites("2,1,3,4").sur).toBe(6.13);
    expect(leerLimites(undefined).norte).toBe(6.37);
  });
});
