import "server-only";
import { createHash } from "node:crypto";
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { getFirestoreAdmin } from "@/lib/firebase-admin";
import type {
  RepositorioIncidentesFirestore,
  ResultadoApoyo,
  ResultadoCreacionIncidente,
  ResultadoActualizacionFoto,
  ResultadoEliminacionFoto,
} from "@/repositories/incidentes";
import {
  eventoHistorialSchema,
  incidenteSchema,
  type EventoHistorial,
  type Incidente,
  type NuevoIncidente,
} from "@/schemas/incidente";

const COLECCION_INCIDENTES = "incidentes";
const COLECCION_HISTORIAL = "historial";
const COLECCION_LIMITES_DIARIOS = "limites-reportes-diarios";
const LIMITE_REPORTES_DIARIOS = 5;
const incidenteAlmacenadoSchema = incidenteSchema.omit({ id: true });

function convertirIncidente(id: string, datos: unknown): Incidente {
  return { ...incidenteAlmacenadoSchema.parse(datos), id };
}

function fechaLocalReporte(fecha: Date): string {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(fecha);
  const parte = (tipo: "year" | "month" | "day") =>
    partes.find((elemento) => elemento.type === tipo)?.value ?? "";
  return `${parte("year")}-${parte("month")}-${parte("day")}`;
}

function idContadorDiario(uid: string, fecha: string): string {
  return createHash("sha256").update(`${fecha}:${uid}`).digest("hex");
}

function cantidadActual(snapshot: { exists: boolean; get(campo: string): unknown }): number {
  if (!snapshot.exists) return 0;
  const cantidad = snapshot.get("cantidad");
  if (typeof cantidad !== "number" || !Number.isSafeInteger(cantidad) || cantidad < 0) {
    throw new Error("El contador diario de reportes no es válido");
  }
  return cantidad;
}

async function guardarIncidente(
  db: Firestore,
  nuevo: NuevoIncidente,
  uid: string,
): Promise<ResultadoCreacionIncidente> {
  const ahora = new Date();
  const fechaLocal = fechaLocalReporte(ahora);
  const referenciaLimite = db
    .collection(COLECCION_LIMITES_DIARIOS)
    .doc(idContadorDiario(uid, fechaLocal));

  return db.runTransaction(async (transaccion) => {
    const snapshotLimite = await transaccion.get(referenciaLimite);
    const cantidad = cantidadActual(snapshotLimite);
    if (cantidad >= LIMITE_REPORTES_DIARIOS) {
      return { ok: false, motivo: "limite-diario" };
    }

    const referencia = db.collection(COLECCION_INCIDENTES).doc();
    const creadoEn = ahora.toISOString();
    const datos = {
      ...nuevo,
      uid,
      fotoUrl: null,
      estado: "recibido",
      apoyos: 0,
      creadoEn,
    };
    const incidente = incidenteSchema.parse({ id: referencia.id, ...datos });
    const evento = eventoHistorialSchema.parse({
      estado: "recibido",
      nota: "Reporte recibido",
      creadoEn,
    });
    const referenciaEvento = referencia.collection(COLECCION_HISTORIAL).doc();
    transaccion.create(referencia, incidenteAlmacenadoSchema.parse(datos));
    transaccion.create(referenciaEvento, evento);

    const siguienteCantidad = cantidad + 1;
    const datosLimite = { fechaLocal, cantidad: siguienteCantidad };
    if (snapshotLimite.exists) {
      transaccion.update(referenciaLimite, datosLimite);
    } else {
      transaccion.create(referenciaLimite, datosLimite);
    }

    return { ok: true, incidente };
  });
}

async function leerPorUsuario(db: Firestore, uid: string): Promise<Incidente[]> {
  const resultado = await db.collection(COLECCION_INCIDENTES).where("uid", "==", uid).get();
  return resultado.docs
    .map((documento) => convertirIncidente(documento.id, documento.data()))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
}

async function apoyarIncidente(db: Firestore, id: string, uid: string): Promise<ResultadoApoyo> {
  const referencia = db.collection(COLECCION_INCIDENTES).doc(id);
  const referenciaApoyo = referencia.collection("apoyos").doc(uid);
  return db.runTransaction(async (transaccion) => {
    const documento = await transaccion.get(referencia);
    const apoyo = await transaccion.get(referenciaApoyo);
    if (!documento.exists) return { ok: false, motivo: "no-encontrado" };
    if (apoyo.exists) return { ok: false, motivo: "ya-apoyado" };
    const incidente = convertirIncidente(documento.id, documento.data());
    transaccion.create(referenciaApoyo, { creadoEn: new Date().toISOString() });
    transaccion.update(referencia, { apoyos: FieldValue.increment(1) });
    return { ok: true, apoyos: incidente.apoyos + 1 };
  });
}

