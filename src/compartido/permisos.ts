/**
 * Qué puede hacer cada rol. Un solo sitio.
 *
 * Las pantallas nunca preguntan "¿es administrador?", preguntan "¿puede ver la
 * cartera?". Así, el día que la clínica quiera que la secretaria vea ingresos,
 * se cambia una línea de esta tabla y no se toca ninguna pantalla.
 */

import type { Rol, SolicitudCita, Usuario } from './tipos';

export type Capacidad =
  | 'ver_info_propia'
  | 'solicitar_cita'
  | 'ver_agenda_clinica'
  | 'ver_agenda_propia'
  | 'resolver_solicitudes'
  /** Crear una cita ya confirmada, sin pasar por el circuito de solicitud. */
  | 'agendar_directo'
  | 'registrar_asistencia'
  | 'gestionar_pacientes'
  | 'notas_clinicas'
  | 'registrar_pagos'
  | 'ver_cartera'
  | 'gestionar_usuarios'
  | 'ver_bitacora';

export const CAPACIDADES_POR_ROL: Record<Rol, Capacidad[]> = {
  paciente: ['ver_info_propia', 'solicitar_cita'],
  secretaria: [
    'solicitar_cita',
    'ver_agenda_clinica',
    'resolver_solicitudes',
    'agendar_directo',
    'registrar_asistencia',
    'gestionar_pacientes',
    'registrar_pagos',
  ],
  odontologo: [
    'solicitar_cita',
    'ver_agenda_propia',
    'resolver_solicitudes',
    'agendar_directo',
    'registrar_asistencia',
    'gestionar_pacientes',
    'notas_clinicas',
  ],
  administrador: [
    'solicitar_cita',
    'ver_agenda_clinica',
    'ver_agenda_propia',
    'resolver_solicitudes',
    'agendar_directo',
    'registrar_asistencia',
    'gestionar_pacientes',
    'notas_clinicas',
    'registrar_pagos',
    'ver_cartera',
    'gestionar_usuarios',
    'ver_bitacora',
  ],
};

export const ETIQUETA_CAPACIDAD: Record<Capacidad, string> = {
  ver_info_propia: 'Ver su propia información',
  solicitar_cita: 'Solicitar cita',
  ver_agenda_clinica: 'Ver agenda completa de la clínica',
  ver_agenda_propia: 'Ver su propia agenda',
  resolver_solicitudes: 'Aprobar y reagendar solicitudes',
  agendar_directo: 'Agendar una cita directamente',
  registrar_asistencia: 'Registrar asistencia',
  gestionar_pacientes: 'Crear y editar pacientes',
  notas_clinicas: 'Notas clínicas del tratamiento',
  registrar_pagos: 'Registrar pagos de cuotas',
  ver_cartera: 'Ver cartera completa e ingresos',
  gestionar_usuarios: 'Gestionar usuarios y tarifas',
  ver_bitacora: 'Bitácora de actividad',
};

export const TODAS_LAS_CAPACIDADES = Object.keys(ETIQUETA_CAPACIDAD) as Capacidad[];

export function puede(usuario: Usuario | null, capacidad: Capacidad): boolean {
  if (!usuario || !usuario.activo) return false;
  return CAPACIDADES_POR_ROL[usuario.rol].includes(capacidad);
}

/**
 * El odontólogo solo resuelve las solicitudes dirigidas a él. Secretaria y
 * administrador resuelven cualquiera, incluidas las que aún no tienen profesional.
 */
export function puedeResolverSolicitud(usuario: Usuario | null, solicitud: SolicitudCita): boolean {
  if (!puede(usuario, 'resolver_solicitudes')) return false;
  if (usuario!.rol !== 'odontologo') return true;
  return solicitud.profesionalId === usuario!.profesionalId;
}

/** El odontólogo ve su propia agenda; los demás con permiso, la de toda la clínica. */
export function profesionalVisible(usuario: Usuario | null): string | null {
  if (usuario?.rol === 'odontologo' && !puede(usuario, 'ver_agenda_clinica')) {
    return usuario.profesionalId ?? null;
  }
  return null;
}

/** A dónde va cada usuario después de entrar. */
export function rutaInicio(usuario: Usuario | null): string {
  if (!usuario) return '/';
  return usuario.rol === 'paciente' ? '/portal' : '/clinica';
}

export const ETIQUETA_ROL: Record<Rol, string> = {
  paciente: 'Paciente',
  secretaria: 'Secretaria',
  odontologo: 'Odontólogo',
  administrador: 'Administrador',
};

/** Menú lateral del área clínica. Cada entrada se muestra solo si el rol la habilita. */
export interface EntradaMenu {
  ruta: string;
  etiqueta: string;
  /** Nombre del icono de lucide-react. */
  icono: string;
  /** null = visible para todo el personal. */
  capacidad: Capacidad | null;
  /** Solo coincide la ruta exacta, no los subniveles. */
  exacta?: boolean;
}

export const MENU_CLINICA: EntradaMenu[] = [
  { ruta: '/clinica', etiqueta: 'Inicio', icono: 'LayoutDashboard', capacidad: null, exacta: true },
  { ruta: '/clinica/agenda', etiqueta: 'Agenda', icono: 'CalendarDays', capacidad: null },
  { ruta: '/clinica/pacientes', etiqueta: 'Pacientes', icono: 'Users', capacidad: 'gestionar_pacientes' },
  { ruta: '/clinica/cartera', etiqueta: 'Cartera', icono: 'Wallet', capacidad: 'ver_cartera' },
  { ruta: '/clinica/bitacora', etiqueta: 'Bitácora', icono: 'ScrollText', capacidad: 'ver_bitacora' },
];

export function menuPara(usuario: Usuario | null): EntradaMenu[] {
  return MENU_CLINICA.filter((entrada) => entrada.capacidad === null || puede(usuario, entrada.capacidad));
}
