import { Check } from 'lucide-react';

interface Props {
  pasoActual: number;
  pasos: string[];
}

/**
 * Progreso del asistente. En celular se ve solo la barra y el rótulo del paso
 * actual; los cuatro nombres completos solo caben en pantallas anchas.
 */
export default function BarraPasos({ pasoActual, pasos }: Props) {
  const porcentaje = (pasoActual / pasos.length) * 100;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3 sm:hidden">
        <p className="text-base font-semibold tracking-tight text-slate-900">
          {pasos[pasoActual - 1]}
        </p>
        <p className="shrink-0 text-xs tabular-nums text-slate-500">
          Paso {pasoActual} de {pasos.length}
        </p>
      </div>

      <ol className="hidden sm:flex sm:items-center sm:gap-2.5">
        {pasos.map((paso, indice) => {
          const numero = indice + 1;
          const completado = numero < pasoActual;
          const activo = numero === pasoActual;
          return (
            <li key={paso} className="flex flex-1 items-center gap-2.5">
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-semibold transition-colors ${
                  completado
                    ? 'bg-petroleo-600 text-white'
                    : activo
                      ? 'bg-petroleo-100 text-petroleo-700 ring-2 ring-petroleo-600'
                      : 'bg-slate-100 text-slate-400'
                }`}
              >
                {completado ? <Check className="h-3.5 w-3.5" aria-hidden /> : numero}
              </span>
              <span
                className={`truncate text-sm ${
                  activo ? 'font-medium text-slate-900' : 'text-slate-500'
                }`}
              >
                {paso}
              </span>
            </li>
          );
        })}
      </ol>

      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-100 sm:mt-5">
        <div
          className="h-full rounded-full bg-petroleo-600 transition-[width] duration-300 ease-out"
          style={{ width: `${porcentaje}%` }}
          role="progressbar"
          aria-valuenow={pasoActual}
          aria-valuemin={1}
          aria-valuemax={pasos.length}
          aria-label={`Paso ${pasoActual} de ${pasos.length}`}
        />
      </div>
    </div>
  );
}
