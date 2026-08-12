/**
 * Campo de texto. Alto táctil holgado y etiqueta siempre visible: en un
 * formulario que se llena desde el celular, el marcador de posición como única
 * etiqueta se pierde en cuanto se empieza a escribir.
 */

import { useId, type InputHTMLAttributes, type ReactNode } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'id'> {
  etiqueta: string;
  /** Texto de ayuda bajo el campo. */
  ayuda?: ReactNode;
  error?: string | null;
  obligatorio?: boolean;
  className?: string;
}

export default function CampoTexto({
  etiqueta,
  ayuda,
  error,
  obligatorio,
  className = '',
  ...resto
}: Props) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;

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

      {/*
        Relleno en gris muy claro en reposo y blanco al enfocar: marca dónde se
        escribe sin necesidad de un borde grueso alrededor del campo.
      */}
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={ayuda || error ? idAyuda : undefined}
        aria-required={obligatorio}
        className={`mt-2 block h-13 w-full rounded-2xl border-0 px-4 text-base text-slate-900 ring-1 ring-inset transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${
          error
            ? 'bg-red-50/50 ring-red-300 focus:ring-red-500'
            : 'bg-slate-50 ring-slate-200 focus:ring-petroleo-600'
        }`}
        {...resto}
      />

      {(error || ayuda) && (
        <p id={idAyuda} className={`mt-2 text-sm ${error ? 'text-red-700' : 'text-slate-500'}`}>
          {error ?? ayuda}
        </p>
      )}
    </div>
  );
}
