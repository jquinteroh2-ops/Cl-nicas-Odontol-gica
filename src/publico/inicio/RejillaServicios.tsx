/**
 * Los ocho servicios de la clínica.
 *
 * Entran escalonados, de 80 en 80 milisegundos: la rejilla se dibuja en cascada
 * en lugar de aparecer entera de golpe. Al pasar el puntero, la tarjeta se
 * levanta y el icono se invierte —es el único movimiento de la sección, y basta.
 */

import { ArrowRight } from 'lucide-react';
import { SERVICIOS } from '@compartido/clinica';
import Boton from '@componentes/ui/Boton';
import IconoServicio from '@componentes/ui/IconoServicio';
import Revelar from '@publico/animacion/Revelar';
import EncabezadoSeccion from '@publico/inicio/EncabezadoSeccion';

export default function RejillaServicios() {
  return (
    <section id="servicios" className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <EncabezadoSeccion
          rotulo="Servicios"
          titulo="Lo que hacemos"
          descripcion="Tratamientos de ortodoncia y odontología general, con el mismo equipo de principio a fin."
        />

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {SERVICIOS.map((servicio, indice) => (
            <Revelar as="li" key={servicio.id} retardo={indice * 80}>
              <div className="group relative flex h-full items-start gap-4 overflow-hidden rounded-3xl bg-white p-5 shadow-suave ring-1 ring-slate-200/70 transition-all duration-300 ease-suave hover:-translate-y-1.5 hover:shadow-alta hover:ring-petroleo-200 lg:block lg:p-6">
                {/*
                  Filo de color que se despliega desde la izquierda al apuntar.
                  Va detrás del contenido y no cambia el tamaño de nada, así que
                  la tarjeta no se mueve al animarse.
                */}
                <span
                  className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-petroleo-500 to-petroleo-700 transition-transform duration-300 ease-suave group-hover:scale-x-100"
                  aria-hidden
                />

                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-petroleo-50 text-petroleo-700 transition-colors duration-300 group-hover:bg-petroleo-600 group-hover:text-white lg:mb-5">
                  <IconoServicio nombre={servicio.icono} className="h-5 w-5" />
                </span>

                <span className="min-w-0">
                  <span className="block font-semibold tracking-tight text-slate-900">
                    {servicio.nombre}
                  </span>
                  <span className="mt-1.5 block text-sm leading-relaxed text-slate-600">
                    {servicio.descripcion}
                  </span>
                </span>
              </div>
            </Revelar>
          ))}
        </ul>

        <Revelar retardo={200} className="mt-12 text-center">
          <p className="text-slate-600">
            ¿No ves lo que buscas? Escríbenos y te decimos si lo hacemos.
          </p>
          <div className="mt-5 inline-flex">
            <Boton
              a="/agendar"
              tamano="lg"
              iconoDerecha={<ArrowRight className="h-4 w-4" aria-hidden />}
            >
              Pedir una valoración
            </Boton>
          </div>
        </Revelar>
      </div>
    </section>
  );
}
