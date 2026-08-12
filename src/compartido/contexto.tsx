/**
 * Estado global y glue con los componentes.
 *
 * El detalle que hace funcionar la sincronización de cara al usuario: las
 * consultas se vuelven a ejecutar solas cuando cambia la revisión del estado,
 * venga el cambio de esta pestaña o de la otra. El componente no se entera de
 * dónde vino el cambio, solo se repinta.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { EstadoDemo } from './tipos';
import { reiniciarDemo, useSyncedState, type ActualizadorEstado } from './sync';
import { expirarSolicitudesVencidas } from './mockApi';

interface ValorContextoDatos {
  estado: EstadoDemo;
  actualizar: ActualizadorEstado;
  /** Sube en cada escritura, aquí o en otra pestaña. Dispara las consultas. */
  revision: number;
  reiniciar: () => void;
}

const ContextoDatos = createContext<ValorContextoDatos | null>(null);

export function ProveedorDatos({ children }: { children: ReactNode }) {
  const [estado, actualizar] = useSyncedState();

  // Las solicitudes sin respuesta caducan a las 24 h y liberan su cupo. Se barre
  // al cargar y cada minuto: si no, una que vence durante la reunión no cambiaría
  // de estado hasta recargar la página.
  useEffect(() => {
    expirarSolicitudesVencidas();
    const temporizador = window.setInterval(() => expirarSolicitudesVencidas(), 60_000);
    return () => window.clearInterval(temporizador);
  }, []);

  return (
    <ContextoDatos.Provider
      value={{ estado, actualizar, revision: estado.revision, reiniciar: reiniciarDemo }}
    >
      {children}
    </ContextoDatos.Provider>
  );
}

export function useDatos(): ValorContextoDatos {
  const valor = useContext(ContextoDatos);
  if (!valor) throw new Error('useDatos debe usarse dentro de <ProveedorDatos>.');
  return valor;
}

/* ------------------------------------------------------------------ consultas -- */

export interface ResultadoConsulta<T> {
  datos: T | null;
  /** Solo la primera carga. En las recargas por sincronización no parpadea. */
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/**
 * Ejecuta una consulta asíncrona de mockApi y la repite cuando cambian las
 * dependencias o la revisión del estado compartido.
 *
 * `cargando` solo es verdadero mientras no haya datos, para que las recargas
 * provocadas por otra pestaña no hagan parpadear la pantalla con skeletons.
 */
export function useConsulta<T>(consulta: () => Promise<T>, dependencias: unknown[] = []): ResultadoConsulta<T> {
  const { revision } = useDatos();
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recuento, setRecuento] = useState(0);

  // La consulta llega como función anónima nueva en cada render: se guarda en
  // una referencia para que no cuente como dependencia.
  const consultaRef = useRef(consulta);
  consultaRef.current = consulta;

  const secuenciaRef = useRef(0);

  useEffect(() => {
    const secuencia = ++secuenciaRef.current;
    let vigente = true;

    setError(null);
    consultaRef
      .current()
      .then((resultado) => {
        if (!vigente || secuencia !== secuenciaRef.current) return;
        setDatos(resultado);
        setCargando(false);
      })
      .catch((causa: unknown) => {
        if (!vigente || secuencia !== secuenciaRef.current) return;
        setError(causa instanceof Error ? causa.message : 'No pudimos cargar la información.');
        setCargando(false);
      });

    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revision, recuento, ...dependencias]);

  const recargar = useCallback(() => setRecuento((n) => n + 1), []);

  return { datos, cargando: cargando && datos === null, error, recargar };
}

/* ------------------------------------------------------------------- acciones -- */

export interface ResultadoAccion<A extends unknown[], R> {
  ejecutar: (...args: A) => Promise<R | null>;
  enCurso: boolean;
  error: string | null;
  limpiarError: () => void;
}

/** Envuelve una mutación de mockApi con estado de envío y mensaje de error. */
export function useAccion<A extends unknown[], R>(accion: (...args: A) => Promise<R>): ResultadoAccion<A, R> {
  const [enCurso, setEnCurso] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    return () => {
      montadoRef.current = false;
    };
  }, []);

  const ejecutar = useCallback(
    async (...args: A): Promise<R | null> => {
      setEnCurso(true);
      setError(null);
      try {
        const resultado = await accion(...args);
        return resultado;
      } catch (causa: unknown) {
        if (montadoRef.current) {
          setError(causa instanceof Error ? causa.message : 'No pudimos completar la acción.');
        }
        return null;
      } finally {
        if (montadoRef.current) setEnCurso(false);
      }
    },
    // La acción viene de mockApi, que es estable a nivel de módulo.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  return { ejecutar, enCurso, error, limpiarError: useCallback(() => setError(null), []) };
}
