import { useId, type SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';

interface Opcion {
  valor: string;
  etiqueta: string;
}

interface Props extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'className' | 'id'> {
  etiqueta: string;
  opciones: Opcion[];
  ayuda?: string;
  error?: string | null;
  obligatorio?: boolean;
  className?: string;
}

/** Mismo relleno y mismo alto que CampoTexto: en un formulario mixto tienen que alinear. */
export default function Selector({
  etiqueta,
  opciones,
  ayuda,
  error,
  obligatorio,
  className = '',
  ...resto
}: Props) {
  const id = useId();

  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700">
        {etiqueta}
        {obligatorio && (
          <span className="ml-1 text-red-600" aria-hidden>
            *
          </span>
        )}
      </label>

      <div className="relative mt-2">
        <select
          id={id}
          aria-invalid={error ? true : undefined}
          className={`block h-13 w-full appearance-none rounded-2xl border-0 px-4 pr-11 text-base text-slate-900 ring-1 ring-inset transition-all focus:bg-white focus:ring-2 focus:ring-inset ${
            error
              ? 'bg-red-50/50 ring-red-300 focus:ring-red-500'
              : 'bg-slate-50 ring-slate-200 focus:ring-petroleo-600'
          }`}
          {...resto}
        >
          {opciones.map((opcion) => (
            <option key={opcion.valor} value={opcion.valor}>
              {opcion.etiqueta}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden
        />
      </div>

      {(error || ayuda) && (
        <p className={`mt-2 text-sm ${error ? 'text-red-700' : 'text-slate-500'}`}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}
