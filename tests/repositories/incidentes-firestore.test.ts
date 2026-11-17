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
    const coleccionHistorial = { doc: vi.fn(() => refHistorial) };
    refIncidente.collection.mockReturnValue(coleccionHistorial);
    const coleccion = { doc: vi.fn(() => refIncidente) };
    const lote = { set: vi.fn(), commit: vi.fn().mockResolvedValue(undefined) };
    const firestore = {
      collection: vi.fn(() => coleccion),
      batch: vi.fn(() => lote),
    } as unknown as Firestore;
    const repo = crearRepositorioFirestore(firestore);
    const nuevo = {
      categoria: "hueco",
      descripcion: "Hueco profundo frente al parque del barrio",
      lat: 6.2442,
      lng: -75.5812,
    } as const;

    const resultado = await repo.crear(nuevo, "uid-verificado");

    expect(firestore.collection).toHaveBeenCalledWith("incidentes");
    expect(coleccion.doc).toHaveBeenCalledWith();
    expect(lote.set).toHaveBeenCalledTimes(2);
    const [referenciaReporte, reporte] = lote.set.mock.calls[0] as [
      unknown,
      Record<string, unknown>,
    ];
    const [referenciaEvento, evento] = lote.set.mock.calls[1] as [unknown, Record<string, unknown>];
    expect(referenciaReporte).toBe(refIncidente);
    expect(referenciaEvento).toBe(refHistorial);
    expect(reporte).toMatchObject({
      ...nuevo,
      uid: "uid-verificado",
      fotoUrl: null,
      estado: "recibido",
      apoyos: 0,
    });
    expect(evento).toMatchObject({ estado: "recibido", nota: "Reporte recibido" });
    expect(evento.creadoEn).toBe(reporte.creadoEn);
    expect(lote.commit).toHaveBeenCalledOnce();
    expect(resultado).toMatchObject({ id: "incidente-nuevo", ...reporte });
  });
});
