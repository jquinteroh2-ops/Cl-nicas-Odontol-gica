/**
 * Envuelve cualquier bloque para que entre al aparecer en pantalla.
 *
 * El estado escondido y la transición viven en `index.css`; aquí solo se marca
 * el atributo. Escalonar una rejilla es darle a cada tarjeta un `retardo` mayor
 * que la anterior —el mismo recurso del sitio de referencia, que iba poniendo
 * `data-wow-delay` de 0.1s en 0.1s.
 */

import type { CSSProperties, ReactNode } from 'react';
import usarEnVista from './usarEnVista';

export type DireccionRevelado = 'abajo' | 'izquierda' | 'derecha' | 'escala';

/** Etiquetas admitidas: las justas para no romper listas ni semántica. */
type Etiqueta = 'div' | 'section' | 'article' | 'li' | 'span' | 'p';

interface Props {
  children: ReactNode;
  /** Desde dónde entra. `abajo` es el que se usa en casi toda la página. */
  desde?: DireccionRevelado;
  /** Retardo en milisegundos, para escalonar grupos. */
  retardo?: number;
  className?: string;
  as?: Etiqueta;
}

export default function Revelar({
  children,
  desde = 'abajo',
  retardo = 0,
  className = '',
  as = 'div',
}: Props) {
  const { ref, visible } = usarEnVista<HTMLDivElement>();

  // Todas las etiquetas admitidas aceptan `ref` y `className`; el tipo se fija
  // en `div` para no arrastrar una firma genérica por media aplicación.
  const Elemento = as as 'div';

  return (
    <Elemento
      ref={ref}
      data-revelar={desde}
      data-visible={visible ? 'si' : 'no'}
      style={retardo ? ({ '--retardo': `${retardo}ms` } as CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Elemento>
  );
}
