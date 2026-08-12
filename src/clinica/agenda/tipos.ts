/**
 * Una cita ya resuelta contra el resto del estado.
 *
 * La API devuelve `Cita` con identificadores sueltos; la agenda necesita el
 * nombre del paciente y el color del profesional en cada celda. Se cruza una
 * sola vez en la página y las vistas reciben esto ya armado.
 */

import type { Cita, Paciente, Profesional } from '@compartido/tipos';

export interface CitaConContexto {
  cita: Cita;
  paciente?: Paciente;
  profesional?: Profesional;
}

/** Franja horaria que dibuja la rejilla. La clínica abre a las 8 y cierra a las 18. */
export const HORA_APERTURA = 8;
export const HORA_CIERRE = 18;

/** Alto de una hora en la rejilla, en píxeles. */
export const ALTO_HORA = 72;

/** Desplazamiento vertical de una cita dentro de la rejilla. */
export function posicionDe(fechaHora: Date, duracionMinutos: number) {
  const minutosDesdeApertura = (fechaHora.getHours() - HORA_APERTURA) * 60 + fechaHora.getMinutes();
  return {
    top: (minutosDesdeApertura / 60) * ALTO_HORA,
    // Mínimo 26 px: una cita de 15 minutos sería una raya ilegible.
    alto: Math.max(26, (duracionMinutos / 60) * ALTO_HORA - 3),
  };
}
