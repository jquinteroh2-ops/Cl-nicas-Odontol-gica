/**
 * Avance del tratamiento.
 *
 * En ortodoncia el paciente vive pendiente de una sola pregunta: cuánto me
 * falta. La barra responde eso de un vistazo; el resto es contexto. El mes se
 * limita al total estimado para que un tratamiento que se alargó no dibuje una
 * barra imposible ni diga "mes 20 de 18".
 */

import { Sparkles } from 'lucide-react';
import type { Tratamiento } from '@compartido/tipos';
import {
  ETIQUETA_TIPO_TRATAMIENTO,
  formatoFechaLarga,
  mesDeTratamiento,
} from '@compartido/formato';
import Tarjeta from '@componentes/ui/Tarjeta';

interface Props {
  tratamiento: Tratamiento;
  nombreProfesional?: string;
}

export default function ProgresoTratamiento({ tratamiento, nombreProfesional }: Props) {
  const total = tratamiento.duracionEstimadaMeses;
  const mes = Math.min(Math.max(mesDeTratamiento(tratamiento.fechaInicio), 1), total);
  const porcentaje = Math.round((mes / total) * 100);
  const faltan = total - mes;

  return (
    <Tarjeta as="section" className="p-6">
      <div className="flex items-center gap-3.5">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-petroleo-50 text-petroleo-600 ring-1 ring-inset ring-petroleo-600/10">
          <Sparkles className="h-5 w-5" aria-hidden strokeWidth={1.5} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold leading-tight tracking-tight text-slate-900">
            {ETIQUETA_TIPO_TRATAMIENTO[tratamiento.tipo]}
          </h2>
          {nombreProfesional && (
            <p className="mt-0.5 truncate text-sm text-slate-500">Con {nombreProfesional}</p>
          )}
        </div>
      </div>

      <div className="mt-7">
        {/* El mes va grande y el total en tenue: la pregunta es "por dónde voy", no "cuántos son". */}
        <div className="flex items-end justify-between gap-3">
          <p className="text-2xl font-semibold leading-none tracking-tight text-slate-900">
            Mes {mes} <span className="text-base font-medium text-slate-400">de {total}</span>
          </p>
          <p className="text-sm leading-none text-slate-500">
            {faltan === 0 ? 'Última etapa' : faltan === 1 ? 'Falta 1 mes' : `Faltan ${faltan} meses`}
          </p>
        </div>

        {/*
          Barra fina y con degradado: una barra gruesa de color plano es lo que
          delata la plantilla. El relleno se redondea por sí solo para que el
          extremo no quede cortado en seco cuando el avance es corto.
        */}
        <div
          className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={porcentaje}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avance del tratamiento"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-petroleo-400 to-petroleo-600 transition-[width] duration-700 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
      </div>

      <p className="mt-6 border-t border-slate-100/80 pt-4 text-sm text-slate-500">
        Iniciado el {formatoFechaLarga(tratamiento.fechaInicio)}.
      </p>
    </Tarjeta>
  );
}
