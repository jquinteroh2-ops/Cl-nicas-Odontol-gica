/**
 * Botón único de la aplicación. Todo control accionable pasa por aquí para que
 * el tamaño táctil y el color se mantengan iguales en todas las pantallas.
 *
 * Rinde <button>, <Link> o <a> según reciba `alPulsar`, `a` o `enlaceExterno`.
 */

import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

export type VarianteBoton =
  | 'primario'
  | 'secundario'
  | 'fantasma'
  /** Sobre fondo petróleo. */
  | 'claro'
  /** Sobre fondo petróleo, contorno. */
  | 'contornoClaro';

export type TamanoBoton = 'md' | 'lg';

interface Props {
  children: ReactNode;
  variante?: VarianteBoton;
  tamano?: TamanoBoton;
  icono?: ReactNode;
  iconoDerecha?: ReactNode;
  anchoCompleto?: boolean;
  className?: string;
  /** Ruta interna. */
  a?: string;
  /** Enlace externo: abre en pestaña nueva. */
  enlaceExterno?: string;
  alPulsar?: () => void;
  deshabilitado?: boolean;
  /** Acción en curso: bloquea el botón y lo marca como ocupado para lectores de pantalla. */
  cargando?: boolean;
  tipo?: 'button' | 'submit';
  'aria-label'?: string;
}

/*
 * El hundimiento al pulsar es lo que hace que en el celular se sienta una app y
 * no una página. Va en la base para que ninguna variante se quede sin él.
 */
const BASE =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-medium tracking-tight ' +
  'transition-all duration-150 active:scale-[0.98] ' +
  'disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100';

// Nunca por debajo de 44 px de alto: es un demo que se navega con el pulgar.
const TAMANOS: Record<TamanoBoton, string> = {
  md: 'min-h-12 px-5 text-sm',
  lg: 'min-h-14 px-7 text-base',
};

const VARIANTES: Record<VarianteBoton, string> = {
  primario:
    'bg-petroleo-600 text-white shadow-suave hover:bg-petroleo-700 hover:shadow-media active:bg-petroleo-800',
  secundario:
    'bg-white text-slate-800 shadow-suave ring-1 ring-slate-200/80 hover:bg-slate-50 hover:ring-slate-300 active:bg-slate-100',
  fantasma: 'text-petroleo-700 hover:bg-petroleo-50 active:bg-petroleo-100',
  claro: 'bg-white text-petroleo-700 shadow-suave hover:bg-petroleo-50 active:bg-petroleo-100',
  contornoClaro: 'text-white ring-1 ring-white/35 hover:bg-white/10 active:bg-white/20',
};

export default function Boton({
  children,
  variante = 'primario',
  tamano = 'md',
  icono,
  iconoDerecha,
  anchoCompleto,
  className = '',
  a,
  enlaceExterno,
  alPulsar,
  deshabilitado,
  cargando,
  tipo = 'button',
  ...resto
}: Props) {
  const bloqueado = deshabilitado || cargando;
  const clases = [
    BASE,
    TAMANOS[tamano],
    VARIANTES[variante],
    anchoCompleto ? 'w-full' : '',
    cargando ? 'cursor-progress opacity-70' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  const contenido = (
    <>
      {icono}
      <span>{children}</span>
      {iconoDerecha}
    </>
  );

  if (a && !bloqueado) {
    return (
      <Link to={a} className={clases} {...resto}>
        {contenido}
      </Link>
    );
  }

  if (enlaceExterno && !bloqueado) {
    return (
      <a
        href={enlaceExterno}
        target="_blank"
        rel="noopener noreferrer"
        className={clases}
        {...resto}
      >
        {contenido}
      </a>
    );
  }

  return (
    <button
      type={tipo}
      onClick={alPulsar}
      disabled={bloqueado}
      aria-busy={cargando || undefined}
      className={clases}
      {...resto}
    >
      {contenido}
    </button>
  );
}
