/**
 * Una cuota del plan de pagos.
 *
 * Lista y no tabla: en un celular una tabla de cinco columnas obliga a hacer
 * scroll horizontal. La cuota 0 se llama "cuota inicial" porque así la nombran
 * en la clínica; nadie dice "cuota número cero".
 */

import { Check, Clock, TriangleAlert } from 'lucide-react';
import type { Cuota } from '@compartido/tipos';
import {
  ETIQUETA_ESTADO_CUOTA,
  ETIQUETA_METODO_PAGO,
  formatoCOP,
  formatoFechaLarga,
  formatoMes,
} from '@compartido/formato';
import Insignia, { type TonoInsignia } from '@componentes/ui/Insignia';

const TONO: Record<Cuota['estado'], TonoInsignia> = {
  pagada: 'verde',
  pendiente: 'ambar',
  vencida: 'rojo',
};

const ICONO: Record<Cuota['estado'], typeof Check> = {
  pagada: Check,
  pendiente: Clock,
  vencida: TriangleAlert,
};

const FONDO_ICONO: Record<Cuota['estado'], string> = {
  pagada: 'bg-emerald-50 text-emerald-600 ring-emerald-600/10',
  pendiente: 'bg-amber-50 text-amber-600 ring-amber-600/10',
  vencida: 'bg-red-50 text-red-600 ring-red-600/10',
};

export default function FilaCuota({ cuota }: { cuota: Cuota }) {
  const Icono = ICONO[cuota.estado];
  const titulo =
    cuota.numeroCuota === 0 ? 'Cuota inicial' : `Cuota ${cuota.numeroCuota} · ${formatoMes(cuota.mesCorrespondiente)}`;

  return (
    <li className="flex items-start gap-3.5 px-6 py-4">
      <span
        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ring-1 ring-inset ${FONDO_ICONO[cuota.estado]}`}
        aria-hidden
      >
        <Icono className="h-4 w-4" strokeWidth={2} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-base font-medium leading-snug text-slate-800">{titulo}</p>
        <p className="mt-1 text-sm leading-snug text-slate-500">
          {cuota.estado === 'pagada' ? (
            <>
              Pagada el {cuota.fechaPago ? formatoFechaLarga(cuota.fechaPago) : '—'}
              {cuota.metodoPago && <> · {ETIQUETA_METODO_PAGO[cuota.metodoPago]}</>}
            </>
          ) : (
            <>Vence el {formatoFechaLarga(cuota.fechaVencimiento)}</>
          )}
        </p>
      </div>

      <div className="shrink-0 text-right">
        <p
          className={`text-base font-semibold tabular-nums ${
            cuota.estado === 'pagada' ? 'text-slate-400' : 'text-slate-900'
          }`}
        >
          {formatoCOP(cuota.valor)}
        </p>
        <Insignia tono={TONO[cuota.estado]} className="mt-1.5">
          {ETIQUETA_ESTADO_CUOTA[cuota.estado]}
        </Insignia>
      </div>
    </li>
  );
}
