/**
 * Reglas de agenda. Puras y sin estado propio: reciben el EstadoDemo y responden.
 *
 * Regla de oro del portal: nunca se ofrece una franja que no esté realmente libre.
 * Pedir una cita imposible y que la rechacen es la peor experiencia posible.
 *
 * La aplicación de administración usará estas mismas funciones para su agenda,
 * de modo que las dos vean idéntica ocupación.
 */

import { addMinutes, endOfMonth, format, startOfMonth, startOfDay, parseISO } from 'date-fns';
import type { EstadoDemo, FranjaDisponible, TipoCita } from './tipos';

/** Cuánto bloquea cada tipo de cita en la agenda. */
export const DURACION_POR_TIPO: Record<TipoCita, number> = {
  valoracion: 45,
  control: 30,
  procedimiento: 60,
  urgencia: 30,
};

/** Las franjas se ofrecen en bloques de 30 minutos. */
export const PASO_MINUTOS = 30;

/** No se agenda con menos de este margen. Nadie confirma una cita para dentro de diez minutos. */
export const ANTICIPACION_MINIMA_HORAS = 2;

/** Cuántos días hacia adelante se pueden pedir cita. */
export const DIAS_MAXIMOS_ADELANTE = 60;

interface Jornada {
  aperturaHora: number;
  cierreHora: number;
}

/** Índice por getDay(): 0 domingo … 6 sábado. null = cerrado. */
export const JORNADAS: Record<number, Jornada | null> = {
  0: null,
  1: { aperturaHora: 8, cierreHora: 18 },
  2: { aperturaHora: 8, cierreHora: 18 },
  3: { aperturaHora: 8, cierreHora: 18 },
  4: { aperturaHora: 8, cierreHora: 18 },
  5: { aperturaHora: 8, cierreHora: 18 },
  6: { aperturaHora: 8, cierreHora: 12 },
};

export function jornadaDe(dia: Date): Jornada | null {
  return JORNADAS[dia.getDay()] ?? null;
}

/** ¿La clínica atiende ese día? Domingos no. */
export function esDiaHabil(dia: Date): boolean {
  return jornadaDe(dia) !== null;
}

/** ¿La clínica está atendiendo en este preciso momento? Para el aviso del inicio. */
export function estaAtendiendoAhora(ahora: Date = new Date()): boolean {
  const jornada = jornadaDe(ahora);
  if (!jornada) return false;
  const minutos = ahora.getHours() * 60 + ahora.getMinutes();
  return minutos >= jornada.aperturaHora * 60 && minutos < jornada.cierreHora * 60;
}

/** Clave 'yyyy-MM-dd' de un día, para comparar sin líos de zona horaria. */
export function claveDia(fecha: string | Date): string {
  const valor = typeof fecha === 'string' ? parseISO(fecha) : fecha;
  return format(valor, 'yyyy-MM-dd');
}

/**
 * Todos los inicios posibles de un día, cada 30 minutos, tales que la cita
 * completa termina antes del cierre. Todavía sin mirar ocupación.
 */
export function franjasCandidatas(dia: Date, duracionMinutos: number): Date[] {
  const jornada = jornadaDe(dia);
  if (!jornada) return [];

  const apertura = startOfDay(dia);
  apertura.setHours(jornada.aperturaHora, 0, 0, 0);
  const cierre = startOfDay(dia);
  cierre.setHours(jornada.cierreHora, 0, 0, 0);

  const franjas: Date[] = [];
  let cursor = apertura;
  while (addMinutes(cursor, duracionMinutos).getTime() <= cierre.getTime()) {
    franjas.push(new Date(cursor));
    cursor = addMinutes(cursor, PASO_MINUTOS);
  }
  return franjas;
}

interface Ocupacion {
  /** Ausente cuando la solicitud aún no tiene profesional asignado: consume un cupo cualquiera. */
  profesionalId?: string;
  inicio: number;
  fin: number;
}

/**
 * Todo lo que bloquea agenda:
 *  - citas confirmadas o ya atendidas;
 *  - solicitudes pendientes de aprobación, que reservan su horario mientras se deciden;
 *  - horarios contrapropuestos, que quedan apartados hasta que el paciente elija.
 */
export function ocupacionesDe(estado: EstadoDemo): Ocupacion[] {
  const ocupaciones: Ocupacion[] = [];

  for (const cita of estado.citas) {
    if (cita.estado === 'cancelada' || cita.estado === 'no_asistio') continue;
    const inicio = parseISO(cita.fechaHora).getTime();
    ocupaciones.push({
      profesionalId: cita.profesionalId,
      inicio,
      fin: inicio + cita.duracionMinutos * 60_000,
    });
  }

  for (const solicitud of estado.solicitudes) {
    if (solicitud.estado === 'solicitada') {
      const inicio = parseISO(solicitud.fechaHoraSolicitada).getTime();
      ocupaciones.push({
        profesionalId: solicitud.profesionalId,
        inicio,
        fin: inicio + solicitud.duracionMinutos * 60_000,
      });
    }
    if (solicitud.estado === 'contrapropuesta') {
      for (const horario of solicitud.horariosPropuestos ?? []) {
        const inicio = parseISO(horario).getTime();
        ocupaciones.push({
          profesionalId: solicitud.profesionalId,
          inicio,
          fin: inicio + solicitud.duracionMinutos * 60_000,
        });
      }
    }
  }

  return ocupaciones;
}

