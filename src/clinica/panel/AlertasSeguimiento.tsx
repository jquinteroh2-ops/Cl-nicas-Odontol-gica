/**
 * Lo que se pierde si nadie mira: pacientes que dejaron de venir y cuotas
 * vencidas.
 *
 * Un paciente de ortodoncia que no vuelve no genera ninguna alarma por sí solo
 * —no cancela, simplemente deja de aparecer— y para cuando alguien lo nota ya
 * acumuló meses sin pagar. Esta sección es la respuesta a eso, y por eso cada
 * fila trae la acción al lado: recordarle por WhatsApp en el momento.
 */

import { useState } from 'react';
import { CircleAlert, HeartHandshake, Send } from 'lucide-react';
import type { Notificacion, Paciente } from '@compartido/tipos';
import { useUsuario } from '@compartido/auth';
import { useAccion, useConsulta } from '@compartido/contexto';
import { formatoCOP, formatoMes, nombreCompleto } from '@compartido/formato';
import { puede } from '@compartido/permisos';
import * as api from '@compartido/mockApi';
import Esqueleto from '@componentes/ui/Esqueleto';
import Hoja from '@componentes/ui/Hoja';
import Tarjeta from '@componentes/ui/Tarjeta';
import VistaPreviaWhatsApp from './VistaPreviaWhatsApp';

interface Enviado {
  notificacion: Notificacion;
  paciente: Paciente;
}

export default function AlertasSeguimiento() {
  const usuario = useUsuario();
  const verDinero = puede(usuario, 'ver_cartera');
  const [enviado, setEnviado] = useState<Enviado | null>(null);

  const recordar = useAccion(api.crearRecordatorio);

  const sinControl = useConsulta(api.obtenerPacientesSinControl, []);
  const vencidas = useConsulta(
    async () => (verDinero ? api.obtenerCuotasVencidas() : []),
    [verDinero],
  );

  async function enviarRecordatorio(paciente: Paciente) {
    const notificacion = await recordar.ejecutar(paciente.id);
    if (notificacion) setEnviado({ notificacion, paciente });
  }

  const cargando = sinControl.cargando || vencidas.cargando;
  const listaSinControl = sinControl.datos ?? [];
  const listaVencidas = vencidas.datos ?? [];

  if (cargando) {
    return <Esqueleto className="h-48 w-full rounded-3xl" />;
  }

  // Sin nada que avisar, la sección desaparece: un bloque vacío permanente
  // enseña a la gente a ignorar esa zona de la pantalla.
  if (listaSinControl.length === 0 && listaVencidas.length === 0) return null;

  return (
    <section>
      <p className="rotulo">Requieren seguimiento</p>
      <h2 className="mb-4 mt-1 text-xl font-semibold tracking-tight text-slate-900">
        Atención
      </h2>

      <div className="grid gap-4 lg:grid-cols-2">
        {listaSinControl.length > 0 && (
          <Tarjeta className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-amber-50 text-amber-700" aria-hidden>
                <HeartHandshake className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold tracking-tight text-slate-900">Sin control</p>
                <p className="text-xs text-slate-500">
                  Ortodoncia activa y ninguna cita futura
                </p>
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              {listaSinControl.slice(0, 5).map(({ paciente, diasSinControl, cuotasVencidas }) => (
                <li key={paciente.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">
                      {nombreCompleto(paciente)}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {diasSinControl} días sin venir
                      {cuotasVencidas > 0 &&
                        ` · ${cuotasVencidas} ${cuotasVencidas === 1 ? 'cuota vencida' : 'cuotas vencidas'}`}
                    </span>
                  </span>

                  <button
                    type="button"
                    disabled={recordar.enCurso}
                    onClick={() => enviarRecordatorio(paciente)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-50 px-3 text-xs font-medium text-slate-700 ring-1 ring-slate-200/70 transition-colors hover:bg-petroleo-50 hover:text-petroleo-700 disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" aria-hidden />
                    Recordar
                  </button>
                </li>
              ))}
            </ul>

            {listaSinControl.length > 5 && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                y {listaSinControl.length - 5} más
              </p>
            )}
          </Tarjeta>
        )}

        {verDinero && listaVencidas.length > 0 && (
          <Tarjeta className="overflow-hidden">
            <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-4">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl bg-red-50 text-red-600" aria-hidden>
                <CircleAlert className="h-4.5 w-4.5" />
              </span>
              <div className="min-w-0">
                <p className="font-semibold tracking-tight text-slate-900">Cuotas vencidas</p>
                <p className="text-xs text-slate-500">Ordenadas por días de mora</p>
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              {listaVencidas.slice(0, 5).map(({ cuota, paciente, diasMora }) => (
                <li key={cuota.id} className="flex items-center gap-3 px-5 py-3.5">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-900">
                      {nombreCompleto(paciente)}
                    </span>
                    <span className="block text-sm text-slate-500">
                      {formatoMes(cuota.mesCorrespondiente)} · {diasMora} días
                    </span>
                  </span>
                  <span className="shrink-0 text-sm font-semibold tabular-nums text-red-700">
                    {formatoCOP(cuota.valor)}
                  </span>
                </li>
              ))}
            </ul>

            {listaVencidas.length > 5 && (
              <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-500">
                y {listaVencidas.length - 5} más
              </p>
            )}
          </Tarjeta>
        )}
      </div>

      {enviado && (
        <Hoja
          titulo="Recordatorio enviado"
          descripcion={nombreCompleto(enviado.paciente)}
          alCerrar={() => setEnviado(null)}
        >
          <VistaPreviaWhatsApp
            notificacion={enviado.notificacion}
            paciente={enviado.paciente}
          />
        </Hoja>
      )}
    </section>
  );
}
