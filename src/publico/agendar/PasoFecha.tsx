/**
 * Paso 2 · ¿Cuándo?
 *
 * Calendario arriba, franjas del día elegido abajo. Las franjas se agrupan en
 * mañana y tarde porque la jornada es larga y una lista de veinte horas seguidas
 * no se lee en un celular.
 */

import { useMemo } from 'react';
import { parseISO } from 'date-fns';
import { CalendarX2, Sun, Sunset } from 'lucide-react';
import type { FranjaDisponible, TipoCita } from '@compartido/tipos';
import { formatoDuracion, formatoFechaConDia, formatoHora } from '@compartido/formato';
import { DURACION_POR_TIPO } from '@compartido/disponibilidad';
import { EsqueletoFranjas } from '@componentes/ui/Esqueleto';
import EstadoVacio from '@componentes/ui/EstadoVacio';
import Calendario from './Calendario';

interface Props {
  tipo: TipoCita;
  mes: Date;
  diaElegido?: string;
  horarioElegido?: string;
  diasDisponibles: string[];
  franjas: FranjaDisponible[];
  cargandoDias: boolean;
  cargandoFranjas: boolean;
  alCambiarMes: (mes: Date) => void;
  alElegirDia: (clave: string) => void;
  alElegirHorario: (inicio: string) => void;
}

export default function PasoFecha({
  tipo,
  mes,
  diaElegido,
  horarioElegido,
  diasDisponibles,
  franjas,
  cargandoDias,
  cargandoFranjas,
  alCambiarMes,
  alElegirDia,
  alElegirHorario,
}: Props) {
  const grupos = useMemo(() => {
    const manana = franjas.filter((f) => parseISO(f.inicio).getHours() < 12);
    const tarde = franjas.filter((f) => parseISO(f.inicio).getHours() >= 12);
    return [
      { titulo: 'Mañana', icono: Sun, franjas: manana },
      { titulo: 'Tarde', icono: Sunset, franjas: tarde },
    ].filter((grupo) => grupo.franjas.length > 0);
  }, [franjas]);

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">¿Cuándo?</h1>
      <p className="mt-2.5 leading-relaxed text-slate-600">
        La cita dura {formatoDuracion(DURACION_POR_TIPO[tipo])}. Elige el día y la hora que te sirva.
      </p>

      <div className="mt-8 rounded-3xl bg-white p-4 shadow-suave ring-1 ring-slate-200/70 sm:p-6">
        <Calendario
          mes={mes}
          diaElegido={diaElegido}
          diasDisponibles={diasDisponibles}
          cargando={cargandoDias}
          alCambiarMes={alCambiarMes}
          alElegirDia={alElegirDia}
        />
      </div>

      {diaElegido && (
        <div className="mt-8">
          <h2 className="text-base font-semibold tracking-tight text-slate-900">
            Horarios libres · {formatoFechaConDia(`${diaElegido}T00:00:00`)}
          </h2>

          {cargandoFranjas ? (
            <div className="mt-4">
              <EsqueletoFranjas />
            </div>
          ) : franjas.length === 0 ? (
            <EstadoVacio
              className="mt-4 rounded-3xl bg-white shadow-suave ring-1 ring-slate-200/70"
              icono={<CalendarX2 className="h-6 w-6" aria-hidden strokeWidth={1.5} />}
              titulo="Ese día se acaba de llenar"
              descripcion="Alguien tomó el último cupo. Elige otro día en el calendario."
            />
          ) : (
            <div className="mt-5 space-y-6">
              {grupos.map((grupo) => {
                const Icono = grupo.icono;
                return (
                  <div key={grupo.titulo}>
                    <p className="rotulo flex items-center gap-1.5">
                      <Icono className="h-3.5 w-3.5" aria-hidden />
                      {grupo.titulo}
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2.5 sm:grid-cols-4">
                      {grupo.franjas.map((franja) => {
                        const elegida = franja.inicio === horarioElegido;
                        return (
                          <button
                            key={franja.inicio}
                            type="button"
                            onClick={() => alElegirHorario(franja.inicio)}
                            aria-pressed={elegida}
                            className={`h-13 rounded-2xl text-sm font-medium tabular-nums transition-all ${
                              elegida
                                ? 'bg-petroleo-600 text-white shadow-suave'
                                : 'bg-white text-slate-800 ring-1 ring-slate-200/70 hover:bg-petroleo-50 hover:ring-petroleo-300'
                            }`}
                          >
                            {formatoHora(franja.inicio)}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
