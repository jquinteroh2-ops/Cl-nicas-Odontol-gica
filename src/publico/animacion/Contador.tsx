/**
 * Cifra que sube desde cero cuando la banda entra en pantalla.
 *
 * La curva frena al final —no es lineal— porque un número que llega despacio a
 * su valor se lee; uno que se detiene en seco parece un error de carga.
 */

import { useEffect, useState } from 'react';
import { formatoNumero } from '@compartido/formato';
import usarEnVista from './usarEnVista';
import { prefiereMenosMovimiento } from './preferencias';

interface Props {
  hasta: number;
  prefijo?: string;
  sufijo?: string;
  /** Duración en milisegundos. */
  duracion?: number;
  className?: string;
}

export default function Contador({
  hasta,
  prefijo = '',
  sufijo = '',
  duracion = 1800,
  className = '',
}: Props) {
  const { ref, visible } = usarEnVista<HTMLSpanElement>();
  const [valor, setValor] = useState(0);

  useEffect(() => {
    if (!visible) return;

    if (prefiereMenosMovimiento()) {
      setValor(hasta);
      return;
    }

    let cuadro = 0;
    const inicio = performance.now();

    const paso = (ahora: number) => {
      const avance = Math.min(1, (ahora - inicio) / duracion);
      const suavizado = avance === 1 ? 1 : 1 - Math.pow(2, -10 * avance);
      setValor(Math.round(hasta * suavizado));
      if (avance < 1) cuadro = requestAnimationFrame(paso);
    };

    cuadro = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(cuadro);
  }, [visible, hasta, duracion]);

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {/* El valor final se anuncia una sola vez; el conteo intermedio es ruido
          para un lector de pantalla. */}
      <span aria-hidden>
        {prefijo}
        {formatoNumero(valor)}
        {sufijo}
      </span>
      <span className="sr-only">{`${prefijo}${formatoNumero(hasta)}${sufijo}`}</span>
    </span>
  );
}
