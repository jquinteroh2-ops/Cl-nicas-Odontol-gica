/**
 * Encabezado público. Pegado arriba y con el botón de agendar siempre a la vista:
 * en un celular, esa es la única acción que no puede quedar fuera de pantalla.
 */

import { CalendarPlus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { CLINICA } from '@compartido/clinica';
import Boton from '@componentes/ui/Boton';

export default function Encabezado() {
  const { pathname } = useLocation();
  const enAgendar = pathname.startsWith('/agendar');

  return (
    <header className="sticky top-0 z-40 border-b border-slate-100/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={`Inicio · ${CLINICA.nombre}`}>
          <span
            className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-petroleo-600 text-sm font-semibold tracking-tight text-white shadow-suave"
            aria-hidden
          >
            DT
          </span>
          <span className="min-w-0">
            <span className="block truncate font-semibold leading-tight tracking-tight text-slate-900">
              {CLINICA.nombre}
            </span>
            <span className="hidden text-xs leading-tight text-slate-500 sm:block">
              {CLINICA.descripcion}
            </span>
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/ingresar"
            className="hidden items-center rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 sm:inline-flex"
          >
            Ya soy paciente
          </Link>
          {/*
            El personal entra desde cualquier página pública, no solo desde la
            portada. Se oculta en celular porque ahí la barra solo tiene sitio
            para el logo y agendar; el enlace del hero cubre ese caso.
          */}
          <Link
            to="/acceso"
            className="hidden items-center rounded-xl px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900 lg:inline-flex"
          >
            Personal
          </Link>
          {!enAgendar && (
            <Boton a="/agendar" icono={<CalendarPlus className="h-4 w-4" aria-hidden />}>
              {/*
                A 390 px, "Agendar cita" más el nombre de la clínica suman unos
                395 px y el nombre se quedaba cortado en "Dentistetic Turb…".
                Quitar una palabra en móvil deja entrar el nombre completo, que
                es lo que no puede faltar en la barra.
              */}
              <span className="sm:hidden">Agendar</span>
              <span className="hidden sm:inline">Agendar cita</span>
            </Boton>
          )}
        </div>
      </div>
    </header>
  );
}
