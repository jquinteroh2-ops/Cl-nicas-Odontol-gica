/**
 * Ficha de una cita desde la agenda.
 *
 * Registrar la asistencia solo aparece cuando tiene sentido: la cita ya empezó
 * y sigue en pie. Ofrecer "asistió" para una cita de la semana que viene invita
 * a ensuciar los datos, y en este demo los datos sucios se ven enseguida en los
 * indicadores del panel.
 */

import type { ReactNode } from 'react';
import { CalendarDays, Clock, Stethoscope, User } from 'lucide-react';
import { useUsuario } from '@compartido/auth';
import { useAccion } from '@compartido/contexto';
import {
  ETIQUETA_ESTADO_CITA,
  ETIQUETA_TIPO_CITA,
  aFecha,
  formatoDuracion,
  formatoFechaHoraLarga,
  formatoTelefono,
  nombreCompleto,
} from '@compartido/formato';
import { puede } from '@compartido/permisos';
import * as api from '@compartido/mockApi';
import type { EstadoCita } from '@compartido/tipos';
import Boton from '@componentes/ui/Boton';
import Hoja from '@componentes/ui/Hoja';
import Insignia, { type TonoInsignia } from '@componentes/ui/Insignia';
import type { CitaConContexto } from './tipos';

const TONO_ESTADO: Record<EstadoCita, TonoInsignia> = {
  confirmada: 'petroleo',
  asistio: 'verde',
  no_asistio: 'rojo',
  cancelada: 'neutro',
};

interface Props {
  entrada: CitaConContexto;
  alCerrar: () => void;
}

export default function DetalleCita({ entrada, alCerrar }: Props) {
  const { cita, paciente, profesional } = entrada;
  const usuario = useUsuario();
  const marcar = useAccion(api.marcarAsistencia);

  const yaEmpezo = aFecha(cita.fechaHora).getTime() <= Date.now();
  const puedeRegistrar =
    puede(usuario, 'registrar_asistencia') && cita.estado === 'confirmada' && yaEmpezo;

  return (
    <Hoja
      titulo={paciente ? nombreCompleto(paciente) : 'Cita'}
      descripcion={ETIQUETA_TIPO_CITA[cita.tipo]}
      alCerrar={alCerrar}
      pie={
        puedeRegistrar ? (
          <div className="flex gap-2.5">
            <Boton
              variante="secundario"
              anchoCompleto
              deshabilitado={marcar.enCurso}
              alPulsar={async () => {
                await marcar.ejecutar(cita.id, false);
                alCerrar();
              }}
            >
              No asistió
            </Boton>
            <Boton
              anchoCompleto
              cargando={marcar.enCurso}
              alPulsar={async () => {
                await marcar.ejecutar(cita.id, true);
                alCerrar();
              }}
            >
              Asistió
            </Boton>
          </div>
        ) : undefined
      }
    >
      {marcar.error && (
        <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-600/15">
          {marcar.error}
        </p>
      )}

      <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200/70">
        <div className="flex flex-wrap items-center gap-2">
          <Insignia tono={TONO_ESTADO[cita.estado]}>{ETIQUETA_ESTADO_CITA[cita.estado]}</Insignia>
          {cita.confirmadaPorPaciente && cita.estado === 'confirmada' && (
            <Insignia tono="verde">El paciente confirmó</Insignia>
          )}
        </div>

        <p className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
          {formatoFechaHoraLarga(cita.fechaHora)}
        </p>

        <dl className="mt-5 space-y-2.5 border-t border-slate-200/70 pt-4 text-sm">
          <Fila icono={<Clock className="h-4 w-4" aria-hidden />} etiqueta="Duración">
            {formatoDuracion(cita.duracionMinutos)}
          </Fila>
          {profesional && (
            <Fila icono={<Stethoscope className="h-4 w-4" aria-hidden />} etiqueta="Profesional">
              {profesional.nombre}
            </Fila>
          )}
          {paciente && (
            <Fila icono={<User className="h-4 w-4" aria-hidden />} etiqueta="Teléfono">
              {formatoTelefono(paciente.telefono)}
            </Fila>
          )}
          <Fila icono={<CalendarDays className="h-4 w-4" aria-hidden />} etiqueta="Tipo">
            {ETIQUETA_TIPO_CITA[cita.tipo]}
          </Fila>
        </dl>
      </div>

      {/* Las notas clínicas nunca viajan al portal del paciente. */}
      {cita.notasClinicas && puede(usuario, 'notas_clinicas') && (
        <div className="mt-5 rounded-3xl bg-white p-5 ring-1 ring-slate-200/70">
          <p className="rotulo">Notas clínicas</p>
          <p className="mt-2 text-sm leading-relaxed text-slate-700">{cita.notasClinicas}</p>
        </div>
      )}
    </Hoja>
  );
}

function Fila({
  icono,
  etiqueta,
  children,
}: {
  icono: ReactNode;
  etiqueta: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="flex shrink-0 items-center gap-1.5 text-slate-500">
        {icono}
        {etiqueta}
      </dt>
      <dd className="min-w-0 truncate text-right font-medium text-slate-800">{children}</dd>
    </div>
  );
}
