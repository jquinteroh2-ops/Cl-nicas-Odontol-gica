/**
 * Formato colombiano. Toda cifra, fecha o teléfono que se muestre pasa por aquí.
 * Sin excepciones: si un componente concatena texto a mano, el demo se rompe en detalles.
 */

import { format, parseISO, differenceInCalendarDays, differenceInCalendarMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import type {
  EstadoCita,
  EstadoCuota,
  EstadoSolicitud,
  MetodoPago,
  TipoCita,
  TipoDocumento,
  TipoTratamiento,
} from './tipos';

/** Acepta ISO o Date y devuelve Date. */
export function aFecha(valor: string | Date): Date {
  return typeof valor === 'string' ? parseISO(valor) : valor;
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/* ---------------------------------------------------------------- dinero -- */

/** 5000 → "5.000". Miles con punto, como se escriben en Colombia. */
export function formatoNumero(valor: number): string {
  return new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(valor);
}

/** 400000 → "$400.000". Peso colombiano, sin decimales, miles con punto. */
export function formatoCOP(valor: number): string {
  return '$' + new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 }).format(Math.round(valor));
}

/* ---------------------------------------------------------------- fechas -- */

/** "11/08/2026" */
export function formatoFecha(valor: string | Date): string {
  return format(aFecha(valor), 'dd/MM/yyyy');
}

/** "18 de agosto de 2026" */
export function formatoFechaLarga(valor: string | Date): string {
  return format(aFecha(valor), "d 'de' MMMM 'de' yyyy", { locale: es });
}

/** "Martes 18 de agosto" */
export function formatoFechaConDia(valor: string | Date): string {
  const fecha = aFecha(valor);
  return `${mayuscula(format(fecha, 'EEEE', { locale: es }))} ${format(fecha, "d 'de' MMMM", { locale: es })}`;
}

/** "10:30 a.m." — Intl inserta espacios dentro de "a. m.", por eso se arma a mano. */
export function formatoHora(valor: string | Date): string {
  const fecha = aFecha(valor);
  const horas = fecha.getHours();
  const minutos = fecha.getMinutes();
  const sufijo = horas < 12 ? 'a.m.' : 'p.m.';
  const hora12 = horas % 12 === 0 ? 12 : horas % 12;
  return `${hora12}:${String(minutos).padStart(2, '0')} ${sufijo}`;
}

/** "Martes 18 de agosto, 10:30 a.m." */
export function formatoFechaHoraLarga(valor: string | Date): string {
  return `${formatoFechaConDia(valor)}, ${formatoHora(valor)}`;
}

/** "agosto de 2026" a partir de 'yyyy-MM'. */
export function formatoMes(mes: string): string {
  return mayuscula(format(parseISO(`${mes}-01`), "MMMM 'de' yyyy", { locale: es }));
}

/** "hoy", "mañana", "en 3 días", "hace 2 días". */
export function formatoDiaRelativo(valor: string | Date, referencia: Date = new Date()): string {
  const dias = differenceInCalendarDays(aFecha(valor), referencia);
  if (dias === 0) return 'hoy';
  if (dias === 1) return 'mañana';
  if (dias === -1) return 'ayer';
  if (dias > 1) return `en ${dias} días`;
  return `hace ${Math.abs(dias)} días`;
}

/** Mes de avance de un tratamiento, empezando en 1. */
export function mesDeTratamiento(fechaInicio: string, referencia: Date = new Date()): number {
  return differenceInCalendarMonths(referencia, aFecha(fechaInicio)) + 1;
}

/** "45 minutos", "1 hora", "1 hora 30 minutos". */
export function formatoDuracion(minutos: number): string {
  if (minutos < 60) return `${minutos} minutos`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  const textoHoras = horas === 1 ? '1 hora' : `${horas} horas`;
  return resto === 0 ? textoHoras : `${textoHoras} ${resto} minutos`;
}

/* ------------------------------------------------------ teléfono y datos -- */

/** "3126689413" o "+573126689413" → "+57 312 668 9413". */
export function formatoTelefono(valor: string): string {
  const digitos = valor.replace(/\D/g, '');
  const nacional = digitos.startsWith('57') && digitos.length > 10 ? digitos.slice(2) : digitos;
  if (nacional.length !== 10) return valor;
  return `+57 ${nacional.slice(0, 3)} ${nacional.slice(3, 6)} ${nacional.slice(6)}`;
}

/** "1047882331" → "1.047.882.331". */
export function formatoDocumento(numero: string): string {
  const digitos = numero.replace(/\D/g, '');
  if (!digitos) return numero;
  return new Intl.NumberFormat('es-CO').format(Number(digitos));
}

export const NOMBRE_TIPO_DOCUMENTO: Record<TipoDocumento, string> = {
  CC: 'Cédula de ciudadanía',
  TI: 'Tarjeta de identidad',
  CE: 'Cédula de extranjería',
};

/** "CC 1.047.882.331" */
export function formatoDocumentoCompleto(tipo: TipoDocumento, numero: string): string {
  return `${tipo} ${formatoDocumento(numero)}`;
}

export function nombreCompleto(persona: { nombres: string; apellidos: string }): string {
  return `${persona.nombres} ${persona.apellidos}`;
}

/** "Camila Andrea Pérez Villarreal" → "CP". Para avatares de iniciales. */
export function iniciales(valor: string): string {
  const partes = valor
    .replace(/^(Dra?\.|Sra?\.)\s*/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

/* -------------------------------------------------------------- etiquetas -- */

export const ETIQUETA_TIPO_CITA: Record<TipoCita, string> = {
  valoracion: 'Valoración',
  control: 'Control de ortodoncia',
  procedimiento: 'Procedimiento',
  urgencia: 'Urgencia',
};

export const ETIQUETA_ESTADO_SOLICITUD: Record<EstadoSolicitud, string> = {
  solicitada: 'En revisión',
  confirmada: 'Confirmada',
  aprobada: 'Aprobada',
  contrapropuesta: 'Horario alternativo propuesto',
  rechazada: 'No aprobada',
  cancelada: 'Cancelada',
  expirada: 'Expirada',
};

export const ETIQUETA_ESTADO_CITA: Record<EstadoCita, string> = {
  confirmada: 'Confirmada',
  asistio: 'Asistió',
  no_asistio: 'No asistió',
  cancelada: 'Cancelada',
};

export const ETIQUETA_ESTADO_CUOTA: Record<EstadoCuota, string> = {
  pagada: 'Pagada',
  pendiente: 'Pendiente',
  vencida: 'Vencida',
};

export const ETIQUETA_METODO_PAGO: Record<MetodoPago, string> = {
  efectivo: 'Efectivo',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

export const ETIQUETA_TIPO_TRATAMIENTO: Record<TipoTratamiento, string> = {
  ortodoncia: 'Ortodoncia',
  estetica: 'Estética dental',
  general: 'Odontología general',
};
