/**
 * Calendario mensual.
 *
 * Solo se pueden pulsar los días que vienen en `diasDisponibles`, que la capa de
 * datos calcula mirando la ocupación real. Domingos, sábados sin cupo por la
 * tarde y días llenos quedan apagados. Pedir una cita imposible y que la
 * rechacen es la peor experiencia posible.
 */

import { useMemo } from 'react';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { claveDia } from '@compartido/disponibilidad';
import Esqueleto from '@componentes/ui/Esqueleto';

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface Props {
  mes: Date;
  diaElegido?: string;
  diasDisponibles: string[];
  cargando: boolean;
  /** Mes mínimo navegable: no tiene sentido retroceder al pasado. */
  alCambiarMes: (mes: Date) => void;
  alElegirDia: (clave: string) => void;
}

export default function Calendario({
  mes,
  diaElegido,
  diasDisponibles,
  cargando,
  alCambiarMes,
  alElegirDia,
}: Props) {
  const disponibles = useMemo(() => new Set(diasDisponibles), [diasDisponibles]);

  const celdas = useMemo(() => {
    const primero = startOfMonth(mes);
    const dias = eachDayOfInterval({ start: primero, end: endOfMonth(mes) });
    // getDay(): 0 = domingo. La semana empieza en lunes, así que domingo va al final.
    const desplazamiento = (primero.getDay() + 6) % 7;
    return [...Array.from({ length: desplazamiento }, () => null), ...dias];
  }, [mes]);

  const mesActual = startOfMonth(new Date());
  const puedeRetroceder = startOfMonth(mes) > mesActual;
  const puedeAvanzar = startOfMonth(mes) < addMonths(mesActual, 2);

  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => alCambiarMes(subMonths(mes, 1))}
          disabled={!puedeRetroceder}
          aria-label="Mes anterior"
          className="grid h-11 w-11 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <p aria-live="polite" className="text-lg font-semibold tracking-tight text-slate-900">
          {format(mes, 'MMMM yyyy', { locale: es }).replace(/^./, (letra) => letra.toUpperCase())}
        </p>

        <button
          type="button"
          onClick={() => alCambiarMes(addMonths(mes, 1))}
          disabled={!puedeAvanzar}
          aria-label="Mes siguiente"
          className="grid h-11 w-11 place-items-center rounded-2xl text-slate-500 transition-colors hover:bg-slate-100 disabled:pointer-events-none disabled:opacity-30"
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

      {cargando ? (
        <div className="mt-1 grid grid-cols-7 gap-1">
          {Array.from({ length: 35 }).map((_, indice) => (
            <Esqueleto key={indice} className="h-11 w-full" />
          ))}
        </div>
      ) : (
        <div className="mt-1 grid grid-cols-7 gap-1">
          {celdas.map((dia, indice) => {
            if (!dia) return <div key={`vacio-${indice}`} />;

            const clave = claveDia(dia);
            const habilitado = disponibles.has(clave) && isSameMonth(dia, mes);
            const elegido = clave === diaElegido;
            const hoy = isToday(dia);

            return (
              <button
                key={clave}
                type="button"
                disabled={!habilitado}
                onClick={() => alElegirDia(clave)}
                aria-pressed={elegido}
                aria-label={format(dia, "d 'de' MMMM", { locale: es })}
                className={`relative grid h-11 place-items-center rounded-xl text-sm tabular-nums transition-all ${
                  elegido
                    ? 'bg-petroleo-600 font-semibold text-white shadow-suave'
                    : habilitado
                      ? 'font-medium text-slate-800 ring-1 ring-slate-200/70 hover:bg-petroleo-50 hover:ring-petroleo-300'
                      : 'text-slate-300'
                }`}
              >
                {format(dia, 'd')}
                {hoy && !elegido && (
                  <span
                    className="absolute bottom-1.5 h-1 w-1 rounded-full bg-petroleo-600"
                    aria-hidden
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      <p className="mt-5 text-xs leading-relaxed text-slate-500">
        Solo aparecen los días con cupo disponible. Los domingos no atendemos y los sábados solo
        hasta el mediodía.
      </p>
    </div>
  );
}
