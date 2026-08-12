/**
 * Rejilla semanal: seis columnas de lunes a sábado sobre una escala horaria.
 *
 * Las citas van posicionadas por su hora real, no apiladas en una lista, porque
 * lo que la clínica lee de un vistazo son los huecos: dónde cabe alguien y
 * dónde no. Una lista ordenada no enseña eso.
 *
 * Solo se dibuja en tableta y escritorio; en celular la reemplaza ListaDia.
 */

import { format, isSameDay, isToday } from 'date-fns';
import { es } from 'date-fns/locale';
import { ETIQUETA_TIPO_CITA, formatoHora, nombreCompleto } from '@compartido/formato';
import { jornadaDe } from '@compartido/disponibilidad';
import {
  ALTO_HORA,
  HORA_APERTURA,
  HORA_CIERRE,
  posicionDe,
  repartirEnColumnas,
  type CitaConContexto,
} from './tipos';

const HORAS = Array.from({ length: HORA_CIERRE - HORA_APERTURA }, (_, i) => HORA_APERTURA + i);

interface Props {
  dias: Date[];
  citas: CitaConContexto[];
  alAbrirCita: (entrada: CitaConContexto) => void;
}

export default function RejillaSemana({ dias, citas, alAbrirCita }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[640px]">
        {/* Encabezado de días, pegado arriba al desplazar la página. */}
        <div className="sticky top-16 z-10 flex border-b border-slate-200/70 bg-white/90 backdrop-blur-md">
          <div className="w-14 shrink-0" />
          {dias.map((dia) => {
            const hoy = isToday(dia);
            return (
              <div key={dia.toISOString()} className="flex-1 px-2 py-3 text-center">
                <p className="text-[11px] uppercase tracking-wide text-slate-400">
                  {format(dia, 'EEE', { locale: es })}
                </p>
                <p
                  className={`mx-auto mt-1 grid h-8 w-8 place-items-center rounded-full text-sm font-semibold tabular-nums ${
                    hoy ? 'bg-petroleo-600 text-white' : 'text-slate-800'
                  }`}
                >
                  {format(dia, 'd')}
                </p>
              </div>
            );
          })}
        </div>

        <div className="flex">
          {/* Columna de horas. El texto se sube media línea para alinearlo con su filete. */}
          <div className="w-14 shrink-0">
            {HORAS.map((hora) => (
              <div key={hora} className="relative" style={{ height: ALTO_HORA }}>
                <span className="absolute -top-2 right-2 text-[11px] tabular-nums text-slate-400">
                  {formatoHora(new Date(2000, 0, 1, hora, 0))}
                </span>
              </div>
            ))}
          </div>

          {dias.map((dia) => {
            const jornada = jornadaDe(dia);
            const citasDelDia = citas.filter(({ cita }) => isSameDay(new Date(cita.fechaHora), dia));

            return (
              <div
                key={dia.toISOString()}
                className="relative flex-1 border-l border-slate-100"
                style={{ height: HORAS.length * ALTO_HORA }}
              >
                {HORAS.map((hora, indice) => {
                  // Fuera de jornada (sábado por la tarde) se apaga con una trama gris.
                  const cerrado = !jornada || hora >= jornada.cierreHora;
                  return (
                    <div
                      key={hora}
                      className={`absolute inset-x-0 border-t border-slate-100 ${
                        cerrado ? 'bg-slate-50/70' : ''
                      }`}
                      style={{ top: indice * ALTO_HORA, height: ALTO_HORA }}
                      aria-hidden
                    />
                  );
                })}

                {repartirEnColumnas(citasDelDia).map(({ entrada, columna, columnas }) => {
                  const { cita, paciente, profesional } = entrada;
                  const inicio = new Date(cita.fechaHora);
                  const { top, alto } = posicionDe(inicio, cita.duracionMinutos);
                  const color = profesional?.color ?? '#0f6e78';

                  return (
                    <button
                      key={cita.id}
                      type="button"
                      onClick={() => alAbrirCita(entrada)}
                      style={{
                        top,
                        height: alto,
                        // Cada cita ocupa su columna dentro del grupo solapado.
                        left: `calc(${(columna / columnas) * 100}% + 2px)`,
                        width: `calc(${100 / columnas}% - 4px)`,
                        borderLeftColor: color,
                        // Fondo del mismo tono, muy lavado: identifica sin gritar.
                        backgroundColor: `${color}14`,
                      }}
                      className={`absolute overflow-hidden rounded-lg border-l-[3px] px-2 py-1 text-left transition-all hover:brightness-95 ${
                        cita.estado === 'no_asistio' ? 'opacity-50 line-through' : ''
                      }`}
                    >
                      <span className="block truncate text-[11px] font-semibold tabular-nums text-slate-700">
                        {formatoHora(cita.fechaHora)}
                      </span>
                      <span className="block truncate text-xs font-medium leading-tight text-slate-900">
                        {paciente ? nombreCompleto(paciente) : 'Paciente'}
                      </span>
                      {alto > 50 && (
                        <span className="block truncate text-[11px] leading-tight text-slate-500">
                          {ETIQUETA_TIPO_CITA[cita.tipo]}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
