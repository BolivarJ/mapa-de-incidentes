import "server-only";
import type { Firestore } from "firebase-admin/firestore";
import { getFirestoreAdmin } from "@/lib/firebase-admin";
import type {
  RepositorioIncidentesFirestore,
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
const incidenteAlmacenadoSchema = incidenteSchema.omit({ id: true });

function convertirIncidente(id: string, datos: unknown): Incidente {
  return { ...incidenteAlmacenadoSchema.parse(datos), id };
}

async function guardarIncidente(db: Firestore, nuevo: NuevoIncidente, uid: string) {
  const referencia = db.collection(COLECCION_INCIDENTES).doc();
  const creadoEn = new Date().toISOString();
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
  const lote = db.batch();
  lote.set(referencia, incidenteAlmacenadoSchema.parse(datos));
  lote.set(referenciaEvento, evento);
  await lote.commit();
  return incidente;
}

async function leerPorUsuario(db: Firestore, uid: string): Promise<Incidente[]> {
  const resultado = await db.collection(COLECCION_INCIDENTES).where("uid", "==", uid).get();
  return resultado.docs
    .map((documento) => convertirIncidente(documento.id, documento.data()))
    .sort((a, b) => b.creadoEn.localeCompare(a.creadoEn));
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
    async crear(nuevo: NuevoIncidente, uid: string): Promise<Incidente> {
      return guardarIncidente(db, nuevo, uid);
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
  actualizarFoto(id, uid, fotoUrl) {
    return crearRepositorioFirestore(firestoreConfigurado()).actualizarFoto(id, uid, fotoUrl);
  },
  eliminarFoto(id, uid) {
    return crearRepositorioFirestore(firestoreConfigurado()).eliminarFoto(id, uid);
  },
};
