/**
 * Lista de citas del paciente.
 *
 * Sirve para las dos listas de la portada —las que vienen y las que ya pasaron—
 * porque la fila es idéntica y lo único que cambia es el título y si conviene
 * plegarla. Separarlas importa: una cita futura metida en "historial" hace dudar
 * de si ya pasó, que es justo lo que el portal debe dejar claro.
 *
 * Las notas clínicas nunca se muestran, aunque viajen en el mismo objeto Cita:
 * son de la clínica, no del portal.
 */

import { useState, type ReactNode } from 'react';
import type { Cita } from '@compartido/tipos';
import {
  ETIQUETA_ESTADO_CITA,
  ETIQUETA_TIPO_CITA,
  formatoFechaConDia,
  formatoHora,
} from '@compartido/formato';
import EstadoVacio from '@componentes/ui/EstadoVacio';
import Insignia, { type TonoInsignia } from '@componentes/ui/Insignia';
import Tarjeta from '@componentes/ui/Tarjeta';

const TONO_ESTADO: Record<Cita['estado'], TonoInsignia> = {
  confirmada: 'petroleo',
  asistio: 'verde',
  no_asistio: 'rojo',
  cancelada: 'neutro',
};

const VISIBLES_AL_INICIO = 4;

interface Props {
  titulo: string;
  icono: ReactNode;
  citas: Cita[];
  nombrePorProfesional: Record<string, string>;
  /** Pliega el resto tras las primeras cuatro. */
  plegable?: boolean;
  /** Sin esto, la sección desaparece cuando no hay citas. */
  vacio?: { icono: ReactNode; titulo: string; descripcion: string };
}

export default function ListaCitas({
  titulo,
  icono,
  citas,
  nombrePorProfesional,
  plegable,
  vacio,
}: Props) {
  const [expandido, setExpandido] = useState(false);

  if (citas.length === 0 && !vacio) return null;

  const visibles = plegable && !expandido ? citas.slice(0, VISIBLES_AL_INICIO) : citas;
  const ocultas = citas.length - visibles.length;

  return (
    <section>
      {/* El icono acompaña al título en tenue: marca la sección sin robarle peso. */}
      <h2 className="flex items-center gap-2.5 px-1 text-xl font-semibold tracking-tight text-slate-900">
        <span className="text-slate-400">{icono}</span>
        {titulo}
      </h2>

      <Tarjeta className="mt-4 overflow-hidden">
        {citas.length === 0 && vacio ? (
          <EstadoVacio icono={vacio.icono} titulo={vacio.titulo} descripcion={vacio.descripcion} />
        ) : (
          <>
            <ul className="divide-y divide-slate-100/80">
              {visibles.map((cita) => (
                <li key={cita.id} className="flex items-start justify-between gap-3 px-6 py-4">
                  <div className="min-w-0">
                    <p className="text-base font-medium leading-snug text-slate-800">
                      {formatoFechaConDia(cita.fechaHora)}, {formatoHora(cita.fechaHora)}
                    </p>
                    {/*
                      Sin `truncate`: a 390 px "Control de ortodoncia · Dra.
                      Yuranis Meza Pájaro" no cabe en una línea y se cortaba
                      justo por el nombre, dejando un "Dra. …" que no dice nada.
                      Envolver en dos líneas cuesta unos píxeles de alto y
                      conserva el dato.
                    */}
                    <p className="mt-1 text-sm leading-snug text-slate-500">
                      {ETIQUETA_TIPO_CITA[cita.tipo]}
                      {nombrePorProfesional[cita.profesionalId] && (
                        <> · {nombrePorProfesional[cita.profesionalId]}</>
                      )}
                    </p>
                  </div>
                  <Insignia tono={TONO_ESTADO[cita.estado]} className="mt-0.5 shrink-0">
                    {ETIQUETA_ESTADO_CITA[cita.estado]}
                  </Insignia>
                </li>
              ))}
            </ul>

            {plegable && (ocultas > 0 || expandido) && (
              <button
                type="button"
                onClick={() => setExpandido((valor) => !valor)}
                className="w-full border-t border-slate-100/80 px-6 py-4 text-sm font-medium text-petroleo-700 transition-colors hover:bg-petroleo-50"
              >
                {expandido
                  ? 'Ver menos'
                  : ocultas === 1
                    ? 'Ver la cita anterior'
                    : `Ver las ${ocultas} anteriores`}
              </button>
            )}
          </>
        )}
      </Tarjeta>
    </section>
  );
}
