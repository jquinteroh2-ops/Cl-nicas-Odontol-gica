/**
 * Los números de arriba del panel.
 *
 * Cuatro como máximo y siempre los mismos cuatro: un tablero que cambia de
 * forma según el día no se aprende nunca. El dinero solo aparece para quien
 * tiene `ver_cartera`, así que la secretaria ve tres.
 */

import type { ReactNode } from 'react';
import { CalendarDays, CircleAlert, Inbox, Smile } from 'lucide-react';
import { useUsuario } from '@compartido/auth';
import { useConsulta } from '@compartido/contexto';
import { formatoCOP } from '@compartido/formato';
import { profesionalVisible, puede } from '@compartido/permisos';
import * as api from '@compartido/mockApi';
import Esqueleto from '@componentes/ui/Esqueleto';

interface PropsIndicador {
  icono: ReactNode;
  rotulo: string;
  valor: string;
  nota?: string;
  /** Tiñe la cifra cuando el número exige actuar. */
  alerta?: boolean;
}

function Indicador({ icono, rotulo, valor, nota, alerta }: PropsIndicador) {
  return (
    <div className="rounded-3xl bg-white p-5 shadow-suave ring-1 ring-slate-200/70">
      <span
        className={`grid h-9 w-9 place-items-center rounded-2xl ${
          alerta ? 'bg-red-50 text-red-600' : 'bg-petroleo-50 text-petroleo-600'
        }`}
        aria-hidden
      >
        {icono}
      </span>
      <p className="rotulo mt-4">{rotulo}</p>
      <p className={`cifra mt-1 ${alerta ? 'text-red-700' : ''}`}>{valor}</p>
      {nota && <p className="mt-1 text-xs text-slate-500">{nota}</p>}
    </div>
  );
}

export default function RejillaIndicadores() {
  const usuario = useUsuario();
  const soloMio = profesionalVisible(usuario);
  const verDinero = puede(usuario, 'ver_cartera');

  const consulta = useConsulta(() => api.obtenerIndicadores(soloMio), [soloMio]);

  if (consulta.cargando) {
    return (
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((indice) => (
          <Esqueleto key={indice} className="h-36 w-full rounded-3xl" />
        ))}
      </div>
    );
  }

  const datos = consulta.datos;
  if (!datos) return null;

  const sinConfirmar = datos.citasHoy - datos.citasHoyConfirmadas;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <Indicador
        icono={<CalendarDays className="h-4.5 w-4.5" aria-hidden />}
        rotulo={soloMio ? 'Mis citas hoy' : 'Citas hoy'}
        valor={String(datos.citasHoy)}
        nota={
          datos.citasHoy === 0
            ? 'Sin citas agendadas'
            : sinConfirmar > 0
              ? `${sinConfirmar} sin confirmar`
              : 'Todas confirmadas'
        }
      />

      <Indicador
        icono={<Inbox className="h-4.5 w-4.5" aria-hidden />}
        rotulo="Por resolver"
        valor={String(datos.solicitudesPendientes)}
        nota={datos.solicitudesPendientes === 0 ? 'Bandeja vacía' : 'Esperan respuesta'}
        alerta={datos.solicitudesPendientes > 0}
      />

      <Indicador
        icono={<Smile className="h-4.5 w-4.5" aria-hidden />}
        rotulo="Ortodoncias"
        valor={String(datos.ortodonciasActivas)}
        nota="Tratamientos activos"
      />

      {verDinero && (
        <Indicador
          icono={<CircleAlert className="h-4.5 w-4.5" aria-hidden />}
          rotulo="Cartera vencida"
          valor={formatoCOP(datos.montoVencido)}
          nota={
            datos.cuotasVencidas === 1 ? '1 cuota vencida' : `${datos.cuotasVencidas} cuotas vencidas`
          }
          alerta={datos.montoVencido > 0}
        />
      )}
    </div>
  );
}
