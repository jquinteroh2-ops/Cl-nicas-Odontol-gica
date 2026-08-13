/**
 * Actualidad: tres respuestas a lo que más se pregunta en el consultorio.
 *
 * La portada de cada tarjeta es un degradado con el icono del tema, no una foto:
 * pesa cero y no obliga a mantener un banco de imágenes para una sección que
 * cambia de contenido cada tanto. El icono se agranda al apuntar.
 */

import { ArrowRight, Clock } from 'lucide-react';
import { ARTICULOS, CLINICA, enlaceWhatsApp } from '@compartido/clinica';
import IconoServicio from '@componentes/ui/IconoServicio';
import Revelar from '@publico/animacion/Revelar';
import EncabezadoSeccion from '@publico/inicio/EncabezadoSeccion';

export default function Actualidad() {
  return (
    <section id="actualidad" className="bg-white py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <EncabezadoSeccion
          rotulo="Actualidad"
          titulo="Lo que más nos preguntan"
          descripcion="Respuestas cortas a las dudas que llegan todos los días al consultorio."
        />

        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {ARTICULOS.map((articulo, indice) => (
            <Revelar as="li" key={articulo.id} retardo={indice * 140} className="h-full">
              <article className="group flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-suave ring-1 ring-slate-200/70 transition-all duration-300 ease-suave hover:-translate-y-1.5 hover:shadow-alta">
                <div className="relative h-40 overflow-hidden bg-gradient-to-br from-petroleo-600 to-petroleo-800">
                  {/* Trama de círculos concéntricos: textura sin imagen. */}
                  <span
                    className="absolute -top-10 -right-8 h-40 w-40 rounded-full bg-white/10 transition-transform duration-500 ease-suave group-hover:scale-125"
                    aria-hidden
                  />
                  <span
                    className="absolute -bottom-12 -left-6 h-32 w-32 rounded-full bg-white/5 transition-transform duration-500 ease-suave group-hover:scale-125"
                    aria-hidden
                  />

                  <span className="absolute inset-0 grid place-items-center text-white/90 transition-transform duration-500 ease-suave group-hover:scale-110">
                    <IconoServicio nombre={articulo.icono} className="h-12 w-12" />
                  </span>

                  <span className="absolute top-4 left-4 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-white ring-1 ring-white/25 backdrop-blur-sm">
                    {articulo.categoria}
                  </span>
                </div>

                <div className="flex flex-1 flex-col p-6">
                  <p className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Clock className="h-3.5 w-3.5" aria-hidden />
                    {articulo.lectura} min de lectura
                  </p>

                  <h3 className="mt-3 text-lg leading-snug font-semibold tracking-tight text-slate-900 transition-colors group-hover:text-petroleo-700">
                    {articulo.titulo}
                  </h3>

                  <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">
                    {articulo.resumen}
                  </p>

                  {/*
                    No hay página de detalle: la conversación real ocurre por
                    WhatsApp, así que el enlace lleva justo ahí con la pregunta
                    ya escrita.
                  */}
                  <a
                    href={enlaceWhatsApp(
                      `Hola, escribo desde la página de ${CLINICA.nombre}. Quiero saber más sobre: ${articulo.titulo}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-petroleo-700 transition-colors hover:text-petroleo-900"
                  >
                    Preguntar por WhatsApp
                    <ArrowRight
                      className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </a>
                </div>
              </article>
            </Revelar>
          ))}
        </ul>
      </div>
    </section>
  );
}
