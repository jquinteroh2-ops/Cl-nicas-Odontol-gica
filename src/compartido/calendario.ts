/**
 * Archivo .ics para "Agregar al calendario".
 *
 * Se genera en el navegador y se descarga como blob: no hay servidor que lo
 * emita ni llamadas de red. Funciona con Google Calendar, Apple Calendario y
 * Outlook, que es lo que usa la gente desde el celular.
 */

import { addMinutes } from 'date-fns';
import { CLINICA, DIRECCION_COMPLETA } from './clinica';

interface EventoCalendario {
  titulo: string;
  inicio: Date;
  duracionMinutos: number;
  descripcion?: string;
}

/** Fecha en UTC con el formato que exige el estándar: 20260818T153000Z */
function marcaUtc(fecha: Date): string {
  const dosDigitos = (valor: number) => String(valor).padStart(2, '0');
  return (
    `${fecha.getUTCFullYear()}${dosDigitos(fecha.getUTCMonth() + 1)}${dosDigitos(fecha.getUTCDate())}` +
    `T${dosDigitos(fecha.getUTCHours())}${dosDigitos(fecha.getUTCMinutes())}${dosDigitos(fecha.getUTCSeconds())}Z`
  );
}

/** Las comas y los puntos y coma van escapados dentro de los campos de texto. */
function escapar(texto: string): string {
  return texto.replace(/([,;\\])/g, '\\$1').replace(/\n/g, '\\n');
}

export function generarIcs(evento: EventoCalendario): string {
  const fin = addMinutes(evento.inicio, evento.duracionMinutos);
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Dentistetic Turbaco//Demo//ES',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${Date.now()}@dentistetic.demo`,
    `DTSTAMP:${marcaUtc(new Date())}`,
    `DTSTART:${marcaUtc(evento.inicio)}`,
    `DTEND:${marcaUtc(fin)}`,
    `SUMMARY:${escapar(evento.titulo)}`,
    `LOCATION:${escapar(`${DIRECCION_COMPLETA} (${CLINICA.referencia})`)}`,
    evento.descripcion ? `DESCRIPTION:${escapar(evento.descripcion)}` : '',
    'BEGIN:VALARM',
    'TRIGGER:-PT2H',
    'ACTION:DISPLAY',
    `DESCRIPTION:${escapar(evento.titulo)}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');
}

/** Dispara la descarga del .ics. */
export function descargarIcs(evento: EventoCalendario, nombreArchivo = 'cita-dentistetic.ics'): void {
  const blob = new Blob([generarIcs(evento)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}
