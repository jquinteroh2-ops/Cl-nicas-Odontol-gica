/**
 * Banda de cifras con fondo en parallax.
 *
 * Es el corte visual de la página: rompe la sucesión de fondos claros justo a
 * mitad del recorrido. Los números suben desde cero cuando la banda entra en
 * pantalla —si ya estuvieran puestos, nadie los leería.
 */

import { CIFRAS } from '@compartido/clinica';
import IconoServicio from '@componentes/ui/IconoServicio';
import Contador from '@publico/animacion/Contador';
import Revelar from '@publico/animacion/Revelar';
import usarParallax from '@publico/animacion/usarParallax';
import sonrisa from '@/assets/imagenes/sonrisa.webp';

export default function BandaCifras() {
  const seccion = usarParallax<HTMLElement>(0.16);

  return (
    <section ref={seccion} className="relative overflow-hidden py-20 sm:py-24">
      {/* La capa sobresale por arriba y por abajo: el parallax no puede dejar ver el borde. */}
      <div className="capa-parallax absolute inset-x-0 -top-[18%] -bottom-[18%]" aria-hidden>
        <img src={sonrisa} alt="" loading="lazy" decoding="async" className="h-full w-full object-cover" />
      </div>

      <div className="absolute inset-0 bg-petroleo-900/88" aria-hidden />
      <div
        className="pointer-events-none absolute -top-24 -left-20 h-72 w-72 rounded-full bg-petroleo-500/25 blur-3xl"
        aria-hidden
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-4">
          {/*
            El icono va dentro del `dt`: una lista de definiciones solo admite
            pares término-descripción, y colgar el adorno fuera rompía el marcado.
          */}
          {CIFRAS.map((cifra, indice) => (
            <Revelar key={cifra.etiqueta} retardo={indice * 140} className="text-center">
              <dt className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                <span className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-2xl bg-white/10 text-petroleo-100 ring-1 ring-white/15">
                  <IconoServicio nombre={cifra.icono} className="h-6 w-6" />
                </span>
                <Contador hasta={cifra.valor} prefijo={cifra.prefijo} sufijo={cifra.sufijo} />
              </dt>
              <dd className="mt-2 text-sm leading-snug text-petroleo-100/80">{cifra.etiqueta}</dd>
            </Revelar>
          ))}
        </dl>
      </div>
    </section>
  );
}
