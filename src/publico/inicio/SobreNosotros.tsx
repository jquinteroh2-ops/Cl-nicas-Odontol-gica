/**
 * Quiénes somos: texto, datos de contacto en lista y reparto de la consulta.
 *
 * Las tres columnas entran desde lados distintos —izquierda, centro, derecha—
 * para que la sección se lea como un bloque que se arma, y no como tres cajas
 * que suben a la vez.
 */

import { CalendarPlus, Clock, CreditCard, MapPin, MessageCircle, ShieldCheck } from 'lucide-react';
import {
  CLINICA,
  HORARIO_PUBLICO,
  REPARTO_TRATAMIENTOS,
  enlaceWhatsApp,
} from '@compartido/clinica';
import { formatoTelefono } from '@compartido/formato';
import Boton from '@componentes/ui/Boton';
import BarraProporcion from '@publico/animacion/BarraProporcion';
import Revelar from '@publico/animacion/Revelar';
import EncabezadoSeccion from '@publico/inicio/EncabezadoSeccion';
import sonrisa from '@/assets/imagenes/sonrisa.webp';

const DATOS = [
  { icono: MapPin, texto: `${CLINICA.direccion}, ${CLINICA.ciudad}` },
  { icono: Clock, texto: HORARIO_PUBLICO.filter((franja) => !franja.cerrado).map((franja) => `${franja.dias}: ${franja.horario}`).join(' · ') },
  { icono: MessageCircle, texto: `WhatsApp ${formatoTelefono(CLINICA.whatsapp)}` },
  { icono: CreditCard, texto: 'Plan de pagos mensual para ortodoncia' },
  { icono: ShieldCheck, texto: 'Control mensual incluido en el tratamiento' },
];

export default function SobreNosotros() {
  return (
    // El desfase del ancla bajo la barra fija lo pone `scroll-padding-top`.
    <section id="nosotros" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <EncabezadoSeccion
          rotulo="Nosotros"
          titulo={`Somos ${CLINICA.nombre}`}
          descripcion={`${CLINICA.aniosTrayectoria} años acompañando sonrisas en ${CLINICA.ciudad}.`}
        />

        <div className="mt-14 grid items-start gap-10 lg:grid-cols-3 lg:gap-12">
          <Revelar desde="izquierda">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              Odontología cercana, sin letra pequeña
            </h3>
            <p className="mt-4 leading-relaxed text-slate-600">
              En {CLINICA.nombre} atiende siempre el mismo equipo: la persona que te valora es la
              que te controla cada mes. Explicamos el tratamiento completo antes de empezar —qué se
              hace, cuánto dura y cuánto cuesta— y lo dejamos por escrito en tu plan de pagos.
            </p>
            <p className="mt-4 leading-relaxed text-slate-600">
              Estamos {CLINICA.referencia.toLowerCase()}, en pleno {CLINICA.ciudad.split(',')[0]}, y
              atendemos seis días a la semana.
            </p>

            <ul className="mt-7 space-y-3.5">
              {DATOS.map((dato) => (
                <li key={dato.texto} className="flex items-start gap-3 text-sm text-slate-700">
                  <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-petroleo-50 text-petroleo-700">
                    <dato.icono className="h-4 w-4" aria-hidden strokeWidth={1.5} />
                  </span>
                  <span className="leading-relaxed">{dato.texto}</span>
                </li>
              ))}
            </ul>
          </Revelar>

          {/* La foto va en el centro, como eje visual de la sección. */}
          <Revelar desde="escala" retardo={120} className="relative">
            <img
              src={sonrisa}
              alt="Paciente sonriendo tras su tratamiento de ortodoncia"
              loading="lazy"
              decoding="async"
              className="aspect-4/5 w-full rounded-3xl object-cover shadow-alta ring-1 ring-slate-900/5"
            />

            {/*
              Marco desplazado por detrás: da profundidad sin pesar un kilobyte.
              Se esconde en pantallas medias, donde se sale de la columna.
            */}
            <div
              className="absolute -bottom-5 -left-5 -z-10 hidden h-full w-full rounded-3xl border-2 border-petroleo-200 lg:block"
              aria-hidden
            />

            <div className="absolute inset-x-4 -bottom-6 rounded-2xl bg-white p-4 shadow-alta ring-1 ring-slate-900/5">
              <p className="text-sm font-semibold tracking-tight text-slate-900">
                Valoración inicial sin costo
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                Te decimos qué necesitas y cuánto vale antes de empezar.
              </p>
            </div>
          </Revelar>

          <Revelar desde="derecha" retardo={240} className="mt-12 lg:mt-0">
            <h3 className="text-xl font-semibold tracking-tight text-slate-900">
              En qué se va la consulta
            </h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              Reparto de los tratamientos que hicimos el último año.
            </p>

            <div className="mt-7 space-y-5">
              {REPARTO_TRATAMIENTOS.map((tratamiento, indice) => (
                <BarraProporcion
                  key={tratamiento.nombre}
                  nombre={tratamiento.nombre}
                  porcentaje={tratamiento.porcentaje}
                  retardo={indice * 120}
                />
              ))}
            </div>

            <div className="mt-9 flex flex-col gap-2.5 sm:flex-row lg:flex-col">
              <Boton
                a="/agendar"
                anchoCompleto
                icono={<CalendarPlus className="h-4 w-4" aria-hidden />}
              >
                Pedir cita
              </Boton>
              <Boton
                enlaceExterno={enlaceWhatsApp()}
                variante="secundario"
                anchoCompleto
                icono={<MessageCircle className="h-4 w-4" aria-hidden />}
              >
                Escribir por WhatsApp
              </Boton>
            </div>
          </Revelar>
        </div>
      </div>
    </section>
  );
}
