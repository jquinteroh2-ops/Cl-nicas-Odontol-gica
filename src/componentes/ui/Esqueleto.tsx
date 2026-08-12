/**
 * Bloques de carga. Skeletons y no ruedas giratorias: mientras carga, la pantalla
 * ya muestra la forma de lo que va a aparecer, y el salto al llegar los datos es
 * mucho menos brusco.
 */

interface Props {
  className?: string;
}

export default function Esqueleto({ className = 'h-4 w-full' }: Props) {
  return <div className={`animar-pulso-suave rounded-xl bg-slate-200/60 ${className}`} aria-hidden />;
}

/** Varias líneas de texto simuladas. */
export function EsqueletoTexto({ lineas = 3 }: { lineas?: number }) {
  return (
    <div className="space-y-2.5" aria-hidden>
      {Array.from({ length: lineas }).map((_, indice) => (
        <Esqueleto key={indice} className={`h-4 ${indice === lineas - 1 ? 'w-2/3' : 'w-full'}`} />
      ))}
    </div>
  );
}

/** Rejilla de franjas horarias mientras se consulta la disponibilidad. */
export function EsqueletoFranjas({ cantidad = 8 }: { cantidad?: number }) {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4" aria-hidden>
      {Array.from({ length: cantidad }).map((_, indice) => (
        <Esqueleto key={indice} className="h-13 w-full" />
      ))}
    </div>
  );
}

/** Silueta de una tarjeta completa, para las pantallas que cargan un bloque entero. */
export function EsqueletoTarjeta({ className = '' }: Props) {
  return (
    <div
      className={`rounded-3xl bg-white p-6 shadow-suave ring-1 ring-slate-200/70 ${className}`}
      aria-hidden
    >
      <Esqueleto className="h-3 w-24" />
      <Esqueleto className="mt-4 h-6 w-2/3" />
      <div className="mt-5 space-y-2.5">
        <Esqueleto className="h-4 w-full" />
        <Esqueleto className="h-4 w-4/5" />
      </div>
    </div>
  );
}
