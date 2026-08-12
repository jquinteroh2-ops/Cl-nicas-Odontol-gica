import { CalendarPlus, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLINICA, enlaceWhatsApp } from '@compartido/clinica';
import Boton from '@componentes/ui/Boton';
import Presentacion from '@publico/inicio/Presentacion';
import RejillaServicios from '@publico/inicio/RejillaServicios';
import BloqueUbicacion from '@publico/inicio/BloqueUbicacion';

export default function Inicio() {
  return (
    <>
      <Presentacion />
      <RejillaServicios />
      <BloqueUbicacion />

      {/* Cierre en color pleno: es el corte que separa la página de la acción. */}
      <section className="relative overflow-hidden bg-petroleo-700 py-16 sm:py-24">
        <div
          className="pointer-events-none absolute -top-24 -right-20 h-72 w-72 rounded-full bg-petroleo-500/25 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-6xl px-6">
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            Pide tu cita en menos de un minuto
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-petroleo-100">
            No necesitas tener cuenta. Si es tu primera vez, déjanos tus datos y te respondemos por
            WhatsApp, normalmente el mismo día.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Boton
              a="/agendar"
              variante="claro"
              tamano="lg"
              anchoCompleto
              className="sm:w-auto"
              icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
            >
              Agendar cita
            </Boton>
            <Boton
              enlaceExterno={enlaceWhatsApp()}
              variante="contornoClaro"
              tamano="lg"
              anchoCompleto
              className="sm:w-auto"
              icono={<MessageCircle className="h-5 w-5" aria-hidden />}
            >
              Escribir por WhatsApp
            </Boton>
          </div>

          <p className="mt-8 text-sm text-petroleo-200">
            ¿Ya eres paciente de {CLINICA.nombre}?{' '}
            <Link to="/ingresar" className="font-medium text-white underline underline-offset-4">
              Entra a tu portal
            </Link>
          </p>
        </div>
      </section>
    </>
  );
}
