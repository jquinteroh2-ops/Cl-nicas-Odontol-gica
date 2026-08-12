/**
 * Dónde queda y a qué horas atienden.
 *
 * La referencia del Éxito va destacada: en Turbaco la gente llega por ahí, no
 * por el número de la carrera.
 */

import { Clock, MapPin, MessageCircle, Navigation } from 'lucide-react';
import { CLINICA, DIRECCION_COMPLETA, HORARIO_PUBLICO, enlaceWhatsApp } from '@compartido/clinica';
import { estaAtendiendoAhora } from '@compartido/disponibilidad';
import { formatoTelefono } from '@compartido/formato';
import Boton from '@componentes/ui/Boton';
import Insignia from '@componentes/ui/Insignia';
import Tarjeta from '@componentes/ui/Tarjeta';

const ENLACE_MAPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${DIRECCION_COMPLETA}, Colombia`,
)}`;

export default function BloqueUbicacion() {
  const atendiendo = estaAtendiendoAhora();

  return (
    <section className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-6">
        <p className="rotulo">Visítanos</p>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
          Dónde estamos
        </h2>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          <Tarjeta className="p-6 sm:p-8">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-petroleo-50 text-petroleo-700">
                <MapPin className="h-5 w-5" aria-hidden strokeWidth={1.5} />
              </span>
              <div className="min-w-0">
                <p className="text-lg font-semibold leading-snug tracking-tight text-slate-900">
                  {CLINICA.direccion}
                </p>
                <p className="mt-0.5 text-slate-600">{CLINICA.ciudad}</p>
              </div>
            </div>

            <p className="mt-6 flex items-start gap-2.5 rounded-2xl bg-petroleo-50/70 p-4 text-sm leading-relaxed text-petroleo-900">
              <Navigation className="mt-0.5 h-4 w-4 shrink-0 text-petroleo-600" aria-hidden />
              <span>{CLINICA.referencia}.</span>
            </p>

            <div className="mt-6 flex flex-col gap-2.5 sm:flex-row">
              <Boton enlaceExterno={ENLACE_MAPA} variante="secundario" anchoCompleto className="sm:w-auto">
                Ver en el mapa
              </Boton>
              <Boton
                enlaceExterno={enlaceWhatsApp()}
                variante="fantasma"
                anchoCompleto
                className="sm:w-auto"
                icono={<MessageCircle className="h-4 w-4" aria-hidden />}
              >
                {formatoTelefono(CLINICA.whatsapp)}
              </Boton>
            </div>
          </Tarjeta>

          <Tarjeta className="p-6 sm:p-8">
            {/* El horario y el estado "abierto ahora" se envuelven en pantalla estrecha. */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-petroleo-50 text-petroleo-700">
                  <Clock className="h-5 w-5" aria-hidden strokeWidth={1.5} />
                </span>
                <p className="text-lg font-semibold tracking-tight text-slate-900">
                  Horario de atención
                </p>
              </div>
              <Insignia tono={atendiendo ? 'verde' : 'neutro'}>
                {atendiendo ? 'Abierto ahora' : 'Cerrado ahora'}
              </Insignia>
            </div>

            <dl className="mt-6 divide-y divide-slate-100">
              {HORARIO_PUBLICO.map((franja) => (
                <div key={franja.dias} className="flex items-baseline justify-between gap-4 py-3.5">
                  <dt className={franja.cerrado ? 'text-slate-400' : 'text-slate-700'}>
                    {franja.dias}
                  </dt>
                  <dd
                    className={`text-right tabular-nums ${
                      franja.cerrado ? 'text-slate-400' : 'font-medium text-slate-900'
                    }`}
                  >
                    {franja.horario}
                  </dd>
                </div>
              ))}
            </dl>
          </Tarjeta>
        </div>
      </div>
    </section>
  );
}