async function actualizarFoto(
  db: Firestore,
  id: string,
  uid: string,
  fotoUrl: string,
): Promise<ResultadoActualizacionFoto> {
  const referencia = db.collection(COLECCION_INCIDENTES).doc(id);
  return db.runTransaction(async (transaccion) => {
    const documento = await transaccion.get(referencia);
    if (!documento.exists) return { ok: false, motivo: "no-encontrado" };
    const incidente = convertirIncidente(documento.id, documento.data());
    if (incidente.uid !== uid) return { ok: false, motivo: "no-autorizado" };
    transaccion.update(referencia, { fotoUrl });
    return { ok: true, urlAnterior: incidente.fotoUrl };
  });
}

async function eliminarFoto(
  db: Firestore,
  id: string,
  uid: string,
): Promise<ResultadoEliminacionFoto> {
  const referencia = db.collection(COLECCION_INCIDENTES).doc(id);
  return db.runTransaction(async (transaccion) => {
    const documento = await transaccion.get(referencia);
    if (!documento.exists) return { ok: false, motivo: "no-encontrado" };
    const incidente = convertirIncidente(documento.id, documento.data());
    if (incidente.uid !== uid) return { ok: false, motivo: "no-autorizado" };
    transaccion.update(referencia, { fotoUrl: null });
    return { ok: true, fotoUrl: incidente.fotoUrl };
  });
}

export function crearRepositorioFirestore(db: Firestore): RepositorioIncidentesFirestore {
  return {
    async listarPorLatitud(sur, norte, limite) {
      const resultado = await db
        .collection(COLECCION_INCIDENTES)
        .where("lat", ">=", sur)
        .where("lat", "<=", norte)
        .limit(limite)
        .get();

      return resultado.docs.map((documento) => convertirIncidente(documento.id, documento.data()));
    },
    async obtener(id) {
      const documento = await db.collection(COLECCION_INCIDENTES).doc(id).get();
      if (!documento.exists) return null;
      return convertirIncidente(documento.id, documento.data());
    },
    async historial(id): Promise<EventoHistorial[]> {
      const resultado = await db
        .collection(COLECCION_INCIDENTES)
        .doc(id)
        .collection(COLECCION_HISTORIAL)
        .orderBy("creadoEn", "asc")
        .get();

      return resultado.docs.map((documento) => eventoHistorialSchema.parse(documento.data()));
    },
    async listarPorUsuario(uid) {
      return leerPorUsuario(db, uid);
    },
    async crear(nuevo: NuevoIncidente, uid: string): Promise<ResultadoCreacionIncidente> {
      return guardarIncidente(db, nuevo, uid);
    },
    apoyar(id, uid) {
      return apoyarIncidente(db, id, uid);
    },
    actualizarFoto(id, uid, fotoUrl) {
      return actualizarFoto(db, id, uid, fotoUrl);
    },
    eliminarFoto(id, uid) {
      return eliminarFoto(db, id, uid);
    },
  };
}

function firestoreConfigurado(): Firestore {
  const db = getFirestoreAdmin();
  if (!db) throw new Error("Firebase Admin no está configurado en el servidor");
  return db;
}

export const repositorioIncidentesFirestore: RepositorioIncidentesFirestore = {
  listarPorLatitud(sur, norte, limite) {
    return crearRepositorioFirestore(firestoreConfigurado()).listarPorLatitud(sur, norte, limite);
  },
  obtener(id) {
    return crearRepositorioFirestore(firestoreConfigurado()).obtener(id);
  },
  historial(id) {
    return crearRepositorioFirestore(firestoreConfigurado()).historial(id);
  },
  listarPorUsuario(uid) {
    return crearRepositorioFirestore(firestoreConfigurado()).listarPorUsuario(uid);
  },
  crear(nuevo, uid) {
    return crearRepositorioFirestore(firestoreConfigurado()).crear(nuevo, uid);
  },
  apoyar(id, uid) {
    return crearRepositorioFirestore(firestoreConfigurado()).apoyar(id, uid);
  },
  actualizarFoto(id, uid, fotoUrl) {
    return crearRepositorioFirestore(firestoreConfigurado()).actualizarFoto(id, uid, fotoUrl);
  },
  eliminarFoto(id, uid) {
    return crearRepositorioFirestore(firestoreConfigurado()).eliminarFoto(id, uid);
  },
};
