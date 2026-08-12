/**
 * Persistencia y sincronización entre pestañas.
 *
 * El demo se muestra con dos pestañas abiertas: el portal del paciente en una y
 * el panel de la odontóloga en otra. Una solicitud enviada aquí tiene que
 * aparecer allá en menos de un segundo, sin recargar. Eso es lo que resuelve
 * este archivo.
 *
 * Cómo funciona:
 *  - Un único objeto EstadoDemo vive en localStorage. Las escrituras son atómicas.
 *  - Cada pestaña tiene un identificador propio, generado al cargar.
 *  - Al escribir se persiste y se emite por BroadcastChannel. Quien recibe
 *    descarta sus propios ecos y las revisiones que ya conoce.
 *  - Si el navegador no soporta BroadcastChannel se usa el evento `storage`,
 *    que solo se dispara en las demás pestañas: exactamente lo que se necesita.
 *
 * Ningún componente debe tocar localStorage. Todo pasa por aquí.
 */

import { useCallback, useSyncExternalStore } from 'react';
import type { EstadoDemo } from './tipos';
import { VERSION_DATOS, generarDatosDemo } from './datosSemilla';

const PREFIJO = 'dentistetic:';
const CLAVE_ESTADO = `${PREFIJO}estado`;
const NOMBRE_CANAL = 'dentistetic-sync';

/** Identifica esta pestaña para ignorar los mensajes que ella misma emite. */
export const ID_PESTANA: string =
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

type Mensaje =
  | { tipo: 'estado'; origen: string; estado: EstadoDemo }
  | { tipo: 'reinicio'; origen: string };

let canal: BroadcastChannel | null = null;
let estadoMemoria: EstadoDemo | null = null;
const oyentes = new Set<() => void>();

const hayNavegador = typeof window !== 'undefined';
const soportaCanal = hayNavegador && typeof BroadcastChannel !== 'undefined';

/* ------------------------------------------------------------- persistencia -- */

function leerDeAlmacen(): EstadoDemo | null {
  if (!hayNavegador) return null;
  try {
    const crudo = window.localStorage.getItem(CLAVE_ESTADO);
    if (!crudo) return null;
    const datos = JSON.parse(crudo) as EstadoDemo;
    // Un almacén de una versión anterior se descarta en vez de intentar migrarlo.
    if (datos?.version !== VERSION_DATOS) return null;
    return datos;
  } catch {
    return null;
  }
}

function guardarEnAlmacen(estado: EstadoDemo): void {
  if (!hayNavegador) return;
  try {
    window.localStorage.setItem(CLAVE_ESTADO, JSON.stringify(estado));
  } catch (error) {
    // Cuota llena o modo privado: el demo sigue funcionando en memoria.
    console.warn('[sync] no se pudo persistir el estado', error);
  }
}

function notificar(): void {
  for (const oyente of oyentes) oyente();
}

/** Aplica un estado recibido de otra pestaña. Descarta revisiones ya conocidas. */
function aplicarRemoto(estado: EstadoDemo): void {
  if (estado.version !== VERSION_DATOS) return;
  if (estadoMemoria && estado.revision <= estadoMemoria.revision) return;
  estadoMemoria = estado;
  notificar();
}

/* ------------------------------------------------------------------- canal -- */

function obtenerCanal(): BroadcastChannel | null {
  if (!soportaCanal) return null;
  if (!canal) {
    canal = new BroadcastChannel(NOMBRE_CANAL);
    canal.onmessage = (evento: MessageEvent<Mensaje>) => {
      const mensaje = evento.data;
      if (!mensaje || mensaje.origen === ID_PESTANA) return;
      if (mensaje.tipo === 'estado') {
        aplicarRemoto(mensaje.estado);
      } else if (mensaje.tipo === 'reinicio') {
        // Recargar garantiza que la otra pestaña arranque limpia: sin sesión
        // abierta contra pacientes que ya no existen y sin estados intermedios.
        window.location.reload();
      }
    };
  }
  return canal;
}

function emitir(mensaje: Mensaje): void {
  obtenerCanal()?.postMessage(mensaje);
}

if (hayNavegador) {
  obtenerCanal();

  // Respaldo para navegadores sin BroadcastChannel. El evento `storage` solo
  // llega a las otras pestañas, así que no hace falta filtrar el origen.
  if (!soportaCanal) {
    window.addEventListener('storage', (evento) => {
      if (evento.key !== CLAVE_ESTADO) return;
      if (!evento.newValue) {
        window.location.reload();
        return;
      }
      try {
        aplicarRemoto(JSON.parse(evento.newValue) as EstadoDemo);
      } catch {
        /* valor corrupto: se ignora */
      }
    });
  }
}

