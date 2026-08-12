/**
 * Lectura de una solicitud para la interfaz del panel.
 *
 * Una solicitud viene por dos caminos: de un paciente con cuenta (trae
 * `pacienteId`) o de alguien que aún no existe en el sistema (trae
 * `datosContacto`). Las pantallas no deberían repetir ese `if` en cada línea,
 * así que se resuelve una vez aquí.
 */

import type { Paciente, SolicitudCita } from '@compartido/tipos';
import { nombreCompleto } from '@compartido/formato';

/** Nombre a mostrar, venga la solicitud de donde venga. */
export function nombreDeSolicitud(solicitud: SolicitudCita, paciente?: Paciente | null): string {
  if (paciente) return nombreCompleto(paciente);
  if (solicitud.datosContacto) return nombreCompleto(solicitud.datosContacto);
  return 'Paciente';
}

/** Verdadero cuando quien solicita todavía no tiene ficha en la clínica. */
export function esPacienteNuevo(solicitud: SolicitudCita): boolean {
  return !solicitud.pacienteId && Boolean(solicitud.datosContacto);
}

export function telefonoDeSolicitud(
  solicitud: SolicitudCita,
  paciente?: Paciente | null,
): string | undefined {
  return paciente?.telefono ?? solicitud.datosContacto?.telefono;
}
