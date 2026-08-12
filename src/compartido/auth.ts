/**
 * Sesión, por pestaña.
 *
 * REGLA CRÍTICA DEL DEMO: la sesión vive en sessionStorage, no en localStorage.
 * Cada pestaña puede tener un usuario distinto —el portal de la paciente en una
 * y el panel de la doctora en otra— y entrar en una no cierra la otra. Los datos
 * clínicos, en cambio, sí son compartidos y viven en localStorage (ver sync.ts).
 *
 * Aquí solo se guarda el identificador del usuario. El registro completo se
 * resuelve contra el estado compartido en cada lectura, de modo que si el demo
 * se reinicia, la sesión deja de resolver y la pestaña vuelve al inicio público.
 */

import { useSyncExternalStore } from 'react';
import type { Usuario } from './tipos';
import { obtenerEstado, suscribirEstado } from './sync';

const CLAVE_SESION = 'dentistetic:sesion';

interface Sesion {
  usuarioId: string;
  /** ISO 8601 */
  iniciadaEn: string;
}

const hayNavegador = typeof window !== 'undefined';
const oyentes = new Set<() => void>();

let sesionMemoria: Sesion | null | undefined;

function leerSesion(): Sesion | null {
  if (sesionMemoria !== undefined) return sesionMemoria;
  if (!hayNavegador) return (sesionMemoria = null);
  try {
    const crudo = window.sessionStorage.getItem(CLAVE_SESION);
    sesionMemoria = crudo ? (JSON.parse(crudo) as Sesion) : null;
  } catch {
    sesionMemoria = null;
  }
  return sesionMemoria;
}

function guardarSesion(sesion: Sesion | null): void {
  sesionMemoria = sesion;
  if (hayNavegador) {
    try {
      if (sesion) window.sessionStorage.setItem(CLAVE_SESION, JSON.stringify(sesion));
      else window.sessionStorage.removeItem(CLAVE_SESION);
    } catch (error) {
      console.warn('[auth] no se pudo guardar la sesión', error);
    }
  }
  for (const oyente of oyentes) oyente();
}

/* ------------------------------------------------------------------ lectura -- */

/** Usuario de esta pestaña, resuelto contra el estado compartido. */
export function usuarioActual(): Usuario | null {
  const sesion = leerSesion();
  if (!sesion) return null;
  const usuario = obtenerEstado().usuarios.find((u) => u.id === sesion.usuarioId);
  return usuario?.activo ? usuario : null;
}

/** Id del usuario que actúa. Lo usa mockApi para firmar la bitácora. */
export function usuarioActualId(): string | null {
  return leerSesion()?.usuarioId ?? null;
}

/* ---------------------------------------------------------------- escritura -- */

/**
 * Abre sesión en ESTA pestaña. La validación de credenciales la hace mockApi;
 * aquí solo se registra quién quedó dentro.
 */
export function establecerSesion(usuarioId: string): void {
  guardarSesion({ usuarioId, iniciadaEn: new Date().toISOString() });
}

export function cerrarSesion(): void {
  guardarSesion(null);
}

/* --------------------------------------------------------------------- hook -- */

/**
 * Se resuscribe a los dos orígenes de cambio: la sesión de esta pestaña y el
 * estado compartido. Lo segundo importa porque si el usuario se desactiva desde
 * otra pestaña, esta debe enterarse.
 */
function suscribir(oyente: () => void): () => void {
  oyentes.add(oyente);
  const cancelarEstado = suscribirEstado(oyente);
  return () => {
    oyentes.delete(oyente);
    cancelarEstado();
  };
}

export function useUsuario(): Usuario | null {
  return useSyncExternalStore(suscribir, usuarioActual, usuarioActual);
}
