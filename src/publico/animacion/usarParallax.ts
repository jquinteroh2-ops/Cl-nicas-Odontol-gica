/**
 * Parallax de fondo: la imagen se mueve más despacio que la página.
 *
 * No se usa `background-attachment: fixed` —el recurso clásico— porque en iOS
 * simplemente no funciona y en Android da tirones. Aquí se escribe una variable
 * CSS en la sección y la capa de fondo la aplica con `translate3d`, que el
 * navegador resuelve en el compositor.
 *
 * Devuelve la referencia que hay que poner en la sección contenedora.
 */

import { useEffect, useRef } from 'react';
import { prefiereMenosMovimiento } from './preferencias';

export default function usarParallax<T extends HTMLElement = HTMLElement>(intensidad = 0.18) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const nodo = ref.current;
    if (!nodo || prefiereMenosMovimiento()) return;

    let pendiente = false;

    const actualizar = () => {
      pendiente = false;
      const caja = nodo.getBoundingClientRect();
      // Distancia entre el centro de la sección y el centro de la ventana: vale
      // cero cuando la banda está centrada, y crece con signo al alejarse.
      const desfase = caja.top + caja.height / 2 - window.innerHeight / 2;
      nodo.style.setProperty('--parallax', `${(-desfase * intensidad).toFixed(1)}px`);
    };

    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(actualizar);
    };

    actualizar();
    window.addEventListener('scroll', alDesplazar, { passive: true });
    window.addEventListener('resize', alDesplazar);
    return () => {
      window.removeEventListener('scroll', alDesplazar);
      window.removeEventListener('resize', alDesplazar);
    };
  }, [intensidad]);

  return ref;
}
