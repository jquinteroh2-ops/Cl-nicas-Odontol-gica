/**
 * Texto que se escribe y se borra solo, rotando por una lista.
 *
 * Es el efecto que abre el sitio de referencia. Aquí sirve para nombrar los
 * tratamientos en el titular sin ocupar cinco líneas de pantalla.
 */

import { useEffect, useState } from 'react';
import { prefiereMenosMovimiento } from './preferencias';

interface Props {
  palabras: string[];
  className?: string;
  /** Milisegundos por letra al escribir. Al borrar va al doble de rápido. */
  velocidad?: number;
  /** Cuánto se queda quieta la palabra completa antes de borrarla. */
  pausa?: number;
}

export default function TextoMaquina({
  palabras,
  className = '',
  velocidad = 85,
  pausa = 1600,
}: Props) {
  const [indice, setIndice] = useState(0);
  const [letras, setLetras] = useState(0);
  const [borrando, setBorrando] = useState(false);
  const [quieto] = useState(prefiereMenosMovimiento);

  useEffect(() => {
    if (quieto || palabras.length === 0) return;

    const palabra = palabras[indice % palabras.length];

    // Palabra completa: se queda un momento y empieza a borrar.
    if (!borrando && letras === palabra.length) {
      const espera = setTimeout(() => setBorrando(true), pausa);
      return () => clearTimeout(espera);
    }

    // Vacía: pasa a la siguiente.
    if (borrando && letras === 0) {
      setBorrando(false);
      setIndice((anterior) => (anterior + 1) % palabras.length);
      return;
    }

    const tiempo = setTimeout(
      () => setLetras((actual) => actual + (borrando ? -1 : 1)),
      borrando ? velocidad / 2 : velocidad,
    );
    return () => clearTimeout(tiempo);
  }, [quieto, palabras, indice, letras, borrando, velocidad, pausa]);

  const palabraActual = palabras[indice % palabras.length] ?? '';
  const visible = quieto ? palabraActual : palabraActual.slice(0, letras);

  return (
    <span className={className}>
      {/*
        El texto en movimiento se oculta a los lectores de pantalla —que si no
        leerían letra a letra— y en su lugar se anuncia la lista completa.
      */}
      <span aria-hidden>
        {visible}
        {!quieto && <span className="animar-cursor ml-0.5 font-light">|</span>}
      </span>
      <span className="sr-only">{palabras.join(', ')}</span>
    </span>
  );
}
