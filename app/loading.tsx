import { Esqueleto } from "@/components/EstadoDatos";

export default function Cargando() {
  return (
    <div aria-busy="true">
      <p className="visualmente-oculto" role="status">
        Cargando…
      </p>
      <Esqueleto />
    </div>
  );
}
