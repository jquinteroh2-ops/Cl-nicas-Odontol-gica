/**
 * Solicitud abierta, en sus dos formas.
 *
 * Esta tarjeta es el punto donde se ve la sincronización: mientras la paciente
 * tiene el portal en pantalla, la secretaria resuelve desde el panel y la tarjeta
 * cambia sola, sin recargar. Por eso el caso 'contrapropuesta' se trata como una
 * decisión de verdad —dos horarios grandes y pulsables— y no como un aviso.
 *
 * La confirmación de cancelar es en dos pasos dentro de la tarjeta y no un
 * confirm() del navegador: en un celular ese diálogo se ve prestado y feo.
 */

import { useState } from 'react';
import { CalendarClock, Check, Clock, X } from 'lucide-react';
import type { SolicitudCita } from '@compartido/tipos';
import { useAccion } from '@compartido/contexto';
import {
  ETIQUETA_TIPO_CITA,
  formatoDiaRelativo,
  formatoFechaConDia,
  formatoFechaHoraLarga,
  formatoHora,
} from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';
import Insignia from '@componentes/ui/Insignia';

interface Props {
  solicitud: SolicitudCita;
}

export default function TarjetaSolicitudEnCurso({ solicitud }: Props) {
  const [confirmandoCancelar, setConfirmandoCancelar] = useState(false);
  const cancelar = useAccion(api.cancelarSolicitud);
  const aceptar = useAccion(api.aceptarHorarioPropuesto);
  const rechazar = useAccion(api.rechazarHorariosPropuestos);

  const error = cancelar.error ?? aceptar.error ?? rechazar.error;
  const ocupado = cancelar.enCurso || aceptar.enCurso || rechazar.enCurso;
  const esContrapropuesta = solicitud.estado === 'contrapropuesta';

  /*
    No usa <Tarjeta> porque el anillo cambia de color según el estado, y la
    tarjeta base fija el suyo. Sí adopta su lenguaje: esquina amplia, borde
    apenas insinuado y elevación media, que es lo que la pone por delante del
    resto de la portada cuando hay algo que decidir.
  */
  return (
    <section
      className={`animar-entrada rounded-3xl bg-white p-6 shadow-media ring-1 ${
        esContrapropuesta ? 'ring-petroleo-200/70' : 'ring-amber-300/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="rotulo">{ETIQUETA_TIPO_CITA[solicitud.tipo]}</p>
          <h2 className="mt-1.5 text-xl font-semibold leading-snug tracking-tight text-balance text-slate-900">
            {esContrapropuesta ? 'Te proponemos otro horario' : 'Tu solicitud está en revisión'}
          </h2>
        </div>
        <Insignia
          tono={esContrapropuesta ? 'petroleo' : 'ambar'}
          icono={
            esContrapropuesta ? (
              <CalendarClock className="h-3.5 w-3.5" aria-hidden />
            ) : (
              <Clock className="h-3.5 w-3.5" aria-hidden />
            )
          }
        >
          {esContrapropuesta ? 'Elige uno' : 'En revisión'}
        </Insignia>
      </div>

      {esContrapropuesta ? (
        <>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            A la hora que pediste ({formatoFechaConDia(solicitud.fechaHoraSolicitada).toLowerCase()},{' '}
            {formatoHora(solicitud.fechaHoraSolicitada)}) no podemos atenderte. Estas dos sí las
            tenemos libres:
          </p>

          <ul className="mt-5 space-y-3">
            {(solicitud.horariosPropuestos ?? []).map((horario) => (
              <li key={horario}>
                <button
                  type="button"
                  disabled={ocupado}
                  onClick={() => void aceptar.ejecutar(solicitud.id, horario)}
                  className="flex w-full items-center gap-3.5 rounded-2xl px-4 py-4 text-left shadow-suave ring-1 ring-slate-200/70 transition-all hover:bg-petroleo-50 hover:shadow-media hover:ring-petroleo-200 active:scale-[0.99] active:bg-petroleo-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-petroleo-50 text-petroleo-600 ring-1 ring-inset ring-petroleo-600/10">
                    <Check className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base font-semibold leading-tight text-slate-900">
                      {formatoFechaConDia(horario)}
                    </span>
                    <span className="mt-0.5 block text-sm text-slate-500">
                      {formatoHora(horario)} · {formatoDiaRelativo(horario)}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          <p className="mt-5 text-center">
            <button
              type="button"
              disabled={ocupado}
              onClick={() => void rechazar.ejecutar(solicitud.id)}
              className="text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-800 disabled:opacity-50"
            >
              Ninguno de los dos me sirve
            </button>
          </p>
        </>
      ) : (
        <>
          <div className="mt-5 rounded-2xl bg-amber-50/70 px-5 py-4 ring-1 ring-inset ring-amber-600/15">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-amber-800/80">
              Horario que pediste
            </p>
            <p className="mt-2 text-lg font-semibold leading-snug text-balance text-slate-900">
              {formatoFechaConDia(solicitud.fechaHoraSolicitada)}, {formatoHora(solicitud.fechaHoraSolicitada)}
            </p>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            Te apartamos ese cupo mientras revisamos. Si no podemos a esa hora, te proponemos dos
            alternativas aquí mismo y te escribimos por WhatsApp.
          </p>

          {solicitud.expiraEn && (
            <p className="mt-2.5 text-xs text-slate-400">
              Reservado hasta el {formatoFechaHoraLarga(solicitud.expiraEn).toLowerCase()}.
            </p>
          )}

          {confirmandoCancelar ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4 ring-1 ring-inset ring-slate-200/70">
              <p className="text-sm text-slate-700">¿Retiramos tu solicitud?</p>
              <div className="mt-3 grid grid-cols-2 gap-2.5">
                <Boton
                  variante="secundario"
                  anchoCompleto
                  alPulsar={() => setConfirmandoCancelar(false)}
                >
                  No, dejarla
                </Boton>
                <Boton
                  variante="secundario"
                  anchoCompleto
                  cargando={cancelar.enCurso}
                  className="text-red-700 ring-red-200 hover:bg-red-50"
                  icono={<X className="h-4 w-4" aria-hidden />}
                  alPulsar={() => void cancelar.ejecutar(solicitud.id)}
                >
                  Sí, cancelar
                </Boton>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setConfirmandoCancelar(true)}
                className="text-sm font-medium text-slate-500 underline underline-offset-4 hover:text-slate-800"
              >
                Cancelar mi solicitud
              </button>
            </p>
          )}
        </>
      )}

      {error && (
        <p className="mt-5 rounded-2xl bg-red-50/80 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-600/15">
          {error}
        </p>
      )}
    </section>
  );
}
