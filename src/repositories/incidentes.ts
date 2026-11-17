import type { EventoHistorial, Incidente, NuevoIncidente } from "@/schemas/incidente";

/** Contrato común para repositorios de incidentes. */
export interface RepositorioIncidentes {
  /** Firestore solo admite rango en un campo: se consulta por latitud y la longitud se filtra después. */
  listarPorLatitud(sur: number, norte: number, limite: number): Promise<Incidente[]>;
  obtener(id: string): Promise<Incidente | null>;
  historial(id: string): Promise<EventoHistorial[]>;
}

export interface RepositorioCreacionIncidente {
  crear(nuevo: NuevoIncidente, uid: string): Promise<Incidente>;
}

export interface RepositorioReportesUsuario {
  listarPorUsuario(uid: string): Promise<Incidente[]>;
}

export type ResultadoActualizacionFoto =
  | { ok: true; urlAnterior: string | null }
  | { ok: false; motivo: "no-encontrado" | "no-autorizado" };

export type ResultadoEliminacionFoto =
  { ok: true; fotoUrl: string | null } | { ok: false; motivo: "no-encontrado" | "no-autorizado" };

export interface RepositorioFotosIncidente {
  actualizarFoto(id: string, uid: string, fotoUrl: string): Promise<ResultadoActualizacionFoto>;
  eliminarFoto(id: string, uid: string): Promise<ResultadoEliminacionFoto>;
}

export interface RepositorioIncidentesFirestore
  extends
    RepositorioIncidentes,
    RepositorioCreacionIncidente,
    RepositorioReportesUsuario,
    RepositorioFotosIncidente {}
