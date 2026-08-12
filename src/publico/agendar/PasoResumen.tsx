/**
 * Paso 4 · Confirmación.
 *
 * Resumen de lo pedido y, sobre todo, qué pasa después. El texto cambia según el
 * camino: no es lo mismo "quedó confirmada" que "te respondemos por WhatsApp".
 */

import { CalendarCheck, Check, Clock, MapPin, MessageCircle, UserRound } from 'lucide-react';
import type { TipoCita } from '@compartido/tipos';
import { CLINICA, DIRECCION_COMPLETA } from '@compartido/clinica';
import {
  ETIQUETA_TIPO_CITA,
  formatoDocumentoCompleto,
  formatoDuracion,
  formatoFechaConDia,
  formatoHora,
  formatoTelefono,
} from '@compartido/formato';
import { DURACION_POR_TIPO } from '@compartido/disponibilidad';
import Insignia from '@componentes/ui/Insignia';

interface Props {
  tipo: TipoCita;
  fechaHora: string;
  motivoConsulta: string;
  requiereAprobacion: boolean;
  /** Nombre de quien queda como paciente de la cita. */
  nombrePaciente: string;
  documento: string;
  telefonoAviso: string;
  /** Verdadero cuando el aviso va al acudiente y no al paciente. */
  avisaAlAcudiente: boolean;
  nombreAcudiente?: string;
}

export default function PasoResumen({
  tipo,
  fechaHora,
  motivoConsulta,
  requiereAprobacion,
  nombrePaciente,
  documento,
  telefonoAviso,
  avisaAlAcudiente,
  nombreAcudiente,
}: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        Revisa antes de enviar
      </h1>
      <p className="mt-2.5 leading-relaxed text-slate-600">
        Verifica que todo esté bien y confirma.
      </p>

      <div className="mt-8 overflow-hidden rounded-3xl bg-white shadow-suave ring-1 ring-slate-200/70">
        {/* Cabecera en gris: la fecha y la hora son lo único que hay que leer sí o sí. */}
        <div className="bg-slate-50 px-6 py-5">
          {/*
            En celular la insignia baja bajo la fecha: al lado le robaba la mitad
            del ancho y la fecha se partía en tres líneas.
          */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="rotulo">{ETIQUETA_TIPO_CITA[tipo]}</p>
              <p className="mt-2 text-xl font-semibold leading-snug tracking-tight text-slate-900">
                {formatoFechaConDia(fechaHora)}
              </p>
              <p className="mt-0.5 text-2xl font-semibold tracking-tight text-petroleo-700">
                {formatoHora(fechaHora)}
              </p>
            </div>
            <Insignia
              tono={requiereAprobacion ? 'ambar' : 'verde'}
              className="shrink-0 self-start"
            >
              {requiereAprobacion ? 'Sujeto a aprobación' : 'Confirmación inmediata'}
            </Insignia>
          </div>
        </div>

        <dl className="divide-y divide-slate-100 px-6">
          <Fila icono={<Clock className="h-4 w-4" aria-hidden />} etiqueta="Duración">
            {formatoDuracion(DURACION_POR_TIPO[tipo])}
          </Fila>
          <Fila icono={<UserRound className="h-4 w-4" aria-hidden />} etiqueta="Paciente">
            {nombrePaciente}
            <span className="block text-sm font-normal text-slate-500">{documento}</span>
          </Fila>
          <Fila icono={<MessageCircle className="h-4 w-4" aria-hidden />} etiqueta="Te avisamos a">
            {formatoTelefono(telefonoAviso)}
            {avisaAlAcudiente && nombreAcudiente && (
              <span className="block text-sm font-normal text-slate-500">
                {nombreAcudiente} · acudiente
              </span>
            )}
          </Fila>
          <Fila icono={<MapPin className="h-4 w-4" aria-hidden />} etiqueta="Dónde">
            {CLINICA.direccion}
            <span className="block text-sm font-normal text-slate-500">{CLINICA.referencia}</span>
          </Fila>
          {motivoConsulta.trim() && (
            <div className="py-4">
              <dt className="text-sm text-slate-500">Lo que nos contaste</dt>
              <dd className="mt-1.5 leading-relaxed text-slate-800">{motivoConsulta.trim()}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Qué pasa después: es la parte que evita llamadas a la clínica. */}
      <div
        className={`mt-6 rounded-3xl p-5 sm:p-6 ${
          requiereAprobacion
            ? 'bg-amber-50/80 ring-1 ring-amber-600/15'
            : 'bg-emerald-50/80 ring-1 ring-emerald-600/15'
        }`}
      >
        <p
          className={`flex items-center gap-2 font-semibold tracking-tight ${
            requiereAprobacion ? 'text-amber-900' : 'text-emerald-900'
          }`}
        >
          {requiereAprobacion ? (
            <Clock className="h-4 w-4" aria-hidden />
          ) : (
            <CalendarCheck className="h-4 w-4" aria-hidden />
          )}
          ¿Qué pasa cuando envíes?
        </p>

        {requiereAprobacion ? (
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-amber-900">
            <Punto>Guardamos ese horario para ti mientras lo revisamos.</Punto>
            <Punto>
              Te respondemos por WhatsApp, normalmente el mismo día y siempre antes de 24 horas.
            </Punto>
            <Punto>
              Si a esa hora no podemos, te proponemos dos horarios alternativos para que elijas.
            </Punto>
          </ul>
        ) : (
          <ul className="mt-4 space-y-2.5 text-sm leading-relaxed text-emerald-900">
            <Punto>Tu cita queda confirmada de una vez, sin esperar respuesta.</Punto>
            <Punto>Te llega la confirmación por WhatsApp.</Punto>
            <Punto>Podrás verla y confirmar tu asistencia desde tu portal.</Punto>
          </ul>
        )}
      </div>
    </div>
  );
}

function Fila({
  icono,
  etiqueta,
  children,
}: {
  icono: React.ReactNode;
  etiqueta: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-4">
      <dt className="flex shrink-0 items-center gap-2 text-sm text-slate-500">
        <span className="text-slate-400">{icono}</span>
        {etiqueta}
      </dt>
      <dd className="min-w-0 text-right font-medium text-slate-900">{children}</dd>
    </div>
  );
}

function Punto({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2">
      <Check className="mt-0.5 h-4 w-4 shrink-0 opacity-60" aria-hidden />
      <span>{children}</span>
    </li>
  );
}
