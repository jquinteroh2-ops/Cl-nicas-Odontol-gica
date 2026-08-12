/**
 * Plan de pagos completo.
 *
 * Un tratamiento de ortodoncia son veinte y pico de cuotas, y desplegarlas todas
 * deja al pie de la pantalla —donde está el contacto con la clínica— a un scroll
 * larguísimo en el celular. Se muestran las pagadas y las siguientes por vencer,
 * que es lo que se consulta; el resto queda a un toque.
 */

import { useState } from 'react';
import type { Cuota } from '@compartido/tipos';
import Tarjeta from '@componentes/ui/Tarjeta';
import FilaCuota from './FilaCuota';

/** Cuántas cuotas sin pagar se muestran antes de plegar el resto. */
const PENDIENTES_VISIBLES = 3;

export default function PlanDePagos({ cuotas }: { cuotas: Cuota[] }) {
  const [expandido, setExpandido] = useState(false);

  const corte =
    cuotas.filter((c) => c.estado === 'pagada').length + PENDIENTES_VISIBLES;
  const visibles = expandido ? cuotas : cuotas.slice(0, corte);
  const ocultas = cuotas.length - visibles.length;

  return (
    <section>
      <h2 className="px-1 text-xl font-semibold tracking-tight text-slate-900">Plan de pagos</h2>

      <Tarjeta className="mt-4 overflow-hidden">
        <ul className="divide-y divide-slate-100/80">
          {visibles.map((cuota) => (
            <FilaCuota key={cuota.id} cuota={cuota} />
          ))}
        </ul>

        {(ocultas > 0 || expandido) && (
          <button
            type="button"
            onClick={() => setExpandido((valor) => !valor)}
            className="w-full border-t border-slate-100/80 px-6 py-4 text-sm font-medium text-petroleo-700 transition-colors hover:bg-petroleo-50"
          >
            {expandido ? 'Ver menos' : `Ver las ${ocultas} cuotas restantes`}
          </button>
        )}
      </Tarjeta>
    </section>
  );
}
