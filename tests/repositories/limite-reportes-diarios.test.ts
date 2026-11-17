import type { Firestore } from "firebase-admin/firestore";
import { afterEach, describe, expect, it, vi } from "vitest";
import { crearRepositorioFirestore } from "@/repositories/incidentes-firestore";

const nuevo = {
  categoria: "hueco",
  descripcion: "Hueco profundo frente al parque del barrio",
  lat: 6.2442,
  lng: -75.5812,
} as const;

function crearFirestoreFalso(cantidadActual: number) {
  const referenciaIncidente = {
    id: "incidente-nuevo",
    collection: vi.fn(() => ({ doc: vi.fn(() => referenciaEvento) })),
  };
  const referenciaEvento = {};
  const referenciaLimite = {};
  const transaccion = {
    get: vi.fn(async (referencia: unknown) => ({
      exists: referencia === referenciaLimite && cantidadActual >= 0,
      get: (campo: string) => (campo === "cantidad" ? cantidadActual : undefined),
    })),
    create: vi.fn(),
    update: vi.fn(),
  };
  const coleccionIncidentes = { doc: vi.fn(() => referenciaIncidente) };
  const coleccionLimites = { doc: vi.fn((_id: string) => referenciaLimite) };
  const firestore = {
    collection: vi.fn((nombre: string) =>
      nombre === "incidentes" ? coleccionIncidentes : coleccionLimites,
    ),
    runTransaction: vi.fn(async (operacion) => operacion(transaccion)),
  } as unknown as Firestore;

  return {
    firestore,
    transaccion,
    referenciaIncidente,
    referenciaEvento,
    referenciaLimite,
    coleccionLimites,
  };
}

afterEach(() => vi.useRealTimers());

describe("límite diario de creación de incidentes", () => {
  it("permite el quinto reporte y aumenta el contador dentro de la misma transacción", async () => {
    const falso = crearFirestoreFalso(4);
    const repo = crearRepositorioFirestore(falso.firestore);

    const resultado = await repo.crear(nuevo, "uid-verificado");

    expect(resultado.ok).toBe(true);
    expect(falso.transaccion.get).toHaveBeenCalledOnce();
    expect(falso.transaccion.create).toHaveBeenCalledTimes(2);
    expect(falso.transaccion.update).toHaveBeenCalledWith(
      falso.referenciaLimite,
      expect.objectContaining({ cantidad: 5 }),
    );
    expect(falso.transaccion.create).toHaveBeenCalledWith(
      falso.referenciaIncidente,
      expect.objectContaining({ uid: "uid-verificado", ...nuevo }),
    );
    expect(falso.transaccion.create).toHaveBeenCalledWith(
      falso.referenciaEvento,
      expect.objectContaining({ estado: "recibido" }),
    );
  });

  it("rechaza el sexto reporte y no escribe incidente, historial ni contador", async () => {
    const falso = crearFirestoreFalso(5);
    const repo = crearRepositorioFirestore(falso.firestore);

    await expect(repo.crear(nuevo, "uid-verificado")).resolves.toEqual({
      ok: false,
      motivo: "limite-diario",
    });

    expect(falso.transaccion.get).toHaveBeenCalledOnce();
    expect(falso.transaccion.create).not.toHaveBeenCalled();
    expect(falso.transaccion.update).not.toHaveBeenCalled();
  });

  it("usa el día calendario de Medellín y reinicia el contador al cambiar la fecha local", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-18T04:59:59.000Z"));
    const antesDeMedianoche = crearFirestoreFalso(5);
    await crearRepositorioFirestore(antesDeMedianoche.firestore).crear(nuevo, "uid-verificado");

    vi.setSystemTime(new Date("2026-11-18T05:00:00.000Z"));
    const despuesDeMedianoche = crearFirestoreFalso(0);
    const resultado = await crearRepositorioFirestore(despuesDeMedianoche.firestore).crear(
      nuevo,
      "uid-verificado",
    );

    expect(resultado.ok).toBe(true);
    expect(antesDeMedianoche.firestore.collection).toHaveBeenCalledWith("limites-reportes-diarios");
    expect(despuesDeMedianoche.firestore.collection).toHaveBeenCalledWith(
      "limites-reportes-diarios",
    );
    const idAntes = antesDeMedianoche.coleccionLimites.doc.mock.calls[0]?.[0];
    const idDespues = despuesDeMedianoche.coleccionLimites.doc.mock.calls[0]?.[0];
    expect(idAntes).not.toBe(idDespues);
  });
});
