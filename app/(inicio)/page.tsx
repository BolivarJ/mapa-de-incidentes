import { ExploradorIncidentes } from "@/components/ExploradorIncidentes";
import { CIUDAD } from "@/lib/ciudad";

export default function Inicio() {
  return (
    <>
      <h1>Incidentes del barrio en {CIUDAD.nombre}</h1>
      <p className="intro">
        Mueva el mapa para ver los reportes de esa zona. La lista bajo el mapa muestra los mismos
        incidentes y se puede recorrer con el teclado.
      </p>
      <ExploradorIncidentes limites={CIUDAD.limites} />
    </>
  );
}
