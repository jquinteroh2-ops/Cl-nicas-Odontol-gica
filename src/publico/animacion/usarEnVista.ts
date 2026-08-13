/**
 * Avisa cuando un elemento entra en pantalla. Es la base de todo lo que se
 * anima al bajar: revelados, contadores y barras.
 *
 * Se usa un observador y no el evento `scroll` porque el observador no obliga al
 * navegador a medir el diseño en cada píxel de desplazamiento; con veinte
 * tarjetas en la página, esa diferencia es la que separa un scroll fluido de uno
 * a tirones en un celular de gama media.
 */

import { useEffect, useRef, useState } from 'react';

interface Opciones {
  /**
   * Cuánto debe asomar el elemento para contarlo como visible. El recorte
   * inferior por defecto hace que la animación arranque cuando la pieza ya subió
   * un poco, no en el instante en que roza el borde: así se ve entrar, en vez de
   * aparecer ya hecha al fondo de la pantalla.
   */
  margen?: string;
  /** Vuelve a animar cada vez que reaparece. Por defecto ocurre una sola vez. */
  repetir?: boolean;
}

export default function usarEnVista<T extends HTMLElement = HTMLDivElement>({
  margen = '0px 0px -10% 0px',
  repetir = false,
}: Opciones = {}) {
  const ref = useRef<T | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo) return;

    // Sin soporte del observador, el contenido se muestra tal cual: nunca puede
    // quedar invisible por culpa de un efecto decorativo.
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) {
            setVisible(true);
            if (!repetir) observador.disconnect();
          } else if (repetir) {
            setVisible(false);
          }
        }
      },
      { rootMargin: margen, threshold: 0.01 },
    );

    observador.observe(nodo);
    return () => observador.disconnect();
  }, [margen, repetir]);

  return { ref, visible };
}
