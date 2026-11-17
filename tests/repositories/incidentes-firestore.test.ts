import type { Firestore } from "firebase-admin/firestore";
import { describe, expect, it, vi } from "vitest";
import { crearRepositorioFirestore } from "@/repositories/incidentes-firestore";

const incidente = {
  uid: "vecino-1",
  categoria: "hueco",
  descripcion: "Hueco profundo frente al parque del barrio",
  lat: 6.2442,
  lng: -75.5812,
  fotoUrl: null,
  estado: "recibido",
  apoyos: 0,
  creadoEn: "2026-11-10T14:20:00.000Z",
} as const;

function crearFirestoreFalso() {
  const consultaIncidentes = {
    where: vi.fn(),
    limit: vi.fn(),
    get: vi.fn(),
  };
  consultaIncidentes.where.mockReturnValue(consultaIncidentes);
  consultaIncidentes.limit.mockReturnValue(consultaIncidentes);

  const consultaHistorial = {
    orderBy: vi.fn(),
    get: vi.fn(),
  };
  consultaHistorial.orderBy.mockReturnValue(consultaHistorial);

  const documento = {
    get: vi.fn(),
    collection: vi.fn(() => consultaHistorial),
  };
  const coleccion = {
    where: consultaIncidentes.where,
    limit: consultaIncidentes.limit,
    get: consultaIncidentes.get,
    doc: vi.fn(() => documento),
  };
  const firestore = { collection: vi.fn(() => coleccion) } as unknown as Firestore;

  return { firestore, consultaIncidentes, consultaHistorial, documento, coleccion };
}

