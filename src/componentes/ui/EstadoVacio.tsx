/**
 * Estado vacío. Nunca una pantalla en blanco: siempre se dice qué falta y,
 * cuando tiene sentido, se ofrece la acción que lo resuelve.
 */

import type { ReactNode } from 'react';

interface Props {
  icono?: ReactNode;
  titulo: string;
  descripcion?: string;
  accion?: ReactNode;
  className?: string;
}

export default function EstadoVacio({ icono, titulo, descripcion, accion, className = '' }: Props) {
  return (
    <div className={`px-6 py-14 text-center ${className}`}>
      {icono && (
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-3xl bg-slate-100/80 text-slate-400 ring-1 ring-slate-200/60">
          {icono}
        </span>
      )}
      <p className="mt-5 text-lg font-semibold tracking-tight text-slate-800">{titulo}</p>
      {descripcion && (
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-500">{descripcion}</p>
      )}
      {accion && <div className="mt-7 flex justify-center">{accion}</div>}
    </div>
  );
}
