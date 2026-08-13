/**
 * Barra que se llena al entrar en pantalla.
 *
 * El ancho se anima con una transición, no con un fotograma por paso: el
 * navegador la interpola en el compositor y no hay recálculo de diseño en cada
 * cuadro. El porcentaje escrito sí cuenta, para que el número acompañe al trazo.
 */

import Contador from './Contador';
import usarEnVista from './usarEnVista';

interface Props {
  nombre: string;
  porcentaje: number;
  /** Retardo en milisegundos, para que las barras se llenen en cascada. */
  retardo?: number;
}

export default function BarraProporcion({ nombre, porcentaje, retardo = 0 }: Props) {
  const { ref, visible } = usarEnVista<HTMLDivElement>();

  return (
    <div ref={ref}>
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-slate-700">{nombre}</span>
        <span className="text-sm font-semibold text-petroleo-700">
          <Contador hasta={porcentaje} sufijo="%" duracion={1400} />
        </span>
      </div>

      <div
        className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"
        role="progressbar"
        aria-label={nombre}
        aria-valuenow={porcentaje}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full rounded-full bg-gradient-to-r from-petroleo-500 to-petroleo-700 transition-[width] duration-1000 ease-suave"
          style={{
            width: visible ? `${porcentaje}%` : '0%',
            transitionDelay: `${retardo}ms`,
          }}
        />
      </div>
    </div>
  );
}
