/**
 * Estado de cuenta del paciente.
 *
 * El portal no cobra ni recibe pagos: en esta clínica se paga en caja o por
 * transferencia y la secretaria lo registra. Así que la pantalla es de consulta,
 * y lo único accionable es escribirle a la clínica. Decirlo explícitamente evita
 * que alguien busque un botón de pagar que no existe.
 */

import { CalendarClock, MessageCircle, TriangleAlert, Wallet } from 'lucide-react';
import { useUsuario } from '@compartido/auth';
import { enlaceWhatsApp } from '@compartido/clinica';
import { useConsulta } from '@compartido/contexto';
import {
  ETIQUETA_TIPO_TRATAMIENTO,
  formatoCOP,
  formatoDiaRelativo,
  formatoFechaLarga,
} from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';
import Esqueleto from '@componentes/ui/Esqueleto';
import EstadoVacio from '@componentes/ui/EstadoVacio';
import Tarjeta from '@componentes/ui/Tarjeta';
import PlanDePagos from '@paciente/cuenta/PlanDePagos';
import { resumirCuotas } from '@paciente/cuenta/resumenCuotas';

export default function EstadoCuenta() {
  const usuario = useUsuario();
  const pacienteId = usuario?.pacienteId ?? '';

  const tratamiento = useConsulta(() => api.obtenerTratamientoActivo(pacienteId), [pacienteId]);
  const tratamientoId = tratamiento.datos?.id ?? '';
  const cuotas = useConsulta(
    () => (tratamientoId ? api.obtenerCuotas(tratamientoId) : Promise.resolve([])),
    [tratamientoId],
  );

  if (tratamiento.cargando || (tratamientoId && cuotas.cargando)) {
    return (
      <div className="space-y-8">
        <Esqueleto className="h-56 w-full rounded-3xl" />
        <Esqueleto className="h-72 w-full rounded-3xl" />
      </div>
    );
  }

  if (!tratamiento.datos) {
    return (
      <Tarjeta>
        <EstadoVacio
          icono={<Wallet className="h-6 w-6" aria-hidden strokeWidth={1.5} />}
          titulo="No tienes un plan de pagos activo"
          descripcion="Cuando inicies un tratamiento, aquí vas a ver tus cuotas, lo que llevas pagado y lo que falta."
          accion={
            <Boton a="/portal" variante="secundario">
              Volver a mis citas
            </Boton>
          }
        />
      </Tarjeta>
    );
  }

  const resumen = resumirCuotas(cuotas.datos ?? []);
  const porcentajePagado = resumen.total > 0 ? Math.round((resumen.pagado / resumen.total) * 100) : 0;

  return (
    <div className="space-y-8">
      <Tarjeta destacada as="section" className="p-6">
        <p className="rotulo">{ETIQUETA_TIPO_TRATAMIENTO[tratamiento.datos.tipo]}</p>

        <p className="mt-5 text-sm text-slate-500">Te falta por pagar</p>
        <p className="cifra mt-1">{formatoCOP(resumen.saldo)}</p>

        {/* La barra y su pie van juntos: el número de cuotas es la lectura de la barra, no un dato suelto. */}
        <div
          className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100"
          role="progressbar"
          aria-valuenow={porcentajePagado}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Porcentaje pagado del tratamiento"
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-[width] duration-700 ease-out"
            style={{ width: `${porcentajePagado}%` }}
          />
        </div>

        <p className="mt-3 text-sm text-slate-500">
          Llevas {resumen.cuotasPagadas} de {resumen.cuotasTotales} cuotas.
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-inset ring-slate-200/60">
            <dt className="text-xs text-slate-500">Ya pagaste</dt>
            <dd className="mt-1.5 text-base font-semibold tabular-nums text-emerald-700">
              {formatoCOP(resumen.pagado)}
            </dd>
          </div>
          <div className="rounded-2xl bg-slate-50 px-4 py-4 ring-1 ring-inset ring-slate-200/60">
            <dt className="text-xs text-slate-500">Valor total</dt>
            <dd className="mt-1.5 text-base font-semibold tabular-nums text-slate-800">
              {formatoCOP(resumen.total)}
            </dd>
          </div>
        </dl>
      </Tarjeta>

      {resumen.vencidas.length > 0 ? (
        <section className="flex items-start gap-4 rounded-3xl bg-red-50/70 p-6 ring-1 ring-inset ring-red-600/15">
          <span
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-red-600 shadow-suave"
            aria-hidden
          >
            <TriangleAlert className="h-5 w-5" strokeWidth={1.5} />
          </span>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold tracking-tight text-red-900">
              {resumen.vencidas.length === 1
                ? 'Tienes una cuota vencida'
                : `Tienes ${resumen.vencidas.length} cuotas vencidas`}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-red-800/90">
              Suman {formatoCOP(resumen.vencidas.reduce((total, c) => total + c.valor, 0))}. Puedes
              pagarlas en la clínica el día de tu control o por transferencia.
            </p>
          </div>
        </section>
      ) : (
        resumen.proxima && (
          <section className="flex items-start gap-4 rounded-3xl bg-amber-50/70 p-6 ring-1 ring-inset ring-amber-600/15">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white text-amber-600 shadow-suave"
              aria-hidden
            >
              <CalendarClock className="h-5 w-5" strokeWidth={1.5} />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold tracking-tight text-balance text-amber-900">
                Próxima cuota · {formatoCOP(resumen.proxima.valor)}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-amber-900/90">
                Vence el {formatoFechaLarga(resumen.proxima.fechaVencimiento)} (
                {formatoDiaRelativo(resumen.proxima.fechaVencimiento)}).
              </p>
            </div>
          </section>
        )
      )}

      <PlanDePagos cuotas={cuotas.datos ?? []} />

      <Tarjeta className="p-6">
        <p className="text-sm leading-relaxed text-slate-600">
          Los pagos se registran en la clínica. Si ya pagaste y todavía aparece pendiente, escríbenos
          y lo revisamos.
        </p>
        <Boton
          variante="secundario"
          anchoCompleto
          className="mt-5"
          icono={<MessageCircle className="h-4 w-4" aria-hidden />}
          enlaceExterno={enlaceWhatsApp('Hola, tengo una duda con mi estado de cuenta.')}
        >
          Escribir a la clínica
        </Boton>
      </Tarjeta>
    </div>
  );
}
