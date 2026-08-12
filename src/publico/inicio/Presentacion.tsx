import { CalendarPlus, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLINICA, enlaceWhatsApp } from '@compartido/clinica';
import { formatoNumero } from '@compartido/formato';
import Boton from '@componentes/ui/Boton';
import consultorio from '@/assets/imagenes/consultorio.webp';
import sonrisa from '@/assets/imagenes/sonrisa.webp';

const CIFRAS = [
  { valor: String(CLINICA.aniosTrayectoria), etiqueta: 'años de trayectoria' },
  { valor: `+${formatoNumero(CLINICA.pacientesAtendidos)}`, etiqueta: 'pacientes atendidos' },
  { valor: '6 días', etiqueta: 'de atención a la semana' },
];

export default function Presentacion() {
  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-petroleo-50 via-white to-white"
        aria-hidden
      />
      {/*
        Halo desenfocado tras el titular. Le da profundidad al fondo plano sin
        cargar una imagen: en un celular con datos móviles, cada kilobyte del
        primer pantallazo se nota.
      */}
      <div
        className="pointer-events-none absolute -top-32 -right-24 h-80 w-80 rounded-full bg-petroleo-200/30 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6 pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full bg-white/70 px-4 py-1.5 text-sm font-medium text-petroleo-700 shadow-suave ring-1 ring-petroleo-200/60">
              <span className="h-1.5 w-1.5 rounded-full bg-petroleo-500" aria-hidden />
              {CLINICA.aniosTrayectoria} años en {CLINICA.ciudad}
            </p>

            <h1 className="mt-6 text-4xl font-semibold leading-[1.08] tracking-tight text-balance text-slate-900 sm:text-5xl">
              Ortodoncia y estética dental hecha para tu ritmo
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-600">
              Acompañamos a más de {formatoNumero(CLINICA.pacientesAtendidos)} pacientes del
              municipio. Agenda tu cita en línea y consulta el avance de tu tratamiento cuando
              quieras.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
              <Boton
                a="/agendar"
                tamano="lg"
                anchoCompleto
                className="sm:w-auto"
                icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
              >
                Agendar cita
              </Boton>
              <Boton
                enlaceExterno={enlaceWhatsApp()}
                variante="secundario"
                tamano="lg"
                anchoCompleto
                className="sm:w-auto"
                icono={<MessageCircle className="h-5 w-5" aria-hidden />}
              >
                Escribir por WhatsApp
              </Boton>
            </div>

            {/*
              Las dos puertas de entrada, juntas y desde el primer pantallazo. La del
              personal estaba enterrada al final del formulario de pacientes: para
              entrar al panel había que pasar por la pantalla de otro rol y bajar
              hasta el pie.
            */}
            <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500">
              <p>
                ¿Ya eres paciente?{' '}
                <Link
                  to="/ingresar"
                  className="font-medium text-petroleo-700 underline-offset-4 hover:underline"
                >
                  Entra a tu portal
                </Link>
              </p>
              <p>
                ¿Trabajas en la clínica?{' '}
                <Link
                  to="/acceso"
                  className="font-medium text-petroleo-700 underline-offset-4 hover:underline"
                >
                  Entra al panel
                </Link>
              </p>
            </div>
          </div>

          {/*
            La imagen entra después del texto en el orden del documento: en
            celular lo primero que se lee tiene que ser el titular, no una foto
            que empuja el mensaje fuera de pantalla.
          */}
          <div className="relative">
            <img
              src={consultorio}
              alt="Consultorio odontológico moderno, con sillón e instrumental"
              width={1400}
              height={933}
              loading="eager"
              decoding="async"
              className="aspect-[4/3] w-full rounded-3xl object-cover shadow-alta ring-1 ring-slate-900/5"
            />

            {/*
              Recuadro superpuesto: rompe el rectángulo y da profundidad. Solo
              desde lg, porque en pantallas medias se le come una esquina a la
              foto principal y estorba más de lo que aporta.
            */}
            <img
              src={sonrisa}
              alt=""
              aria-hidden
              loading="lazy"
              decoding="async"
              className="absolute -bottom-8 -left-8 hidden aspect-square w-40 rounded-3xl object-cover shadow-alta ring-4 ring-white lg:block"
            />

            <p className="absolute -right-3 -top-4 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-medium text-slate-800 shadow-alta ring-1 ring-slate-900/5 sm:-right-5">
              <ShieldCheck className="h-4.5 w-4.5 shrink-0 text-petroleo-600" aria-hidden />
              Control mensual incluido
            </p>
          </div>
        </div>

        {/*
          Las tres cifras van en una sola superficie con separadores finos, no en
          tres tarjetas: así se leen como un dato único de la clínica. El salto de
          tamaño se guarda para `sm` porque a 32 px "+5.000" no cabe en un tercio
          de pantalla estrecha.
        */}
        <dl className="mt-16 grid grid-cols-3 divide-x divide-slate-200/70 overflow-hidden rounded-3xl bg-white shadow-suave ring-1 ring-slate-200/70 sm:mt-20">
          {CIFRAS.map((cifra) => (
            <div key={cifra.etiqueta} className="px-2 py-7 text-center sm:px-6 sm:py-9">
              <dt className="text-2xl font-semibold tracking-tight tabular-nums text-slate-900 sm:text-3xl">
                {cifra.valor}
              </dt>
              <dd className="mt-2 text-xs leading-snug text-slate-500 sm:text-sm">
                {cifra.etiqueta}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
