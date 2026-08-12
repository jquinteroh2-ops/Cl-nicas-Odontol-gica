/**
 * Los ocho servicios de la clínica.
 *
 * En celular son filas con el icono a la izquierda, que es como se leen ocho
 * elementos sin cansar el pulgar. En escritorio pasan a rejilla de tarjetas.
 */

import { SERVICIOS } from '@compartido/clinica';
import IconoServicio from '@componentes/ui/IconoServicio';

export default function RejillaServicios() {
  return (
    <section className="mx-auto max-w-6xl px-6 py-16 sm:py-24">
      <p className="rotulo">Servicios</p>
      <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        Lo que hacemos
      </h2>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-slate-600">
        Tratamientos de ortodoncia y odontología general, con el mismo equipo de principio a fin.
      </p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {SERVICIOS.map((servicio) => (
          <li
            key={servicio.id}
            className="flex items-start gap-4 rounded-3xl bg-white p-5 shadow-suave ring-1 ring-slate-200/70 transition-all hover:shadow-media lg:block lg:p-6"
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-petroleo-50 text-petroleo-700 lg:mb-5">
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
          </li>
        ))}
      </ul>
    </section>
  );
}
