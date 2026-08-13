/**
 * Marca en el menú la sección que se está mirando.
 *
 * El recorte de arriba y abajo deja activa una franja estrecha en mitad de la
 * pantalla: así la sección cambia cuando su contenido ocupa el centro de la
 * vista, y no en cuanto asoma un píxel por el borde inferior.
 */

import { useEffect, useState } from 'react';

export default function usarSeccionActiva(ids: string[], activo = true): string {
  const [actual, setActual] = useState('');

  useEffect(() => {
    if (!activo || typeof IntersectionObserver === 'undefined') {
      setActual('');
      return;
    }

    const nodos = ids
      .map((id) => document.getElementById(id))
      .filter((nodo): nodo is HTMLElement => nodo !== null);

    if (nodos.length === 0) return;

    const observador = new IntersectionObserver(
      (entradas) => {
        for (const entrada of entradas) {
          if (entrada.isIntersecting) setActual(entrada.target.id);
        }
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
    );

    for (const nodo of nodos) observador.observe(nodo);
    return () => observador.disconnect();
  }, [ids, activo]);

  return actual;
}
