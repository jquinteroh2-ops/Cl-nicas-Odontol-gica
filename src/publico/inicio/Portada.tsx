/**
 * Portada a pantalla completa: foto, velo petróleo y titular centrado.
 *
 * La pieza que la sostiene es el texto que se escribe solo con el nombre de los
 * tratamientos. Ocupa una línea y dice lo que en una lista serían seis, que es
 * exactamente lo que hace falta en el primer pantallazo de un celular.
 */

import { CalendarPlus, ChevronDown, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { CLINICA, REDES, SERVICIOS, enlaceWhatsApp } from '@compartido/clinica';
import Boton from '@componentes/ui/Boton';
import IconoRed from '@componentes/ui/IconoRed';
import Revelar from '@publico/animacion/Revelar';
import TextoMaquina from '@publico/animacion/TextoMaquina';
import usarParallax from '@publico/animacion/usarParallax';
import consultorio from '@/assets/imagenes/consultorio.webp';

/** Los tratamientos, en el orden en que se escriben. */
const TRATAMIENTOS = SERVICIOS.map((servicio) => servicio.nombre);

export default function Portada() {
  const seccion = usarParallax<HTMLElement>(0.12);

  return (
    <section
      id="inicio"
      ref={seccion}
      className="relative flex min-h-dvh items-center justify-center overflow-hidden"
    >
      {/*
        La foto sobresale por arriba y por abajo para que el desplazamiento del
        parallax no descubra el fondo por ninguno de los dos bordes.
      */}
      <div className="capa-parallax absolute inset-x-0 -top-[12%] -bottom-[12%]" aria-hidden>
        <img
          src={consultorio}
          alt=""
          width={1400}
          height={933}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="animar-acercar h-full w-full object-cover"
        />
      </div>

      {/*
        Dos velos: el degradado vertical asienta el texto y el tinte petróleo
        lleva la foto al color de la marca. Con uno solo, o el texto no se lee o
        la imagen se ve gris.
      */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-petroleo-950/85 via-petroleo-900/70 to-petroleo-950/90"
        aria-hidden
      />
      <div className="absolute inset-0 bg-petroleo-800/25 mix-blend-multiply" aria-hidden />

      <div className="relative mx-auto w-full max-w-4xl px-6 pt-28 pb-24 text-center sm:pt-32">
        <Revelar>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-petroleo-300" aria-hidden />
            {CLINICA.aniosTrayectoria} años en {CLINICA.ciudad}
          </p>
        </Revelar>

        <Revelar retardo={120}>
          <h1 className="mt-7 text-4xl leading-[1.08] font-semibold tracking-tight text-balance text-white sm:text-5xl lg:text-6xl">
            Ortodoncia y estética dental
            <span className="block text-petroleo-200">hecha para tu ritmo</span>
          </h1>
        </Revelar>

        <Revelar retardo={240}>
          <p className="mx-auto mt-6 flex min-h-8 flex-wrap items-center justify-center gap-x-2 text-lg font-medium text-white/90 sm:text-xl">
            <span>Especialistas en</span>
            <TextoMaquina
              palabras={TRATAMIENTOS}
              className="whitespace-nowrap text-petroleo-200"
            />
          </p>
        </Revelar>

        <Revelar retardo={360}>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/75 sm:text-lg">
            {CLINICA.descripcion} en {CLINICA.ciudad}. Agenda tu cita en línea, sin llamadas y sin
            filas, y sigue el avance de tu tratamiento desde el celular.
          </p>
        </Revelar>

        <Revelar retardo={480}>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4">
            <Boton
              a="/agendar"
              variante="claro"
              tamano="lg"
              anchoCompleto
              className="sm:w-auto"
              icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
            >
              Pedir cita
            </Boton>
            <Boton
              enlaceExterno={enlaceWhatsApp()}
              variante="contornoClaro"
              tamano="lg"
              anchoCompleto
              className="backdrop-blur-sm sm:w-auto"
              icono={<MessageCircle className="h-5 w-5" aria-hidden />}
            >
              Escribir por WhatsApp
            </Boton>
          </div>
        </Revelar>

        <Revelar retardo={600}>
          <div className="mt-9 flex items-center justify-center gap-2.5">
            {REDES.map((red) => (
              <a
                key={red.nombre}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={red.nombre}
                className="grid h-11 w-11 place-items-center rounded-full text-white/80 ring-1 ring-white/25 transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-petroleo-700 hover:ring-white"
              >
                <IconoRed tipo={red.icono} className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </Revelar>

        {/*
          Las dos puertas de entrada, desde el primer pantallazo: la del personal
          estaba enterrada al final del formulario de pacientes.
        */}
        <Revelar retardo={720}>
          <p className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-sm text-white/65">
            <Link to="/ingresar" className="underline-offset-4 hover:text-white hover:underline">
              Ya soy paciente
            </Link>
            <Link to="/acceso" className="underline-offset-4 hover:text-white hover:underline">
              Acceso del personal
            </Link>
          </p>
        </Revelar>
      </div>

      {/* Indicador de "sigue bajando". Es el gesto que invita a leer el resto. */}
      <a
        href="#nosotros"
        aria-label="Ir a la sección Nosotros"
        className="animar-flotar absolute bottom-7 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-2 text-white/70 transition-colors hover:text-white sm:flex"
      >
        <span className="flex h-9 w-5.5 justify-center rounded-full pt-2 ring-1 ring-white/40">
          <span className="animar-rueda h-1.5 w-1 rounded-full bg-white/80" aria-hidden />
        </span>
        <ChevronDown className="h-4 w-4" aria-hidden />
      </a>
    </section>
  );
}
