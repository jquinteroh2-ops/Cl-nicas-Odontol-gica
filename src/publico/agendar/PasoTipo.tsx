/**
 * Paso 1 · ¿Qué necesitas?
 *
 * Cada tarjeta dice de antemano por qué camino va: confirmación inmediata o
 * sujeto a aprobación. El paciente tiene que entenderlo ANTES de enviar, no
 * después, que es donde se genera la frustración.
 */

import { AlertTriangle, Check, Clock, Sparkles, Stethoscope } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { TipoCita } from '@compartido/tipos';
import { DURACION_POR_TIPO } from '@compartido/disponibilidad';
import { formatoDuracion } from '@compartido/formato';
import Insignia from '@componentes/ui/Insignia';

interface OpcionTipo {
  tipo: TipoCita;
  titulo: string;
  descripcion: string;
  icono: typeof Check;
}

const OPCIONES: OpcionTipo[] = [
  {
    tipo: 'control',
    titulo: 'Control de ortodoncia',
    descripcion: 'Tu ajuste mensual de brackets.',
    icono: Check,
  },
  {
    tipo: 'valoracion',
    titulo: 'Valoración o primera vez',
    descripcion: 'Revisión inicial para saber qué necesitas.',
    icono: Stethoscope,
  },
  {
    tipo: 'procedimiento',
    titulo: 'Procedimiento',
    descripcion: 'Limpieza, resina, blanqueamiento u otro tratamiento.',
    icono: Sparkles,
  },
  {
    tipo: 'urgencia',
    titulo: 'Urgencia',
    descripcion: 'Dolor, golpe o algo que se rompió.',
    icono: AlertTriangle,
  },
];

interface Props {
  tipoElegido?: TipoCita;
  motivoConsulta: string;
  /** Recibe true cuando ese tipo se confirma solo para este paciente. */
  esInmediato: (tipo: TipoCita) => boolean;
  /** El visitante no ha iniciado sesión: ningún tipo se confirma solo. */
  sinSesion: boolean;
  alElegirTipo: (tipo: TipoCita) => void;
  alCambiarMotivo: (motivo: string) => void;
}

export default function PasoTipo({
  tipoElegido,
  motivoConsulta,
  esInmediato,
  sinSesion,
  alElegirTipo,
  alCambiarMotivo,
}: Props) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight text-slate-900 sm:text-3xl">
        ¿Qué necesitas?
      </h1>
      <p className="mt-2.5 leading-relaxed text-slate-600">
        Elige el tipo de cita para ver los horarios libres.
      </p>

      <ul className="mt-8 space-y-3.5">
        {OPCIONES.map((opcion) => {
          const Icono = opcion.icono;
          const inmediato = esInmediato(opcion.tipo);
          const elegido = tipoElegido === opcion.tipo;

          return (
            <li key={opcion.tipo}>
              <button
                type="button"
                onClick={() => alElegirTipo(opcion.tipo)}
                aria-pressed={elegido}
                className={`flex w-full items-start gap-4 rounded-3xl p-5 text-left transition-all ${
                  elegido
                    ? 'bg-petroleo-50/60 shadow-media ring-2 ring-petroleo-600'
                    : 'bg-white shadow-suave ring-1 ring-slate-200/70 hover:shadow-media hover:ring-slate-300/70'
                }`}
              >
                <span
                  className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl transition-colors ${
                    elegido ? 'bg-petroleo-600 text-white' : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  <Icono className="h-5 w-5" aria-hidden strokeWidth={1.5} />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block font-semibold tracking-tight text-slate-900">
                    {opcion.titulo}
                  </span>
                  <span className="mt-1 block text-sm leading-relaxed text-slate-600">
                    {opcion.descripcion}
                  </span>

                  <span className="mt-3.5 flex flex-wrap items-center gap-2">
                    {inmediato ? (
                      <Insignia tono="verde" icono={<Check className="h-3 w-3" aria-hidden />}>
                        Confirmación inmediata
                      </Insignia>
                    ) : (
                      <Insignia tono="ambar" icono={<Clock className="h-3 w-3" aria-hidden />}>
                        Sujeto a aprobación
                      </Insignia>
                    )}
                    <span className="text-xs text-slate-400">
                      {formatoDuracion(DURACION_POR_TIPO[opcion.tipo])}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {sinSesion && (
        <p className="mt-5 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-600">
          ¿Ya eres paciente con ortodoncia?{' '}
          <Link to="/ingresar" className="font-medium text-petroleo-700 underline underline-offset-4">
            Entra a tu portal
          </Link>{' '}
          y tu control mensual queda confirmado al instante, sin esperar respuesta.
        </p>
      )}

      <div className="mt-8">
        <label htmlFor="motivo" className="block text-sm font-medium text-slate-700">
          ¿Quieres contarnos algo más? <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        {/* Mismo relleno y mismo radio que CampoTexto: los dos controles del paso tienen que verse hermanos. */}
        <textarea
          id="motivo"
          rows={3}
          value={motivoConsulta}
          onChange={(evento) => alCambiarMotivo(evento.target.value)}
          maxLength={300}
          placeholder="Por ejemplo: se me despicó una resina de adelante."
          className="mt-2 block w-full resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3.5 text-base text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-petroleo-600"
        />
      </div>
    </div>
  );
}
