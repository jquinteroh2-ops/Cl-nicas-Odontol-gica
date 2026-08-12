/**
 * Cuentas del estado de cuenta.
 *
 * Vive aparte porque las mismas cifras se muestran en dos sitios —el resumen del
 * portal y la pantalla de cuenta— y dos versiones del mismo cálculo terminarían
 * dando números distintos en la misma pantalla.
 */

import type { Cuota } from '@compartido/tipos';
import { aFecha } from '@compartido/formato';

export interface ResumenCuotas {
  total: number;
  pagado: number;
  saldo: number;
  cuotasPagadas: number;
  cuotasTotales: number;
  /** La primera sin pagar por fecha de vencimiento. */
  proxima: Cuota | null;
  vencidas: Cuota[];
  /** Sin cuotas por pagar. */
  alDia: boolean;
}

export function resumirCuotas(cuotas: Cuota[]): ResumenCuotas {
  const pagadas = cuotas.filter((c) => c.estado === 'pagada');
  const pendientes = cuotas
    .filter((c) => c.estado !== 'pagada')
    .sort((a, b) => aFecha(a.fechaVencimiento).getTime() - aFecha(b.fechaVencimiento).getTime());

  const total = cuotas.reduce((suma, c) => suma + c.valor, 0);
  const pagado = pagadas.reduce((suma, c) => suma + c.valor, 0);

  return {
    total,
    pagado,
    saldo: total - pagado,
    cuotasPagadas: pagadas.length,
    cuotasTotales: cuotas.length,
    proxima: pendientes[0] ?? null,
    vencidas: pendientes.filter((c) => c.estado === 'vencida'),
    alDia: pendientes.length === 0,
  };
}
