/**
 * La pieza principal del portal: la próxima cita.
 *
 * Es lo primero que una paciente busca cuando entra, así que la fecha y la hora
 * van en grande y todo lo demás queda subordinado. "Confirmar asistencia" no
 * cambia el estado de la cita —eso solo lo hace la clínica el día que pasa—,
 * sino que le avisa a la clínica que la paciente cuenta con venir.
 */

import { CalendarPlus, CheckCircle2, Clock, MessageCircle, Stethoscope } from 'lucide-react';
import type { Cita } from '@compartido/tipos';
import { CLINICA, enlaceWhatsApp } from '@compartido/clinica';
import { descargarIcs } from '@compartido/calendario';
import { useAccion } from '@compartido/contexto';
import {
  ETIQUETA_TIPO_CITA,
  formatoDiaRelativo,
  formatoDuracion,
  formatoFechaConDia,
  formatoHora,
} from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';
import Insignia from '@componentes/ui/Insignia';
import Tarjeta from '@componentes/ui/Tarjeta';

interface Props {
  cita: Cita;
  nombreProfesional?: string;
}

export default function TarjetaProximaCita({ cita, nombreProfesional }: Props) {
  const confirmar = useAccion(api.confirmarAsistencia);
  const yaConfirmo = Boolean(cita.confirmadaPorPaciente);

  return (
    <Tarjeta destacada as="section" className="animar-entrada overflow-hidden">
      {/*
        La fecha y la hora ocupan el ancho completo y el "hoy / mañana" sube a la
        línea del rótulo: en un celular estrecho, la hora en grande y la pastilla
        peleando por la misma fila era lo único que se desbordaba.
      */}
      <div className="bg-petroleo-600 px-6 py-7 text-white">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/60">
            Tu próxima cita
          </p>
          <span className="shrink-0 rounded-full bg-white/15 px-3 py-1 text-xs font-medium ring-1 ring-inset ring-white/15">
            {formatoDiaRelativo(cita.fechaHora)}
          </span>
        </div>
        <p className="mt-4 text-lg font-medium leading-tight text-balance text-white/85">
          {formatoFechaConDia(cita.fechaHora)}
        </p>
        <p className="mt-1 text-4xl font-semibold leading-none tracking-tight">
          {formatoHora(cita.fechaHora)}
        </p>
      </div>

      <dl className="divide-y divide-slate-100/80 px-6 text-sm">
        <div className="flex items-center gap-3 py-4">
          <Stethoscope className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden strokeWidth={1.5} />
          <dt className="sr-only">Tipo de cita</dt>
          <dd className="text-slate-700">
            {ETIQUETA_TIPO_CITA[cita.tipo]}
            {nombreProfesional && <span className="text-slate-500"> · con {nombreProfesional}</span>}
          </dd>
        </div>
        <div className="flex items-center gap-3 py-4">
          <Clock className="h-4.5 w-4.5 shrink-0 text-slate-400" aria-hidden strokeWidth={1.5} />
          <dt className="sr-only">Duración</dt>
          <dd className="text-slate-700">
            Duración aproximada: {formatoDuracion(cita.duracionMinutos)}
          </dd>
        </div>
      </dl>

      <div className="border-t border-slate-100/80 px-6 py-6">
        {yaConfirmo ? (
          <Insignia tono="verde" icono={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden />}>
            Ya confirmaste tu asistencia
          </Insignia>
        ) : (
          <>
            <p className="text-sm leading-relaxed text-slate-600">
              Confírmanos que vas a venir. Si no puedes, avísanos con tiempo y le damos el cupo a
              otra persona.
            </p>
            {confirmar.error && (
              <p className="mt-4 rounded-2xl bg-red-50/80 px-4 py-3 text-sm text-red-800 ring-1 ring-inset ring-red-600/15">
                {confirmar.error}
              </p>
            )}
            <Boton
              tamano="lg"
              anchoCompleto
              className="mt-4"
              cargando={confirmar.enCurso}
              alPulsar={() => void confirmar.ejecutar(cita.id)}
              icono={<CheckCircle2 className="h-5 w-5" aria-hidden />}
            >
              {confirmar.enCurso ? 'Confirmando…' : 'Confirmar mi asistencia'}
            </Boton>
          </>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Boton
            variante="secundario"
            anchoCompleto
            icono={<CalendarPlus className="h-4 w-4" aria-hidden />}
            alPulsar={() =>
              descargarIcs({
                titulo: `${ETIQUETA_TIPO_CITA[cita.tipo]} · ${CLINICA.nombre}`,
                inicio: new Date(cita.fechaHora),
                duracionMinutos: cita.duracionMinutos,
                descripcion: nombreProfesional ? `Con ${nombreProfesional}` : undefined,
              })
            }
          >
            Agregar al calendario
          </Boton>
          <Boton
            variante="secundario"
            anchoCompleto
            icono={<MessageCircle className="h-4 w-4" aria-hidden />}
            enlaceExterno={enlaceWhatsApp(
              `Hola, necesito cambiar mi cita del ${formatoFechaConDia(
                cita.fechaHora,
              ).toLowerCase()} a las ${formatoHora(cita.fechaHora)}.`,
            )}
          >
            Necesito cambiarla
          </Boton>
        </div>
      </div>
    </Tarjeta>
  );
}
