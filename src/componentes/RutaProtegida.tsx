/**
 * Guarda de ruta.
 *
 * Dos reglas del sistema de roles:
 *  - Si un rol no tiene permiso, la opción no aparece en el menú. De eso se
 *    encarga `menuPara()` en permisos.ts.
 *  - Si alguien entra por URL directa a una ruta sin permiso, se le redirige a
 *    su propio inicio con un aviso breve. De eso se encarga este componente.
 */

import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useUsuario } from '@compartido/auth';
import { puede, rutaInicio, type Capacidad } from '@compartido/permisos';

interface Props {
  children: ReactNode;
  /** 'paciente' exige rol paciente; 'clinica' exige ser personal. */
  area: 'paciente' | 'clinica';
  /** Restricción adicional dentro del área. */
  capacidad?: Capacidad;
}

/** Aviso que viaja en el estado de navegación al redirigir. */
export interface AvisoRuta {
  aviso: string;
}

export default function RutaProtegida({ children, area, capacidad }: Props) {
  const usuario = useUsuario();
  const ubicacion = useLocation();

  if (!usuario) {
    const destino = area === 'paciente' ? '/ingresar' : '/acceso';
    return (
      <Navigate
        to={destino}
        replace
        state={{
          aviso: 'Ingresa para continuar.',
          // Para volver a donde iba después de entrar.
          desde: ubicacion.pathname,
        }}
      />
    );
  }

  const esPersonal = usuario.rol !== 'paciente';
  const areaCorrecta = area === 'paciente' ? !esPersonal : esPersonal;

  if (!areaCorrecta) {
    return (
      <Navigate
        to={rutaInicio(usuario)}
        replace
        state={{ aviso: 'Esa sección no corresponde a tu tipo de usuario.' }}
      />
    );
  }

  if (capacidad && !puede(usuario, capacidad)) {
    return (
      <Navigate
        to={rutaInicio(usuario)}
        replace
        state={{ aviso: 'No tienes permiso para ver esa sección.' }}
      />
    );
  }

  return <>{children}</>;
}

/** Lee el aviso dejado por una redirección. Devuelve null si se llegó de frente. */
export function useAvisoDeRuta(): string | null {
  const ubicacion = useLocation();
  const estado = ubicacion.state as Partial<AvisoRuta> | null;
  return estado?.aviso ?? null;
}
