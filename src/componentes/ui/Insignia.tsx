/**
 * Etiqueta de estado.
 *
 * Semántica de color fija en toda la aplicación:
 *   verde  = confirmado, pagado, al día
 *   ámbar  = pendiente, sujeto a aprobación
 *   rojo   = vencido, no asistió, rechazado
 *   neutro = informativo, sin carga
 */

import type { ReactNode } from 'react';

export type TonoInsignia = 'verde' | 'ambar' | 'rojo' | 'neutro' | 'petroleo';

/* Fondo muy lavado y texto oscuro: la insignia informa, no compite con el título. */
const TONOS: Record<TonoInsignia, string> = {
  verde: 'bg-emerald-50/80 text-emerald-800 ring-emerald-600/15',
  ambar: 'bg-amber-50/80 text-amber-900 ring-amber-600/15',
  rojo: 'bg-red-50/80 text-red-800 ring-red-600/15',
  neutro: 'bg-slate-100/80 text-slate-600 ring-slate-500/15',
  petroleo: 'bg-petroleo-50 text-petroleo-800 ring-petroleo-600/15',
};

interface Props {
  children: ReactNode;
  tono?: TonoInsignia;
  icono?: ReactNode;
  className?: string;
}

export default function Insignia({ children, tono = 'neutro', icono, className = '' }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset ${TONOS[tono]} ${className}`}
    >
      {icono}
      {children}
    </span>
  );
}
