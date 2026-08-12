/**
 * Pantalla de éxito, en dos variantes.
 *
 * Camino A: celebra la confirmación, con fecha y hora en grande y la opción de
 * agregar al calendario. Camino B: deja claro que la solicitud quedó enviada,
 * cuándo van a responder y que puede llegar una propuesta de otro horario. La
 * diferencia entre las dos no es cosmética: es lo que el paciente debe esperar.
 */

import { CalendarPlus, CheckCircle2, Clock, MessageCircle, Send } from 'lucide-react';
import type { Cita, SolicitudCita } from '@compartido/tipos';
import { CLINICA, enlaceWhatsApp } from '@compartido/clinica';
import { descargarIcs } from '@compartido/calendario';
import {
  ETIQUETA_TIPO_CITA,
  formatoFechaConDia,
  formatoHora,
  formatoTelefono,
} from '@compartido/formato';
import Boton from '@componentes/ui/Boton';

interface Props {
  solicitud: SolicitudCita;
  cita?: Cita;
  nombreProfesional?: string;
  /** Número al que se enviará la confirmación. */
  telefonoAviso: string;
  /** Hay sesión de paciente abierta: se le puede llevar a su portal. */
  conSesion: boolean;
}

export default function PantallaExito({
  solicitud,
  cita,
  nombreProfesional,
  telefonoAviso,
  conSesion,
}: Props) {
  const confirmada = Boolean(cita);
  const fechaHora = cita?.fechaHora ?? solicitud.fechaHoraSolicitada;

  return (
    <div className="animar-entrada mx-auto max-w-lg px-6 py-16 pb-seguro text-center sm:py-24">
      <span
        className={`mx-auto grid h-20 w-20 place-items-center rounded-3xl shadow-suave ${
          confirmada ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
        }`}
      >
        {confirmada ? (
          <CheckCircle2 className="h-9 w-9" aria-hidden strokeWidth={1.5} />
        ) : (
          <Send className="h-8 w-8" aria-hidden strokeWidth={1.5} />
        )}
      </span>

      <h1 className="mt-8 text-3xl font-semibold tracking-tight text-balance text-slate-900 sm:text-4xl">
        {confirmada ? '¡Tu cita quedó confirmada!' : 'Tu solicitud fue enviada'}
      </h1>

      {confirmada ? (
        <>
          <p className="mt-3 text-lg text-slate-600">Te esperamos en {CLINICA.nombre}.</p>

          <div className="mt-10 rounded-3xl bg-emerald-50/80 px-6 py-8 shadow-suave ring-1 ring-emerald-600/15">
            {/* Mismo rótulo que `.rotulo`, escrito a mano solo para teñirlo de verde. */}
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">
              {ETIQUETA_TIPO_CITA[solicitud.tipo]}
            </p>
            <p className="mt-3 text-2xl font-semibold leading-tight text-balance tracking-tight text-slate-900 sm:text-3xl">
              {formatoFechaConDia(fechaHora)}
            </p>
            <p className="mt-1.5 text-3xl font-semibold tracking-tight text-emerald-700 sm:text-4xl">
              {formatoHora(fechaHora)}
            </p>
            {nombreProfesional && (
              <p className="mt-4 text-sm text-emerald-800">Con {nombreProfesional}</p>
            )}
          </div>

          <div className="mt-8 flex flex-col gap-3">
            <Boton
              tamano="lg"
              anchoCompleto
              icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
              alPulsar={() =>
                descargarIcs({
                  titulo: `${ETIQUETA_TIPO_CITA[solicitud.tipo]} · ${CLINICA.nombre}`,
                  inicio: new Date(fechaHora),
                  duracionMinutos: solicitud.duracionMinutos,
                  descripcion: nombreProfesional ? `Con ${nombreProfesional}` : undefined,
                })
              }
            >
              Agregar al calendario
            </Boton>
            {conSesion ? (
              <Boton a="/portal" variante="secundario" tamano="lg" anchoCompleto>
                Ver en mi portal
              </Boton>
            ) : (
              <Boton a="/" variante="secundario" tamano="lg" anchoCompleto>
                Volver al inicio
              </Boton>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-lg leading-relaxed text-slate-600">
            Te responderemos por WhatsApp, normalmente el mismo día.
          </p>

          <div className="mt-10 rounded-3xl bg-amber-50/80 px-6 py-8 text-left shadow-suave ring-1 ring-amber-600/15">
            <p className="flex items-center gap-2 text-sm font-medium text-amber-900">
              <Clock className="h-4 w-4 shrink-0" aria-hidden />
              Horario que pediste · pendiente de confirmar
            </p>
            <p className="mt-3 text-2xl font-semibold leading-snug tracking-tight text-slate-900">
              {formatoFechaConDia(fechaHora)}, {formatoHora(fechaHora)}
            </p>
            <p className="mt-4 text-sm leading-relaxed text-amber-900">
              Guardamos ese cupo mientras revisamos. Si a esa hora no podemos atenderte, te
              proponemos dos horarios alternativos para que elijas el que te sirva.
            </p>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-500">
            <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
            Te escribimos al {formatoTelefono(telefonoAviso)}
          </p>

          <div className="mt-8 flex flex-col gap-3">
            {conSesion ? (
              <Boton a="/portal" tamano="lg" anchoCompleto>
                Ver el estado en mi portal
              </Boton>
            ) : (
              <Boton a="/" tamano="lg" anchoCompleto>
                Volver al inicio
              </Boton>
            )}
            <Boton
              enlaceExterno={enlaceWhatsApp(
                `Hola, acabo de solicitar una cita de ${ETIQUETA_TIPO_CITA[
                  solicitud.tipo
                ].toLowerCase()} desde la página.`,
              )}
              variante="secundario"
              tamano="lg"
              anchoCompleto
              icono={<MessageCircle className="h-5 w-5" aria-hidden />}
            >
              Escribirles por WhatsApp
            </Boton>
          </div>
        </>
      )}
    </div>
  );
}
