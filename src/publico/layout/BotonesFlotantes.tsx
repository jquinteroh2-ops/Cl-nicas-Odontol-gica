/**
 * Botones fijos en la esquina: WhatsApp siempre, y volver arriba cuando ya se
 * bajó lo suficiente como para que el menú quede lejos.
 *
 * En una página de una sola columna y siete secciones, subir a mano es el gesto
 * más repetido; el sitio de referencia también lo resuelve con un botón fijo.
 */

import { useEffect, useState } from 'react';
import { ArrowUp, MessageCircle } from 'lucide-react';
import { enlaceWhatsApp } from '@compartido/clinica';

export default function BotonesFlotantes() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const revisar = () => setVisible(window.scrollY > 700);
    revisar();
    window.addEventListener('scroll', revisar, { passive: true });
    return () => window.removeEventListener('scroll', revisar);
  }, []);

  return (
    <div
      className="fixed right-5 z-40 flex flex-col items-end gap-3"
      style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
    >
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Volver arriba"
        // Se mantiene montado y solo cambia de opacidad y escala: así la salida
        // también se anima, y `pointer-events` evita que estorbe mientras no se ve.
        className={`grid h-11 w-11 place-items-center rounded-full bg-white text-slate-600 shadow-alta ring-1 ring-slate-200/70 transition-all duration-300 ease-suave hover:-translate-y-0.5 hover:text-petroleo-700 ${
          visible ? 'scale-100 opacity-100' : 'pointer-events-none scale-75 opacity-0'
        }`}
      >
        <ArrowUp className="h-4.5 w-4.5" aria-hidden />
      </button>

      <a
        href={enlaceWhatsApp()}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        className="grid h-14 w-14 place-items-center rounded-full bg-petroleo-600 text-white shadow-alta transition-all duration-300 ease-suave hover:-translate-y-0.5 hover:bg-petroleo-700 active:scale-95"
      >
        <MessageCircle className="h-6 w-6" aria-hidden />
      </a>
    </div>
  );
}