function seCruzan(a: Ocupacion, inicio: number, fin: number): boolean {
  return a.inicio < fin && inicio < a.fin;
}

/**
 * Profesionales realmente libres en una franja.
 *
 * Las reservas sin profesional asignado (solicitudes pendientes) consumen cupo
 * genérico: descuentan de la lista de libres sin señalar a nadie en concreto.
 * `preferidoId` sube al frente al profesional que ya atiende al paciente.
 */
export function profesionalesLibres(
  estado: EstadoDemo,
  inicio: Date,
  duracionMinutos: number,
  preferidoId?: string,
  ocupacionesPrecalculadas?: Ocupacion[],
): string[] {
  const desde = inicio.getTime();
  const hasta = desde + duracionMinutos * 60_000;
  const ocupaciones = ocupacionesPrecalculadas ?? ocupacionesDe(estado);

  const cruzadas = ocupaciones.filter((o) => seCruzan(o, desde, hasta));
  const ocupadosConNombre = new Set(
    cruzadas.filter((o) => o.profesionalId).map((o) => o.profesionalId as string),
  );
  const reservasGenericas = cruzadas.filter((o) => !o.profesionalId).length;

  let libres = estado.profesionales.map((p) => p.id).filter((id) => !ocupadosConNombre.has(id));

  if (preferidoId && libres.includes(preferidoId)) {
    libres = [preferidoId, ...libres.filter((id) => id !== preferidoId)];
  }

  // Las reservas genéricas se comen los últimos cupos, no el preferido.
  return reservasGenericas > 0 ? libres.slice(0, Math.max(0, libres.length - reservasGenericas)) : libres;
}

/** ¿La franja está dentro del horario, en el futuro y con al menos un profesional libre? */
export function franjaEsValida(
  estado: EstadoDemo,
  inicio: Date,
  tipo: TipoCita,
  ahora: Date = new Date(),
  preferidoId?: string,
): boolean {
  const duracion = DURACION_POR_TIPO[tipo];
  const candidatas = franjasCandidatas(inicio, duracion);
  if (!candidatas.some((c) => c.getTime() === inicio.getTime())) return false;
  if (inicio.getTime() < ahora.getTime() + ANTICIPACION_MINIMA_HORAS * 3_600_000) return false;
  return profesionalesLibres(estado, inicio, duracion, preferidoId).length > 0;
}

/** Franjas libres de un día concreto. Es lo que se le ofrece al paciente. */
export function franjasLibresDelDia(
  estado: EstadoDemo,
  dia: Date,
  tipo: TipoCita,
  ahora: Date = new Date(),
  preferidoId?: string,
): FranjaDisponible[] {
  const duracion = DURACION_POR_TIPO[tipo];
  const minimo = ahora.getTime() + ANTICIPACION_MINIMA_HORAS * 3_600_000;
  const ocupaciones = ocupacionesDe(estado);

  return franjasCandidatas(dia, duracion)
    .filter((inicio) => inicio.getTime() >= minimo)
    .map((inicio) => ({
      inicio: inicio.toISOString(),
      duracionMinutos: duracion,
      profesionalesLibres: profesionalesLibres(estado, inicio, duracion, preferidoId, ocupaciones),
    }))
    .filter((franja) => franja.profesionalesLibres.length > 0);
}

/**
 * Días del mes con al menos una franja libre, en claves 'yyyy-MM-dd'.
 * El calendario deshabilita todo lo que no esté aquí.
 */
export function diasConDisponibilidad(
  estado: EstadoDemo,
  mes: Date,
  tipo: TipoCita,
  ahora: Date = new Date(),
  preferidoId?: string,
): string[] {
  const duracion = DURACION_POR_TIPO[tipo];
  const minimo = ahora.getTime() + ANTICIPACION_MINIMA_HORAS * 3_600_000;
  const tope = startOfDay(ahora).getTime() + DIAS_MAXIMOS_ADELANTE * 86_400_000;
  const ocupaciones = ocupacionesDe(estado);

  const dias: string[] = [];
  const fin = endOfMonth(mes);
  for (let cursor = startOfMonth(mes); cursor <= fin; cursor = addMinutes(cursor, 1440)) {
    if (!esDiaHabil(cursor)) continue;
    if (startOfDay(cursor).getTime() > tope) continue;

    const hayCupo = franjasCandidatas(cursor, duracion).some(
      (inicio) =>
        inicio.getTime() >= minimo &&
        profesionalesLibres(estado, inicio, duracion, preferidoId, ocupaciones).length > 0,
    );
    if (hayCupo) dias.push(claveDia(cursor));
  }
  return dias;
}
