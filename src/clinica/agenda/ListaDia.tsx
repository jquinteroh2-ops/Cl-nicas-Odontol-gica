/**
 * La agenda de un solo día, para el celular.
 *
 * Una rejilla de seis columnas en una pantalla de 390 px no se lee: cada
 * columna quedaría en 55 px y los nombres no caben. En celular se elige un día
 * y se ve su lista, que es además como trabaja de verdad quien está en el
 * mostrador.
 */

import { CalendarDays } from 'lucide-react';
import { ETIQUETA_ESTADO_CITA, ETIQUETA_TIPO_CITA, formatoHora, nombreCompleto } from '@compartido/formato';
import type { EstadoCita } from '@compartido/tipos';
import EstadoVacio from '@componentes/ui/EstadoVacio';
import Insignia, { type TonoInsignia } from '@componentes/ui/Insignia';
import type { CitaConContexto } from './tipos';

const TONO_ESTADO: Record<EstadoCita, TonoInsignia> = {
  confirmada: 'petroleo',
  asistio: 'verde',
  no_asistio: 'rojo',
  cancelada: 'neutro',
};

interface Props {
  citas: CitaConContexto[];
  alAbrirCita: (entrada: CitaConContexto) => void;
}

export default function ListaDia({ citas, alAbrirCita }: Props) {
  if (citas.length === 0) {
    return (
      <EstadoVacio
        icono={<CalendarDays className="h-6 w-6" aria-hidden />}
        titulo="Día libre"
        descripcion="No hay citas agendadas para este día."
      />
    );
  }

  return (
    <ul className="space-y-1 p-2">
      {citas.map((entrada) => {
        const { cita, paciente, profesional } = entrada;
        return (
          <li key={cita.id}>
            <button
              type="button"
              onClick={() => alAbrirCita(entrada)}
              className="flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left transition-all hover:bg-slate-50 active:scale-[0.99]"
            >
              <span className="w-20 shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                {formatoHora(cita.fechaHora)}
              </span>

              <span
                className="h-11 w-1 shrink-0 rounded-full"
                style={{ backgroundColor: profesional?.color ?? '#cbd5e1' }}
                aria-hidden
              />

              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-slate-900">
                  {paciente ? nombreCompleto(paciente) : 'Paciente'}
                </span>
                <span className="block truncate text-sm text-slate-500">
                  {ETIQUETA_TIPO_CITA[cita.tipo]}
                </span>
              </span>

              <span className="shrink-0">
                <Insignia tono={TONO_ESTADO[cita.estado]}>
                  {ETIQUETA_ESTADO_CITA[cita.estado]}
                </Insignia>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
