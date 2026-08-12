/**
 * Las citas del paciente vistas como mes.
 *
 * La lista de "más adelante" contesta cuál es la próxima; el calendario
 * contesta otra cosa: cómo se reparten en el mes y cuánto falta. En ortodoncia,
 * donde se viene cada treinta días durante año y medio, ver el ritmo marcado
 * sobre el mes es lo que hace entender el tratamiento.
 *
 * Solo se pintan las citas que la clínica ya confirmó. Una solicitud sin
 * resolver no ocupa día: marcarla sería prometer algo que aún no existe.
 */

import { useMemo, useState } from 'react';
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  subMonths,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';
import { claveDia } from '@compartido/disponibilidad';
import { ETIQUETA_TIPO_CITA, formatoFechaConDia, formatoHora } from '@compartido/formato';
import type { Cita } from '@compartido/tipos';
import Tarjeta from '@componentes/ui/Tarjeta';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  citas: Cita[];
  nombrePorProfesional: Record<string, string>;
}

export default function CalendarioCitas({ citas, nombrePorProfesional }: Props) {
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [diaElegido, setDiaElegido] = useState<string | null>(null);

  /* Un día puede tener más de una cita; el mapa guarda todas y ordenadas. */
  const porDia = useMemo(() => {
    const mapa = new Map<string, Cita[]>();
    for (const cita of citas) {
      if (cita.estado === 'cancelada') continue;
      const clave = claveDia(cita.fechaHora);
      mapa.set(clave, [...(mapa.get(clave) ?? []), cita]);
    }
    for (const lista of mapa.values()) {
      lista.sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
    }
    return mapa;
  }, [citas]);

  const celdas = useMemo(() => {
    const primero = startOfMonth(mes);
    const dias = eachDayOfInterval({ start: primero, end: endOfMonth(mes) });
    // getDay(): 0 = domingo. La semana empieza en lunes, así que domingo va al final.
    const desplazamiento = (primero.getDay() + 6) % 7;
    return [...Array.from({ length: desplazamiento }, () => null), ...dias];
  }, [mes]);

  if (citas.length === 0) return null;

  const citasDelDia = diaElegido ? (porDia.get(diaElegido) ?? []) : [];

  return (
    <section>
      <div className="mb-4 flex items-center gap-2.5">
        <CalendarDays className="h-5 w-5 shrink-0 text-slate-400" aria-hidden strokeWidth={1.5} />
        <h2 className="text-xl font-semibold tracking-tight text-slate-900">Tu calendario</h2>
      </div>

      <Tarjeta className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setMes(subMonths(mes, 1))}
            aria-label="Mes anterior"
            className="grid h-11 w-11 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>

          <p aria-live="polite" className="text-lg font-semibold tracking-tight text-slate-900">
            {format(mes, 'MMMM yyyy', { locale: es }).replace(/^./, (letra) => letra.toUpperCase())}
          </p>

          <button
            type="button"
            onClick={() => setMes(addMonths(mes, 1))}
            aria-label="Mes siguiente"
            className="grid h-11 w-11 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-7 gap-1">
          {DIAS_SEMANA.map((dia, indice) => (
            <div key={indice} className="py-1 text-center text-xs font-semibold text-slate-400">
              {dia}
            </div>
          ))}
        </div>

        <div className="mt-1 grid grid-cols-7 gap-1">
          {celdas.map((dia, indice) => {
            if (!dia) return <div key={`vacio-${indice}`} />;

            const clave = claveDia(dia);
            const delDia = porDia.get(clave) ?? [];
            const tieneCita = delDia.length > 0 && isSameMonth(dia, mes);
            const elegido = clave === diaElegido;
            const hoy = isToday(dia);

            // Verde si ya vino, petróleo si está por venir: el color cuenta la
            // historia del tratamiento sin una sola palabra de leyenda.
            const asistida = delDia.some((c) => c.estado === 'asistio');
            const falto = delDia.every((c) => c.estado === 'no_asistio');

            return (
              <button
                key={clave}
                type="button"
                disabled={!tieneCita}
                onClick={() => setDiaElegido(elegido ? null : clave)}
                aria-pressed={elegido}
                aria-label={`${format(dia, "d 'de' MMMM", { locale: es })}${tieneCita ? ', con cita' : ''}`}
                className={`relative grid h-11 place-items-center rounded-xl text-sm tabular-nums transition-all ${
                  elegido
                    ? 'bg-petroleo-600 font-semibold text-white shadow-suave'
                    : tieneCita
                      ? 'font-semibold text-slate-900 ring-1 ring-slate-200/70 hover:bg-petroleo-50'
                      : hoy
                        ? 'font-medium text-slate-500'
                        : 'text-slate-300'
                }`}
              >
                {format(dia, 'd')}
                {tieneCita && !elegido && (
                  <span
                    className={`absolute bottom-1.5 h-1.5 w-1.5 rounded-full ${
                      falto ? 'bg-red-500' : asistida ? 'bg-emerald-500' : 'bg-petroleo-600'
                    }`}
                    aria-hidden
                  />
                )}
                {hoy && !tieneCita && (
                  <span className="absolute bottom-1.5 h-1 w-1 rounded-full bg-slate-300" aria-hidden />
                )}
              </button>
            );
          })}
        </div>

        {/* El detalle sustituye a la leyenda: se toca un día marcado y se lee. */}
        {citasDelDia.length > 0 ? (
          <div className="animar-entrada mt-5 border-t border-slate-100 pt-5">
            <p className="rotulo">{formatoFechaConDia(citasDelDia[0].fechaHora)}</p>
            <ul className="mt-3 space-y-3">
              {citasDelDia.map((cita) => (
                <li key={cita.id} className="flex items-baseline gap-3">
                  <span className="w-20 shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                    {formatoHora(cita.fechaHora)}
                  </span>
                  <span className="min-w-0">
                    <span className="block font-medium text-slate-800">
                      {ETIQUETA_TIPO_CITA[cita.tipo]}
                    </span>
                    {nombrePorProfesional[cita.profesionalId] && (
                      <span className="block text-sm text-slate-500">
                        {nombrePorProfesional[cita.profesionalId]}
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="mt-5 border-t border-slate-100 pt-5 text-xs leading-relaxed text-slate-500">
            Los días marcados tienen cita. Toca uno para ver la hora.
          </p>
        )}
      </Tarjeta>
    </section>
  );
}
