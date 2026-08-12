/**
 * Marco del portal del paciente.
 *
 * No reutiliza el encabezado público a propósito: ahí el objetivo es que un
 * desconocido agende, y aquí es que una paciente que ya está en tratamiento
 * encuentre su cita y su cuenta en dos toques. El saludo con el nombre es lo que
 * hace evidente, en la reunión, que la sesión abierta es la de esa persona.
 */

import { useEffect } from 'react';
import { CalendarDays, CalendarPlus, LogOut, RefreshCw, Wallet } from 'lucide-react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useUsuario } from '@compartido/auth';
import { AVISO_DEMO, CLINICA } from '@compartido/clinica';
import { useDatos } from '@compartido/contexto';
import { iniciales } from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';

const PESTANAS = [
  { a: '/portal', etiqueta: 'Mis citas', icono: CalendarDays },
  { a: '/portal/cuenta', etiqueta: 'Estado de cuenta', icono: Wallet },
];

/** Sube la vista al cambiar de pestaña. */
function DesplazarArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function LayoutPaciente() {
  const usuario = useUsuario();
  const navegar = useNavigate();
  const { reiniciar } = useDatos();

  // El nombre completo va en el avatar; en el saludo solo el primer nombre.
  const nombre = usuario?.nombre ?? '';
  const primerNombre = nombre.split(' ')[0] ?? '';

  async function salir() {
    await api.cerrarSesionUsuario();
    navegar('/', { replace: true });
  }

  return (
    <div className="flex min-h-dvh flex-col bg-slate-50">
      <DesplazarArriba />

      <header className="bg-petroleo-800 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-6 py-4">
          <span className="flex min-w-0 items-center gap-2.5">
            <span
              className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white/15 text-xs font-semibold tracking-tight"
              aria-hidden
            >
              DT
            </span>
            <span className="truncate text-sm font-medium text-white/85">{CLINICA.nombre}</span>
          </span>

          <button
            type="button"
            onClick={salir}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 text-sm font-medium text-white/75 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            Salir
          </button>
        </div>

        <div className="mx-auto max-w-3xl px-6 pb-8 pt-3">
          <div className="flex items-center gap-4">
            <span
              className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-white/15 text-lg font-semibold ring-1 ring-white/20"
              aria-hidden
            >
              {iniciales(nombre)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-3xl font-semibold tracking-tight">Hola, {primerNombre}</p>
              <p className="mt-0.5 text-sm text-white/65">Este es tu portal de paciente</p>
            </div>
          </div>

          {/*
            Pedir cita vive en el marco, no dentro de una pantalla: antes solo
            aparecía en el estado vacío, así que una paciente que ya tenía una
            cita agendada no encontraba por dónde pedir la siguiente. Es la
            acción principal del portal y tiene que estar siempre a la vista.
          */}
          <Boton
            a="/agendar"
            variante="claro"
            tamano="lg"
            anchoCompleto
            className="mt-6 sm:w-auto"
            icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
          >
            Pedir cita
          </Boton>
        </div>
      </header>

      {/* Pegada arriba: en el celular la navegación no puede quedar fuera de pantalla. */}
      {/*
        Pegada arriba y elevada sobre el contenido: en el celular la navegación
        no puede quedar fuera de pantalla, y la pastilla marca la pestaña activa
        con más claridad que un subrayado fino.
      */}
      <nav className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl gap-2 px-4 py-2.5">
          {PESTANAS.map(({ a, etiqueta, icono: Icono }) => (
            <NavLink
              key={a}
              to={a}
              end
              className={({ isActive }) =>
                `flex flex-1 items-center justify-center gap-2 rounded-2xl px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-petroleo-50 text-petroleo-700'
                    : 'text-slate-500 hover:bg-slate-100/70 hover:text-slate-800'
                }`
              }
            >
              <Icono className="h-4 w-4 shrink-0" aria-hidden />
              {etiqueta}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
        <Outlet />
      </main>

      {/*
        El botón de reiniciar también vive aquí, no solo en el pie público: si
        durante la reunión hay que volver a empezar, no obliga a cerrar sesión
        primero.
      */}
      <footer className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 border-t border-slate-200/60 px-6 py-6 pb-seguro">
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
    </div>
  );
}
