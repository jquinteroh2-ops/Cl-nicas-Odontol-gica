/**
 * Cabecera de sección: rótulo, título, subrayado corto y descripción.
 *
 * Se repite igual en todas las secciones de la portada —es lo que hace que la
 * página se lea como una sola pieza y no como bloques pegados— y llega desde el
 * sitio de referencia, donde cada bloque abría con su rotulillo y una línea.
 */

import Revelar from '@publico/animacion/Revelar';

interface Props {
  rotulo: string;
  titulo: string;
  descripcion?: string;
  /** Sobre fondo oscuro. */
  claro?: boolean;
  /** Por defecto centrada, como en el resto de la portada. */
  alineacion?: 'centro' | 'izquierda';
}

export default function EncabezadoSeccion({
  rotulo,
  titulo,
  descripcion,
  claro = false,
  alineacion = 'centro',
}: Props) {
  const centrada = alineacion === 'centro';

  return (
    <Revelar className={centrada ? 'text-center' : ''}>
      <p
        className={`text-xs font-semibold tracking-[0.14em] uppercase ${
          claro ? 'text-petroleo-200' : 'text-petroleo-600'
        }`}
      >
        {rotulo}
      </p>

      <h2
        className={`mt-3 text-3xl font-semibold tracking-tight text-balance sm:text-4xl ${
          claro ? 'text-white' : 'text-slate-900'
        }`}
      >
        {titulo}
      </h2>

      {/* Subrayado corto: cierra el título sin necesidad de una regla de ancho completo. */}
      <span
        className={`mt-5 block h-1 w-14 rounded-full ${centrada ? 'mx-auto' : ''} ${
          claro ? 'bg-petroleo-300' : 'bg-petroleo-500'
        }`}
        aria-hidden
      />

      {descripcion && (
        <p
          className={`mt-5 text-lg leading-relaxed ${centrada ? 'mx-auto max-w-2xl' : 'max-w-2xl'} ${
            claro ? 'text-petroleo-100' : 'text-slate-600'
          }`}
        >
          {descripcion}
        </p>
      )}
    </Revelar>
  );
}
