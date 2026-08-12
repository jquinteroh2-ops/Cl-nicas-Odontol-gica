/**
 * Resolución de una solicitud: aprobar, proponer otro horario o rechazar.
 *
 * El orden de las acciones es deliberado. Aprobar es el botón principal;
 * proponer otro horario va justo debajo, con el mismo peso visual, porque un
 * paciente al que solo se le dice que no es un paciente perdido; rechazar queda
 * como enlace discreto y exige motivo escrito.
 *
 * Termina siempre mostrando el WhatsApp que le llega al paciente, que es lo que
 * cierra el círculo delante de la clínica.
 */

import { useState, type ReactNode } from 'react';
import { CalendarClock, CalendarCheck, MessageSquareText, User, UserPlus } from 'lucide-react';
import type { Notificacion, Paciente, SolicitudCita } from '@compartido/tipos';
import { useAccion, useConsulta } from '@compartido/contexto';
import {
  ETIQUETA_TIPO_CITA,
  formatoDocumentoCompleto,
  formatoDuracion,
  formatoFechaHoraLarga,
  formatoTelefono,
} from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';
import Hoja from '@componentes/ui/Hoja';
import Insignia from '@componentes/ui/Insignia';
import SelectorHorarios from './SelectorHorarios';
import VistaPreviaWhatsApp from './VistaPreviaWhatsApp';
import { esPacienteNuevo, nombreDeSolicitud, telefonoDeSolicitud } from './solicitud';

type Paso = 'acciones' | 'contrapropuesta' | 'rechazo' | 'resuelto';

interface Props {
  solicitud: SolicitudCita;
  alCerrar: () => void;
}

