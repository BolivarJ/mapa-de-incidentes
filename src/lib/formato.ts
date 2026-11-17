const FECHA = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeZone: "America/Bogota" });
const FECHA_HORA = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "America/Bogota",
});

export const formatearFecha = (iso: string) => FECHA.format(new Date(iso));
export const formatearFechaHora = (iso: string) => FECHA_HORA.format(new Date(iso));
