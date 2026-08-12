/**
 * Elección de las dos alternativas que se le ofrecen al paciente.
 *
 * Solo muestra franjas realmente libres —las mismas que vería el paciente al
 * agendar— para que la clínica no pueda proponer un horario que ya está
 * ocupado. La selección se conserva al cambiar de día: las dos opciones casi
 * nunca caen en la misma fecha.
 */

import { useMemo, useState } from 'react';
import { addMonths, format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { TipoCita } from '@compartido/tipos';
import { useConsulta } from '@compartido/contexto';
import { aFecha, formatoFecha, formatoHora } from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Esqueleto, { EsqueletoFranjas } from '@componentes/ui/Esqueleto';

const MAXIMO = 2;

interface Props {
  tipo: TipoCita;
  pacienteId?: string;
  /** ISO 8601, como máximo dos. */
  seleccion: string[];
  alCambiar: (horarios: string[]) => void;
}

export default function SelectorHorarios({ tipo, pacienteId, seleccion, alCambiar }: Props) {
  const [diaActivo, setDiaActivo] = useState<string | null>(null);

  // Dos meses: una solicitud de fin de mes no puede quedarse sin alternativas.
  const consultaDias = useConsulta(async () => {
    const ahora = new Date();
    const [esteMes, siguiente] = await Promise.all([
      api.obtenerDiasDisponibles(ahora, tipo, pacienteId),
      api.obtenerDiasDisponibles(addMonths(ahora, 1), tipo, pacienteId),
    ]);
    return [...esteMes, ...siguiente];
  }, [tipo, pacienteId]);

  const dias = useMemo(() => (consultaDias.datos ?? []).slice(0, 14), [consultaDias.datos]);
  const dia = diaActivo ?? dias[0] ?? null;

  const consultaFranjas = useConsulta(async () => {
    if (!dia) return [];
    return api.obtenerFranjasDisponibles(aFecha(dia), tipo, pacienteId);
  }, [dia, tipo, pacienteId]);

  function alternar(inicio: string) {
    if (seleccion.includes(inicio)) {
      alCambiar(seleccion.filter((h) => h !== inicio));
      return;
    }
    // Al llegar al tope, la nueva desplaza a la más antigua en vez de no hacer nada.
    alCambiar(seleccion.length < MAXIMO ? [...seleccion, inicio] : [...seleccion.slice(1), inicio]);
  }

  if (consultaDias.cargando) {
    return (
      <div className="space-y-4">
        <Esqueleto className="h-14 w-full" />
        <EsqueletoFranjas cantidad={6} />
      </div>
    );
  }

  if (dias.length === 0) {
    return (
      <p className="rounded-2xl bg-amber-50/70 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-600/15">
        No hay cupos libres en las próximas semanas. Puedes rechazar la solicitud explicando el
        motivo y coordinar por WhatsApp.
      </p>
    );
  }

  return (
    <div>
      {/* Tira de días con desplazamiento horizontal: en celular no caben de otra forma. */}
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
        {dias.map((clave) => {
          const fecha = aFecha(clave);
          const activo = clave === dia;
          const elegidasAqui = seleccion.filter((h) => h.slice(0, 10) === clave).length;
          return (
            <button
              key={clave}
              type="button"
              onClick={() => setDiaActivo(clave)}
              aria-pressed={activo}
              className={`relative flex shrink-0 flex-col items-center rounded-2xl px-3.5 py-2.5 transition-all ${
                activo
                  ? 'bg-petroleo-600 text-white shadow-suave'
                  : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/70 hover:bg-slate-100'
              }`}
            >
              <span className={`text-[11px] uppercase ${activo ? 'text-white/70' : 'text-slate-400'}`}>
                {format(fecha, 'EEE', { locale: es })}
              </span>
              <span className="text-sm font-semibold tabular-nums">{format(fecha, 'd MMM', { locale: es })}</span>
              {elegidasAqui > 0 && (
                <span
                  className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-emerald-500 text-[10px] font-bold text-white"
                  aria-hidden
                >
                  {elegidasAqui}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-4">
        {consultaFranjas.cargando ? (
          <EsqueletoFranjas cantidad={6} />
        ) : (consultaFranjas.datos ?? []).length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-500">
            Ese día ya no tiene cupos libres.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
            {(consultaFranjas.datos ?? []).map((franja) => {
              const elegida = seleccion.includes(franja.inicio);
              return (
                <button
                  key={franja.inicio}
                  type="button"
                  onClick={() => alternar(franja.inicio)}
                  aria-pressed={elegida}
                  className={`min-h-12 rounded-2xl px-2 text-sm font-medium tabular-nums transition-all active:scale-[0.97] ${
                    elegida
                      ? 'bg-petroleo-600 text-white shadow-suave'
                      : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/70 hover:bg-slate-100'
                  }`}
                >
                  {formatoHora(franja.inicio)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-3 ring-1 ring-slate-200/70">
        <p className="rotulo">Se le ofrecerán</p>
        {seleccion.length === 0 ? (
          <p className="mt-1.5 text-sm text-slate-500">
            Elige {MAXIMO} horarios. Aún no has escogido ninguno.
          </p>
        ) : (
          <ol className="mt-2 space-y-1.5">
            {[...seleccion]
              .sort()
              .map((horario, indice) => (
                <li key={horario} className="flex items-baseline gap-2 text-sm text-slate-700">
                  <span className="font-semibold text-petroleo-700">{indice + 1}.</span>
                  <span>
                    {formatoFecha(horario)} · {formatoHora(horario)}
                  </span>
                </li>
              ))}
          </ol>
        )}
      </div>
    </div>
  );
}