/* ------------------------------------------------------------------ lectura -- */

/** Estado actual. Lo genera y persiste la primera vez que se pide. */
export function obtenerEstado(): EstadoDemo {
  if (!estadoMemoria) {
    const guardado = leerDeAlmacen();
    if (guardado) {
      estadoMemoria = guardado;
    } else {
      estadoMemoria = generarDatosDemo();
      guardarEnAlmacen(estadoMemoria);
    }
  }
  return estadoMemoria;
}

/* ----------------------------------------------------------------- escritura -- */

/**
 * Única puerta de escritura. Recibe el estado actual y devuelve el siguiente.
 * Sube la revisión, persiste y avisa a las demás pestañas, en ese orden.
 */
export function actualizarEstado(receta: (estado: EstadoDemo) => EstadoDemo): EstadoDemo {
  const anterior = obtenerEstado();
  const siguiente: EstadoDemo = { ...receta(anterior), revision: anterior.revision + 1 };
  estadoMemoria = siguiente;
  guardarEnAlmacen(siguiente);
  notificar();
  emitir({ tipo: 'estado', origen: ID_PESTANA, estado: siguiente });
  return siguiente;
}

/* ---------------------------------------------------- claves auxiliares (sesión) -- */

/**
 * Almacenamiento para lo que no es dato clínico compartido: la sesión abierta en
 * cada aplicación, por ejemplo. Vive aquí para que `usuarios/` nunca toque
 * localStorage por su cuenta.
 */
export function leerClave<T>(clave: string): T | null {
  if (!hayNavegador) return null;
  try {
    const crudo = window.localStorage.getItem(PREFIJO + clave);
    return crudo ? (JSON.parse(crudo) as T) : null;
  } catch {
    return null;
  }
}

export function escribirClave<T>(clave: string, valor: T | null): void {
  if (!hayNavegador) return;
  try {
    if (valor === null) window.localStorage.removeItem(PREFIJO + clave);
    else window.localStorage.setItem(PREFIJO + clave, JSON.stringify(valor));
  } catch (error) {
    console.warn('[sync] no se pudo guardar la clave', clave, error);
  }
}

/* ------------------------------------------------------------------ reinicio -- */

/**
 * Borra todo lo del demo, regenera los datos contra la fecha de hoy y recarga.
 * Sin esto el demo solo se puede mostrar una vez.
 */
export function reiniciarDemo(): void {
  if (hayNavegador) {
    for (const clave of Object.keys(window.localStorage)) {
      if (clave.startsWith(PREFIJO)) window.localStorage.removeItem(clave);
    }
    // También cierra la sesión de esta pestaña. Las demás la pierden al recargar:
    // conservarlas dejaría sesiones apuntando a datos que ya no existen.
    for (const clave of Object.keys(window.sessionStorage)) {
      if (clave.startsWith(PREFIJO)) window.sessionStorage.removeItem(clave);
    }
  }
  estadoMemoria = generarDatosDemo();
  guardarEnAlmacen(estadoMemoria);
  notificar();
  emitir({ tipo: 'reinicio', origen: ID_PESTANA });
  if (hayNavegador) window.location.reload();
}

/* ---------------------------------------------------------------------- hook -- */

/** Avisa cuando cambia el estado compartido, aquí o en otra pestaña. */
export function suscribirEstado(oyente: () => void): () => void {
  oyentes.add(oyente);
  return () => {
    oyentes.delete(oyente);
  };
}

const suscribir = suscribirEstado;

export type ActualizadorEstado = (receta: (estado: EstadoDemo) => EstadoDemo) => void;

/**
 * Estado compartido y vivo. Se apoya en useSyncExternalStore, así que las dos
 * pestañas y todos los componentes leen siempre la misma revisión, sin desfases.
 */
export function useSyncedState(): [EstadoDemo, ActualizadorEstado] {
  const estado = useSyncExternalStore(suscribir, obtenerEstado, obtenerEstado);
  const actualizar = useCallback<ActualizadorEstado>((receta) => {
    actualizarEstado(receta);
  }, []);
  return [estado, actualizar];
}

/** Solo para la pantalla de diagnóstico. */
export const DIAGNOSTICO_SYNC = {
  claveEstado: CLAVE_ESTADO,
  nombreCanal: NOMBRE_CANAL,
  soportaCanal,
};
