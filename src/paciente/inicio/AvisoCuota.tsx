/**
 * Tira de estado de cuenta en la portada del portal.
 *
 * No repite la tabla de cuotas: responde la única pregunta que se hace desde el
 * inicio —¿debo algo y cuándo vence?— y manda a la pantalla de cuenta para el
 * detalle. Una cuota vencida se muestra en rojo, pero sin regañar: el objetivo
 * es que la paciente venga a pagar, no que se sienta perseguida.
 */

import { ChevronRight, TriangleAlert, Wallet } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatoCOP, formatoDiaRelativo, formatoFechaLarga } from '@compartido/formato';
import type { ResumenCuotas } from '@paciente/cuenta/resumenCuotas';

export default function AvisoCuota({ resumen }: { resumen: ResumenCuotas }) {
  const hayVencida = resumen.vencidas.length > 0;

  return (
    <Link
      to="/portal/cuenta"
      className={`flex items-center gap-4 rounded-3xl bg-white p-5 shadow-suave ring-1 transition-all hover:shadow-media ${
        hayVencida ? 'ring-red-200/70 hover:bg-red-50/30' : 'ring-slate-200/70 hover:bg-slate-50'
      }`}
    >
      <span
        className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ring-1 ring-inset ${
          hayVencida
            ? 'bg-red-50 text-red-600 ring-red-600/10'
            : 'bg-slate-100 text-slate-500 ring-slate-500/10'
        }`}
        aria-hidden
      >
        {hayVencida ? (
          <TriangleAlert className="h-5 w-5" strokeWidth={1.5} />
        ) : (
          <Wallet className="h-5 w-5" strokeWidth={1.5} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        {resumen.alDia ? (
          <>
            <span className="block text-base font-semibold leading-tight text-slate-900">
              Estás al día
            </span>
            <span className="mt-1 block text-sm text-slate-500">No tienes cuotas pendientes.</span>
          </>
        ) : (
          <>
            <span className="block text-base font-semibold leading-tight text-balance text-slate-900">
              {hayVencida ? 'Tienes una cuota vencida' : 'Próxima cuota'}
              {resumen.proxima && <> · {formatoCOP(resumen.proxima.valor)}</>}
            </span>
            {resumen.proxima && (
              <span
                className={`mt-1 block text-sm leading-snug ${
                  hayVencida ? 'text-red-700' : 'text-slate-500'
                }`}
              >
                {hayVencida ? 'Venció' : 'Vence'} el{' '}
                {formatoFechaLarga(resumen.proxima.fechaVencimiento)} ·{' '}
                {formatoDiaRelativo(resumen.proxima.fechaVencimiento)}
              </span>
            )}
          </>
        )}
      </span>

      <ChevronRight className="h-5 w-5 shrink-0 text-slate-300" aria-hidden />
    </Link>
  );
}
