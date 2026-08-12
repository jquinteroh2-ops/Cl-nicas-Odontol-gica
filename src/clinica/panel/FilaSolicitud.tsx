/**
 * Una solicitud esperando respuesta.
 *
 * Lo que decide el orden de lectura es el reloj: la clínica reserva el cupo 24 h
 * y, si nadie contesta, se libera. Por eso el tiempo restante va destacado y en
 * rojo cuando aprieta, no escondido en letra pequeña.
 */

import { CalendarClock, ChevronRight, Clock, UserPlus } from 'lucide-react';
import type { Paciente, SolicitudCita } from '@compartido/tipos';
import { useConsulta } from '@compartido/contexto';
import { ETIQUETA_TIPO_CITA, aFecha, formatoFechaHoraLarga } from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Insignia from '@componentes/ui/Insignia';
import { esPacienteNuevo, nombreDeSolicitud } from './solicitud';

/** Texto y tono del tiempo que queda antes de que el cupo se libere. */
function cuentaRegresiva(expiraEn?: string): { texto: string; urgente: boolean } | null {
  if (!expiraEn) return null;
  const restanteMs = aFecha(expiraEn).getTime() - Date.now();
  if (restanteMs <= 0) return { texto: 'Vencida', urgente: true };

  const horas = Math.floor(restanteMs / 3_600_000);
  if (horas < 1) {
    const minutos = Math.max(1, Math.floor(restanteMs / 60_000));
    return { texto: `Vence en ${minutos} min`, urgente: true };
  }
  return { texto: `Vence en ${horas} h`, urgente: horas < 6 };
}

interface Props {
  solicitud: SolicitudCita;
  alResolver: () => void;
}

export default function FilaSolicitud({ solicitud, alResolver }: Props) {
  const consultaPaciente = useConsulta<Paciente | null>(
    async () => (solicitud.pacienteId ? api.obtenerPaciente(solicitud.pacienteId) : null),
    [solicitud.pacienteId],
  );

  const nombre = nombreDeSolicitud(solicitud, consultaPaciente.datos);
  const reloj = cuentaRegresiva(solicitud.expiraEn);

  return (
    <li>
      <button
        type="button"
        onClick={alResolver}
        className="group flex w-full items-center gap-4 rounded-3xl px-5 py-4 text-left transition-all hover:bg-slate-50 active:scale-[0.99]"
      >
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="truncate font-semibold tracking-tight text-slate-900">{nombre}</span>
            {esPacienteNuevo(solicitud) && (
              <Insignia tono="ambar" icono={<UserPlus className="h-3.5 w-3.5" aria-hidden />}>
                Nuevo
              </Insignia>
            )}
          </span>

          <span className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-600">
            <CalendarClock className="h-4 w-4 shrink-0 text-slate-400" aria-hidden />
            <span className="truncate">
              {ETIQUETA_TIPO_CITA[solicitud.tipo]} · {formatoFechaHoraLarga(solicitud.fechaHoraSolicitada)}
            </span>
          </span>

          {reloj && (
            <span
              className={`mt-2 inline-flex items-center gap-1.5 text-xs font-medium ${
                reloj.urgente ? 'text-red-700' : 'text-slate-400'
              }`}
            >
              <Clock className="h-3.5 w-3.5" aria-hidden />
              {reloj.texto}
            </span>
          )}
        </span>

        <ChevronRight
          className="h-5 w-5 shrink-0 text-slate-300 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-500"
          aria-hidden
        />
      </button>
    </li>
  );
}
