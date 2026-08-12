/**
 * Marco del área clínica.
 *
 * La navegación no está escrita aquí: sale de `menuPara(usuario)`, así que la
 * secretaria sencillamente no ve Cartera ni Bitácora. En la reunión eso se
 * demuestra entrando con un usuario y con otro sin tocar código.
 *
 * En celular las secciones van en una barra inferior —el pulgar llega— y en
 * escritorio en una columna lateral. Es la misma lista en los dos sitios.
 */

import { useEffect } from 'react';
import {
  CalendarDays,
  LayoutDashboard,
  LogOut,
  RefreshCw,
  ScrollText,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUsuario } from '@compartido/auth';
import { AVISO_DEMO, CLINICA } from '@compartido/clinica';
import { useDatos } from '@compartido/contexto';
import { iniciales } from '@compartido/formato';
import * as api from '@compartido/mockApi';
import { ETIQUETA_ROL, menuPara } from '@compartido/permisos';

/** El menú guarda el nombre del icono, no el componente: los tipos viven en `compartido/`. */
const ICONOS: Record<string, LucideIcon> = {
  LayoutDashboard,
  CalendarDays,
  Users,
  Wallet,
  ScrollText,
};

function DesplazarArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function LayoutClinica() {
  const usuario = useUsuario();
  const navegar = useNavigate();
  const { reiniciar } = useDatos();
  const secciones = menuPara(usuario);

  async function salir() {
    await api.cerrarSesionUsuario();
    navegar('/', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <DesplazarArriba />

      <header className="sticky top-0 z-30 bg-petroleo-800 text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <span className="flex min-w-0 items-center gap-3.5">
            <span
              className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/15 text-sm font-semibold ring-1 ring-white/20"
              aria-hidden
            >
              {iniciales(usuario?.nombre ?? '')}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-semibold tracking-tight">{usuario?.nombre}</span>
              {/* El rol siempre a la vista: es la mitad de lo que se está demostrando. */}
              <span className="block truncate text-xs text-white/55">
                {usuario ? ETIQUETA_ROL[usuario.rol] : ''} · {CLINICA.nombre}
              </span>
            </span>
          </span>

          <button
            type="button"
            onClick={salir}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Salir</span>
          </button>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-10 px-5 sm:px-8">
        {/* Columna lateral: solo desde tableta. En celular la reemplaza la barra inferior. */}
        <nav className="hidden w-56 shrink-0 py-8 md:block">
          <ul className="sticky top-24 space-y-1.5">
            {secciones.map(({ ruta, etiqueta, icono, exacta }) => {
              const Icono = ICONOS[icono] ?? LayoutDashboard;
              return (
                <li key={ruta}>
                  <NavLink
                    to={ruta}
                    end={exacta}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-petroleo-50 text-petroleo-700'
                          : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-900'
                      }`
                    }
                  >
                    <Icono className="h-4.5 w-4.5 shrink-0" aria-hidden />
                    {etiqueta}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* pb-28 en celular deja sitio a la barra inferior fija. */}
        <main className="min-w-0 flex-1 py-7 pb-28 md:py-8 md:pb-8">
          <Outlet />

          <footer className="mt-14 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 pt-7">
            <p className="text-xs text-slate-400">{AVISO_DEMO}</p>
            <button
              type="button"
              onClick={reiniciar}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 text-xs font-medium text-slate-400 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Reiniciar demostración
            </button>
          </footer>
        </main>
      </div>

      {/* El icono activo va sobre una pastilla: a tamaño de pulgar el color solo no basta. */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-slate-200/70 bg-white/90 backdrop-blur-md md:hidden">
        <ul className="mx-auto flex max-w-md px-2 pb-seguro pt-2">
          {secciones.map(({ ruta, etiqueta, icono, exacta }) => {
            const Icono = ICONOS[icono] ?? LayoutDashboard;
            return (
              <li key={ruta} className="flex-1">
                <NavLink
                  to={ruta}
                  end={exacta}
                  className={({ isActive }) =>
                    `flex flex-col items-center gap-1.5 rounded-2xl px-1 py-2 text-[11px] font-medium leading-tight transition-all ${
                      isActive ? 'text-petroleo-700' : 'text-slate-400'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <span
                        className={`grid h-8 w-14 place-items-center rounded-full transition-colors ${
                          isActive ? 'bg-petroleo-50' : 'bg-transparent'
                        }`}
                      >
                        <Icono className="h-5 w-5 shrink-0" aria-hidden />
                      </span>
                      <span className="truncate">{etiqueta}</span>
                    </>
                  )}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
