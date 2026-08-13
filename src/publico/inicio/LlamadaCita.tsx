/**
 * Banda de llamada a la acción, entre la actualidad y el contacto.
 *
 * En el sitio de referencia es la franja de "aparta tu cita": un corte en color
 * pleno que separa el contenido informativo del formulario. Aquí cumple lo
 * mismo y además recoge a quien ya es paciente.
 */

import { CalendarPlus, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLINICA, enlaceWhatsApp } from '@compartido/clinica';
import Boton from '@componentes/ui/Boton';
import Revelar from '@publico/animacion/Revelar';

export default function LlamadaCita() {
  return (
    <section className="relative overflow-hidden bg-petroleo-700 py-16 sm:py-20">
      <div
        className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-petroleo-500/30 blur-3xl"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute -bottom-32 -left-24 h-80 w-80 rounded-full bg-petroleo-900/40 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-6 lg:grid-cols-[1.4fr_1fr]">
        <Revelar desde="izquierda">
          <h2 className="text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            Pide tu cita en menos de un minuto
          </h2>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-petroleo-100">
            No necesitas tener cuenta. Si es tu primera vez, déjanos tus datos y te respondemos por
            WhatsApp, normalmente el mismo día.
          </p>
          <p className="mt-6 text-sm text-petroleo-200">
            ¿Ya eres paciente de {CLINICA.nombre}?{' '}
            <Link to="/ingresar" className="font-medium text-white underline underline-offset-4">
              Entra a tu portal
            </Link>
          </p>
        </Revelar>

        <Revelar desde="derecha" retardo={150}>
          <div className="flex flex-col gap-3">
            <Boton
              a="/agendar"
              variante="claro"
              tamano="lg"
              anchoCompleto
              icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
            >
              Agendar cita
            </Boton>
            <Boton
              enlaceExterno={enlaceWhatsApp()}
              variante="contornoClaro"
              tamano="lg"
              anchoCompleto
              icono={<MessageCircle className="h-5 w-5" aria-hidden />}
            >
              Escribir por WhatsApp
            </Boton>
          </div>
        </Revelar>
      </div>
    </section>
  );
}