export default function ResolverSolicitud({ solicitud, alCerrar }: Props) {
  const [paso, setPaso] = useState<Paso>('acciones');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [motivo, setMotivo] = useState('');
  const [notificacion, setNotificacion] = useState<Notificacion | null>(null);
  const [pacienteFinal, setPacienteFinal] = useState<Paciente | null>(null);

  const consultaPaciente = useConsulta(
    async () => (solicitud.pacienteId ? api.obtenerPaciente(solicitud.pacienteId) : null),
    [solicitud.pacienteId],
  );
  const paciente = consultaPaciente.datos;

  const aprobar = useAccion(api.aprobarSolicitud);
  const contraproponer = useAccion(api.contraproponerHorarios);
  const rechazar = useAccion(api.rechazarSolicitud);
  const error = aprobar.error ?? contraproponer.error ?? rechazar.error;
  const enCurso = aprobar.enCurso || contraproponer.enCurso || rechazar.enCurso;

  const nombre = nombreDeSolicitud(solicitud, paciente);
  const esNuevo = esPacienteNuevo(solicitud);
  const telefono = telefonoDeSolicitud(solicitud, paciente);

  /** Deja la hoja en el estado final y guarda a quién se le escribió. */
  async function cerrarConResultado(resultado: { solicitud: SolicitudCita; notificacion?: Notificacion } | null) {
    if (!resultado) return;
    setNotificacion(resultado.notificacion ?? null);
    // Un paciente nuevo se crea al aprobar: hasta ahora no teníamos su ficha.
    if (resultado.solicitud.pacienteId && !paciente) {
      setPacienteFinal(await api.obtenerPaciente(resultado.solicitud.pacienteId));
    }
    setPaso('resuelto');
  }

  const tituloPorPaso: Record<Paso, string> = {
    acciones: 'Resolver solicitud',
    contrapropuesta: 'Proponer otro horario',
    rechazo: 'No aprobar la solicitud',
    resuelto: 'Listo',
  };

  return (
    <Hoja
      titulo={tituloPorPaso[paso]}
      descripcion={paso === 'resuelto' ? undefined : nombre}
      alCerrar={alCerrar}
      pie={pieDeHoja()}
    >
      {error && (
        <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-600/15">
          {error}
        </p>
      )}

      {paso === 'acciones' && (
        <div className="space-y-5">
          <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200/70">
            <div className="flex flex-wrap items-center gap-2">
              <Insignia tono="petroleo">{ETIQUETA_TIPO_CITA[solicitud.tipo]}</Insignia>
              {esNuevo && (
                <Insignia tono="ambar" icono={<UserPlus className="h-3.5 w-3.5" aria-hidden />}>
                  Paciente nuevo
                </Insignia>
              )}
            </div>

            <p className="mt-4 text-lg font-semibold tracking-tight text-slate-900">
              {formatoFechaHoraLarga(solicitud.fechaHoraSolicitada)}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Duración prevista: {formatoDuracion(solicitud.duracionMinutos)}
            </p>

            <dl className="mt-5 space-y-2.5 border-t border-slate-200/70 pt-4 text-sm">
              <Dato icono={<User className="h-4 w-4" aria-hidden />} etiqueta="Paciente">
                {nombre}
              </Dato>
              {solicitud.datosContacto && (
                <Dato etiqueta="Documento">
                  {formatoDocumentoCompleto(
                    solicitud.datosContacto.tipoDocumento,
                    solicitud.datosContacto.numeroDocumento,
                  )}
                </Dato>
              )}
              {telefono && <Dato etiqueta="Teléfono">{formatoTelefono(telefono)}</Dato>}
            </dl>

            {solicitud.motivoConsulta && (
              <div className="mt-4 border-t border-slate-200/70 pt-4">
                <p className="rotulo">Motivo de consulta</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                  {solicitud.motivoConsulta}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            <Boton
              anchoCompleto
              tamano="lg"
              cargando={aprobar.enCurso}
              deshabilitado={enCurso}
              icono={<CalendarCheck className="h-5 w-5" aria-hidden />}
              alPulsar={async () => cerrarConResultado(await aprobar.ejecutar(solicitud.id))}
            >
              Aprobar a la hora pedida
            </Boton>

            <Boton
              anchoCompleto
              tamano="lg"
              variante="secundario"
              deshabilitado={enCurso}
              icono={<CalendarClock className="h-5 w-5" aria-hidden />}
              alPulsar={() => setPaso('contrapropuesta')}
            >
              Proponer otro horario
            </Boton>
          </div>

          <div className="text-center">
            <button
              type="button"
              disabled={enCurso}
              onClick={() => setPaso('rechazo')}
              className="rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-red-700 disabled:opacity-50"
            >
              No podemos atender esta solicitud
            </button>
          </div>
        </div>
      )}

      {paso === 'contrapropuesta' && (
        <div>
          <p className="mb-5 text-sm leading-relaxed text-slate-600">
            El paciente pidió{' '}
            <span className="font-medium text-slate-900">
              {formatoFechaHoraLarga(solicitud.fechaHoraSolicitada).toLowerCase()}
            </span>
            . Escoge dos alternativas y él elige una desde su portal o respondiendo el WhatsApp.
          </p>
          <SelectorHorarios
            tipo={solicitud.tipo}
            pacienteId={solicitud.pacienteId}
            seleccion={horarios}
            alCambiar={setHorarios}
          />
        </div>
      )}

      {paso === 'rechazo' && (
        <div>
          <p className="mb-5 text-sm leading-relaxed text-slate-600">
            El motivo se le envía al paciente tal como lo escribas, dentro de un mensaje cordial.
            Sé concreto: “esa semana la doctora está en congreso” explica mucho más que “no hay
            disponibilidad”.
          </p>
          <label htmlFor="motivo-rechazo" className="block text-sm font-medium text-slate-700">
            Motivo
            <span className="ml-1 text-red-600" aria-hidden>
              *
            </span>
          </label>
          <textarea
            id="motivo-rechazo"
            rows={4}
            value={motivo}
            onChange={(evento) => setMotivo(evento.target.value)}
            maxLength={160}
            placeholder="Esa semana no tenemos agenda de ortodoncia"
            className="mt-2 block w-full resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-petroleo-600"
          />
          <p className="mt-2 text-right text-xs tabular-nums text-slate-400">{motivo.length}/160</p>
        </div>
      )}

      {paso === 'resuelto' && (
        <div>
          {notificacion ? (
            <VistaPreviaWhatsApp
              notificacion={notificacion}
              paciente={pacienteFinal ?? paciente ?? undefined}
            />
          ) : (
            <div className="rounded-3xl bg-slate-50 p-6 text-center ring-1 ring-slate-200/70">
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-3xl bg-white text-slate-400 shadow-suave">
                <MessageSquareText className="h-5 w-5" aria-hidden />
              </span>
              <p className="mt-4 font-medium text-slate-800">Solicitud resuelta</p>
              <p className="mt-1.5 text-sm text-slate-500">
                No se generó mensaje porque la solicitud no tenía una ficha de paciente asociada.
              </p>
            </div>
          )}
        </div>
      )}
    </Hoja>
  );

  function pieDeHoja() {
    if (paso === 'contrapropuesta') {
      return (
        <div className="flex gap-2.5">
          <Boton variante="secundario" alPulsar={() => setPaso('acciones')} deshabilitado={enCurso}>
            Atrás
          </Boton>
          <Boton
            anchoCompleto
            cargando={contraproponer.enCurso}
            deshabilitado={horarios.length !== 2 || enCurso}
            alPulsar={async () => {
              const ordenados = [...horarios].sort();
              cerrarConResultado(
                await contraproponer.ejecutar(solicitud.id, [ordenados[0], ordenados[1]]),
              );
            }}
          >
            {horarios.length === 2 ? 'Enviar las dos opciones' : `Faltan ${2 - horarios.length}`}
          </Boton>
        </div>
      );
    }

    if (paso === 'rechazo') {
      return (
        <div className="flex gap-2.5">
          <Boton variante="secundario" alPulsar={() => setPaso('acciones')} deshabilitado={enCurso}>
            Atrás
          </Boton>
          <Boton
            anchoCompleto
            cargando={rechazar.enCurso}
            deshabilitado={motivo.trim().length < 5 || enCurso}
            alPulsar={async () =>
              cerrarConResultado(await rechazar.ejecutar(solicitud.id, motivo.trim()))
            }
          >
            Enviar respuesta
          </Boton>
        </div>
      );
    }

    if (paso === 'resuelto') {
      return (
        <Boton anchoCompleto tamano="lg" alPulsar={alCerrar}>
          Volver a la bandeja
        </Boton>
      );
    }

    return null;
  }
}

/** Fila etiqueta/valor de la ficha resumida. */
function Dato({
  icono,
  etiqueta,
  children,
}: {
  icono?: ReactNode;
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