describe("crearRepositorioFirestore", () => {
  it("consulta por latitud y convierte los documentos en incidentes con id de Firestore", async () => {
    const falso = crearFirestoreFalso();
    falso.consultaIncidentes.get.mockResolvedValue({
      docs: [{ id: "incidente-1", data: () => incidente }],
    });
    const repo = crearRepositorioFirestore(falso.firestore);

    const resultado = await repo.listarPorLatitud(6.2, 6.3, 25);

    expect(falso.firestore.collection).toHaveBeenCalledWith("incidentes");
    expect(falso.consultaIncidentes.where).toHaveBeenNthCalledWith(1, "lat", ">=", 6.2);
    expect(falso.consultaIncidentes.where).toHaveBeenNthCalledWith(2, "lat", "<=", 6.3);
    expect(falso.consultaIncidentes.limit).toHaveBeenCalledWith(25);
    expect(resultado).toEqual([{ id: "incidente-1", ...incidente }]);
  });

  it("lista solo los reportes del uid recibido y ordena los más recientes primero", async () => {
    const falso = crearFirestoreFalso();
    const reporteAntiguo = {
      ...incidente,
      uid: "uid-vecino",
      creadoEn: "2026-11-10T10:00:00.000Z",
    };
    const reporteNuevo = {
      ...incidente,
      uid: "uid-vecino",
      creadoEn: "2026-11-12T10:00:00.000Z",
    };
    falso.consultaIncidentes.get.mockResolvedValue({
      docs: [
        { id: "antiguo", data: () => reporteAntiguo },
        { id: "nuevo", data: () => reporteNuevo },
      ],
    });
    const repo = crearRepositorioFirestore(falso.firestore);

    const resultado = await repo.listarPorUsuario("uid-vecino");

    expect(falso.consultaIncidentes.where).toHaveBeenCalledWith("uid", "==", "uid-vecino");
    expect(resultado.map((item) => item.id)).toEqual(["nuevo", "antiguo"]);
  });

  it("devuelve null cuando el incidente no existe", async () => {
    const falso = crearFirestoreFalso();
    falso.documento.get.mockResolvedValue({ exists: false });
    const repo = crearRepositorioFirestore(falso.firestore);

    await expect(repo.obtener("no-existe")).resolves.toBeNull();
    expect(falso.coleccion.doc).toHaveBeenCalledWith("no-existe");
  });

  it("lee y valida el historial ordenado por fecha ascendente", async () => {
    const falso = crearFirestoreFalso();
    const evento = {
      estado: "recibido",
      nota: "Reporte recibido",
      creadoEn: "2026-11-10T14:20:00.000Z",
    } as const;
    falso.consultaHistorial.get.mockResolvedValue({ docs: [{ data: () => evento }] });
    const repo = crearRepositorioFirestore(falso.firestore);

    await expect(repo.historial("incidente-1")).resolves.toEqual([evento]);
    expect(falso.documento.collection).toHaveBeenCalledWith("historial");
    expect(falso.consultaHistorial.orderBy).toHaveBeenCalledWith("creadoEn", "asc");
  });

  it("crea el incidente y el evento inicial en el mismo lote con uid del servidor", async () => {
    const refIncidente = { id: "incidente-nuevo", collection: vi.fn() };
    const refHistorial = {};
    const refLimite = {};
    const coleccionHistorial = { doc: vi.fn(() => refHistorial) };
    refIncidente.collection.mockReturnValue(coleccionHistorial);
    const coleccion = { doc: vi.fn(() => refIncidente) };
    const coleccionLimites = { doc: vi.fn(() => refLimite) };
    const transaccion = {
      get: vi.fn().mockResolvedValue({ exists: false, get: vi.fn() }),
      create: vi.fn(),
      update: vi.fn(),
    };
    const firestore = {
      collection: vi.fn((nombre: string) =>
        nombre === "incidentes" ? coleccion : coleccionLimites,
      ),
      runTransaction: vi.fn(async (operacion) => operacion(transaccion)),
    } as unknown as Firestore;
    const repo = crearRepositorioFirestore(firestore);
    const nuevo = {
      categoria: "hueco",
      descripcion: "Hueco profundo frente al parque del barrio",
      lat: 6.2442,
      lng: -75.5812,
    } as const;

    const resultado = await repo.crear(nuevo, "uid-verificado");

    expect(firestore.collection).toHaveBeenCalledWith("limites-reportes-diarios");
    expect(firestore.collection).toHaveBeenCalledWith("incidentes");
    expect(coleccion.doc).toHaveBeenCalledWith();
    expect(transaccion.create).toHaveBeenCalledTimes(3);
    const [referenciaReporte, reporte] = transaccion.create.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    const [referenciaEvento, evento] = transaccion.create.mock.calls[1] as [
      unknown,
      Record<string, unknown>,
    ];
    expect(referenciaReporte).toBe(refIncidente);
    expect(referenciaEvento).toBe(refHistorial);
    expect(reporte).toMatchObject({
      ...nuevo,
      uid: "uid-verificado",
      fotoUrl: null,
      estado: "recibido",
      apoyos: 0,
    });
    expect(transaccion.create).toHaveBeenCalledWith(
      refLimite,
      expect.objectContaining({ cantidad: 1, fechaLocal: expect.any(String) }),
    );
    expect(evento).toMatchObject({ estado: "recibido", nota: "Reporte recibido" });
    expect(evento.creadoEn).toBe(reporte.creadoEn);
    expect(firestore.runTransaction).toHaveBeenCalledOnce();
    expect(resultado).toEqual({ ok: true, incidente: { id: "incidente-nuevo", ...reporte } });
  });

  it("actualiza la foto dentro de una transacción solo para el dueño del reporte", async () => {
    const referencia = {};
    const documento = {
      exists: true,
      id: "incidente-1",
      data: () => ({ ...incidente, fotoUrl: null }),
    };
    const transaccion = { get: vi.fn().mockResolvedValue(documento), update: vi.fn() };
    const firestore = {
      collection: vi.fn(() => ({ doc: vi.fn(() => referencia) })),
      runTransaction: vi.fn(async (operacion) => operacion(transaccion)),
    } as unknown as Firestore;
    const repo = crearRepositorioFirestore(firestore);

    await expect(
      repo.actualizarFoto("incidente-1", "vecino-1", "https://foto.test/a.webp"),
    ).resolves.toEqual({ ok: true, urlAnterior: null });
    await expect(
      repo.actualizarFoto("incidente-1", "otro-vecino", "https://foto.test/a.webp"),
    ).resolves.toEqual({ ok: false, motivo: "no-autorizado" });
    expect(transaccion.update).toHaveBeenCalledOnce();
    expect(transaccion.update).toHaveBeenCalledWith(referencia, {
      fotoUrl: "https://foto.test/a.webp",
    });
  });

  it("desasocia una foto en Firestore solo para el dueño antes de eliminar el Blob", async () => {
    const referencia = {};
    const documento = {
      exists: true,
      id: "incidente-1",
      data: () => ({ ...incidente, fotoUrl: "https://foto.test/a.webp" }),
    };
    const transaccion = { get: vi.fn().mockResolvedValue(documento), update: vi.fn() };
    const firestore = {
      collection: vi.fn(() => ({ doc: vi.fn(() => referencia) })),
      runTransaction: vi.fn(async (operacion) => operacion(transaccion)),
    } as unknown as Firestore;
    const repo = crearRepositorioFirestore(firestore);

    await expect(repo.eliminarFoto("incidente-1", "vecino-1")).resolves.toEqual({
      ok: true,
      fotoUrl: "https://foto.test/a.webp",
    });
    await expect(repo.eliminarFoto("incidente-1", "otro-vecino")).resolves.toEqual({
      ok: false,
      motivo: "no-autorizado",
    });
    expect(transaccion.update).toHaveBeenCalledOnce();
    expect(transaccion.update).toHaveBeenCalledWith(referencia, { fotoUrl: null });
  });

  describe("apoyar", () => {
    function firestoreConApoyo(existeIncidente: boolean, existeApoyo: boolean) {
      const refApoyo = {};
      const refIncidente = { collection: vi.fn(() => ({ doc: vi.fn(() => refApoyo) })) };
      const transaccion = {
        get: vi.fn(async (ref: unknown) =>
          ref === refApoyo
            ? { exists: existeApoyo }
            : {
                exists: existeIncidente,
                id: "incidente-1",
                data: () => ({ ...incidente, apoyos: 2 }),
              },
        ),
        create: vi.fn(),
        update: vi.fn(),
      };
      const firestore = {
        collection: vi.fn(() => ({ doc: vi.fn(() => refIncidente) })),
        runTransaction: vi.fn(async (operacion) => operacion(transaccion)),
      } as unknown as Firestore;
      return { firestore, transaccion, refApoyo, refIncidente };
    }

    it("crea un apoyo único por usuario e incrementa el contador en la misma transacción", async () => {
      const falso = firestoreConApoyo(true, false);

      const resultado = await crearRepositorioFirestore(falso.firestore).apoyar(
        "incidente-1",
        "vecino-2",
      );

      expect(resultado).toEqual({ ok: true, apoyos: 3 });
      expect(falso.refIncidente.collection).toHaveBeenCalledWith("apoyos");
      expect(falso.transaccion.create).toHaveBeenCalledWith(
        falso.refApoyo,
        expect.objectContaining({ creadoEn: expect.any(String) }),
      );
      expect(falso.transaccion.update).toHaveBeenCalledWith(
        falso.refIncidente,
        expect.objectContaining({ apoyos: expect.anything() }),
      );
    });

    it("no escribe si el usuario ya apoyó o el incidente no existe", async () => {
      const repetido = firestoreConApoyo(true, true);
      await expect(
        crearRepositorioFirestore(repetido.firestore).apoyar("incidente-1", "vecino-2"),
      ).resolves.toEqual({ ok: false, motivo: "ya-apoyado" });
      const inexistente = firestoreConApoyo(false, false);
      await expect(
        crearRepositorioFirestore(inexistente.firestore).apoyar("incidente-1", "vecino-2"),
      ).resolves.toEqual({ ok: false, motivo: "no-encontrado" });

      expect(repetido.transaccion.create).not.toHaveBeenCalled();
      expect(inexistente.transaccion.create).not.toHaveBeenCalled();
    });
  });
});
