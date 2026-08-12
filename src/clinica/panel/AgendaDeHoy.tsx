/**
 * Las citas de hoy, en orden de reloj.
 *
 * El odontólogo ve solo las suyas y el resto del personal las de toda la
 * clínica; lo decide `profesionalVisible`, no esta pantalla. La franja de color
 * a la izquierda es la del profesional, que es como la clínica distingue de un
 * vistazo dos agendas en el mismo día.
 */

import { useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { useUsuario } from '@compartido/auth';
import { useConsulta } from '@compartido/contexto';
import {
  ETIQUETA_ESTADO_CITA,
  ETIQUETA_TIPO_CITA,
  formatoHora,
  nombreCompleto,
} from '@compartido/formato';
import { profesionalVisible } from '@compartido/permisos';
import * as api from '@compartido/mockApi';
import type { EstadoCita } from '@compartido/tipos';
import Boton from '@componentes/ui/Boton';
import Esqueleto from '@componentes/ui/Esqueleto';
import EstadoVacio from '@componentes/ui/EstadoVacio';
import Insignia, { type TonoInsignia } from '@componentes/ui/Insignia';
import Tarjeta from '@componentes/ui/Tarjeta';

const TONO_ESTADO: Record<EstadoCita, TonoInsignia> = {
  confirmada: 'petroleo',
  asistio: 'verde',
  no_asistio: 'rojo',
  cancelada: 'neutro',
};

export default function AgendaDeHoy() {
  const usuario = useUsuario();
  const soloMio = profesionalVisible(usuario);

  const consulta = useConsulta(async () => {
    const [citas, pacientes, profesionales] = await Promise.all([
      api.obtenerAgendaDelDia(new Date(), soloMio),
      api.buscarPacientes(''),
      api.obtenerProfesionales(),
    ]);
    return { citas, pacientes, profesionales };
  }, [soloMio]);

  const filas = useMemo(() => {
    if (!consulta.datos) return [];
    const { citas, pacientes, profesionales } = consulta.datos;
    return citas.map((cita) => ({
      cita,
      paciente: pacientes.find((p) => p.id === cita.pacienteId),
      profesional: profesionales.find((p) => p.id === cita.profesionalId),
    }));
  }, [consulta.datos]);

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <p className="rotulo">Hoy</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            {soloMio ? 'Mi agenda' : 'Agenda del día'}
          </h2>
        </div>
        <Boton variante="fantasma" a="/clinica/agenda" className="shrink-0">
          Ver semana
        </Boton>
      </div>

      <Tarjeta className="overflow-hidden">
        {consulta.cargando ? (
          <div className="space-y-4 p-6">
            {[0, 1, 2].map((indice) => (
              <Esqueleto key={indice} className="h-12 w-full" />
            ))}
          </div>
        ) : filas.length === 0 ? (
          <EstadoVacio
            icono={<CalendarDays className="h-6 w-6" aria-hidden />}
            titulo="No hay citas para hoy"
            descripcion={
              soloMio
                ? 'No tienes pacientes agendados hoy.'
                : 'Ningún paciente tiene cita hoy en la clínica.'
            }
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {filas.map(({ cita, paciente, profesional }) => (
              <li key={cita.id} className="flex items-center gap-4 px-5 py-4">
                {/* La hora manda: va primero, tabular y en negrita. */}
                <span className="w-20 shrink-0 text-sm font-semibold tabular-nums text-slate-900">
                  {formatoHora(cita.fechaHora)}
                </span>

                <span
                  className="h-10 w-1 shrink-0 rounded-full"
                  style={{ backgroundColor: profesional?.color ?? '#cbd5e1' }}
                  aria-hidden
                />

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium text-slate-900">
                    {paciente ? nombreCompleto(paciente) : 'Paciente'}
                  </span>
                  <span className="block truncate text-sm text-slate-500">
                    {ETIQUETA_TIPO_CITA[cita.tipo]}
                    {profesional && !soloMio && ` · ${profesional.nombre}`}
                  </span>
                </span>

                <span className="shrink-0">
                  <Insignia tono={TONO_ESTADO[cita.estado]}>
                    {cita.estado === 'confirmada' && cita.confirmadaPorPaciente
                      ? 'Confirmó'
                      : ETIQUETA_ESTADO_CITA[cita.estado]}
                  </Insignia>
                </span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </section>
  );
}
