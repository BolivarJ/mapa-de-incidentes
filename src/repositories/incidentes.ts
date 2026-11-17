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

export interface RepositorioIncidentesFirestore
  extends RepositorioIncidentes, RepositorioCreacionIncidente, RepositorioReportesUsuario {}
