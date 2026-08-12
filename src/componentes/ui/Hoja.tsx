/**
 * Diálogo modal. En celular sube desde abajo como hoja —el pulgar alcanza el
 * contenido y el gesto es el que la gente ya conoce de las apps— y en escritorio
 * se centra como diálogo clásico.
 *
 * Bloquea el desplazamiento del fondo mientras está abierta: sin eso, en el
 * celular se arrastra la página de atrás y el efecto se rompe.
 */

import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface Props {
  titulo: string;
  /** Bajo el título, en tono menor. */
  descripcion?: string;
  children: ReactNode;
  alCerrar: () => void;
  /** Fijo al pie de la hoja, siempre visible aunque el contenido se desplace. */
  pie?: ReactNode;
}

export default function Hoja({ titulo, descripcion, children, alCerrar, pie }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);

  /*
   * `alCerrar` casi siempre llega como función anónima, distinta en cada render.
   * Si entrara como dependencia del efecto, este se repetiría continuamente y el
   * `focus()` de abajo le robaría el cursor a quien esté escribiendo dentro de
   * la hoja. Va por referencia para que el efecto corra una sola vez.
   */
  const alCerrarRef = useRef(alCerrar);
  alCerrarRef.current = alCerrar;

  useEffect(() => {
    const desbordeOriginal = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function alPulsarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') alCerrarRef.current();
    }
    document.addEventListener('keydown', alPulsarTecla);

    // Lleva el foco dentro de la hoja para que el teclado y el lector no se
    // queden navegando la página de atrás.
    panelRef.current?.focus();

    return () => {
      document.body.style.overflow = desbordeOriginal;
      document.removeEventListener('keydown', alPulsarTecla);
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={alCerrar}
        className="absolute inset-0 h-full w-full cursor-default bg-slate-900/40 backdrop-blur-[2px]"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        tabIndex={-1}
        className="animar-entrada relative flex max-h-[92dvh] w-full flex-col rounded-t-3xl bg-white shadow-alta outline-none sm:max-h-[88dvh] sm:max-w-lg sm:rounded-3xl"
      >
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div className="min-w-0">
            <h2 className="text-xl font-semibold tracking-tight text-slate-900">{titulo}</h2>
            {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
          </div>
          <button
            type="button"
            onClick={alCerrar}
            aria-label="Cerrar"
            className="-mr-2 -mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-2xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

        {pie && (
          <footer className="border-t border-slate-100 px-6 py-4 pb-seguro sm:pb-4">{pie}</footer>
        )}
      </div>
    </div>
  );
}
