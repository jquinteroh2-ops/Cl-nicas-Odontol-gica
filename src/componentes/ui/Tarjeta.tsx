/**
 * Superficie base: esquinas amplias, borde casi invisible y una sombra muy
 * tenue. La tarjeta se separa del fondo por elevación, no por contorno — un
 * borde marcado es lo que hace que una interfaz se vea barata.
 */

import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  /** Realza la tarjeta cuando es la pieza principal de la pantalla. */
  destacada?: boolean;
  as?: 'div' | 'section' | 'article' | 'li';
}

export default function Tarjeta({ children, className = '', destacada, as = 'div' }: Props) {
  const Elemento = as;
  return (
    <Elemento
      className={`rounded-3xl bg-white ${
        destacada
          ? 'shadow-media ring-1 ring-petroleo-200/60'
          : 'shadow-suave ring-1 ring-slate-200/70'
      } ${className}`}
    >
      {children}
    </Elemento>
  );
}
