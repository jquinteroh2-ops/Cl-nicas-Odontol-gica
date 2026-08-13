/**
 * Encabezado público. Fijo arriba y con el botón de agendar siempre a la vista:
 * en un celular, esa es la única acción que no puede quedar fuera de pantalla.
 *
 * Sobre la portada empieza transparente —la foto se ve entera— y se vuelve
 * blanco en cuanto se baja unos píxeles. En el resto de rutas nace blanco, que
 * es lo que necesitan las pantallas de formulario.
 */

import { useEffect, useMemo, useState } from 'react';
import { CalendarPlus, Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { CLINICA, REDES } from '@compartido/clinica';
import Boton from '@componentes/ui/Boton';
import IconoRed from '@componentes/ui/IconoRed';
import usarSeccionActiva from './usarSeccionActiva';

const SECCIONES = [
  { id: 'inicio', etiqueta: 'Inicio' },
  { id: 'nosotros', etiqueta: 'Nosotros' },
  { id: 'servicios', etiqueta: 'Servicios' },
  { id: 'actualidad', etiqueta: 'Actualidad' },
  { id: 'contacto', etiqueta: 'Contacto' },
];

const IDS = SECCIONES.map((seccion) => seccion.id);

export default function Encabezado() {
  const { pathname } = useLocation();
  const enInicio = pathname === '/';
  const enAgendar = pathname.startsWith('/agendar');

  const [desplazado, setDesplazado] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);
  const seccionActiva = usarSeccionActiva(IDS, enInicio);

  // El umbral coincide con el alto de la barra: antes de eso, el fondo blanco
  // aparecería mientras todavía se ve el borde superior de la foto.
  useEffect(() => {
    const revisar = () => setDesplazado(window.scrollY > 24);
    revisar();
    window.addEventListener('scroll', revisar, { passive: true });
    return () => window.removeEventListener('scroll', revisar);
  }, []);

  // El menú desplegable no puede sobrevivir a un cambio de ruta.
  useEffect(() => setMenuAbierto(false), [pathname]);

  const transparente = enInicio && !desplazado && !menuAbierto;

  // Fuera de la portada los enlaces tienen que volver a ella antes de saltar a
  // la sección; dentro basta el ancla, que aprovecha el scroll suave del CSS.
  const enlaces = useMemo(
    () =>
      SECCIONES.map((seccion) => ({
        ...seccion,
        destino: enInicio ? `#${seccion.id}` : `/#${seccion.id}`,
      })),
    [enInicio],
  );

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        transparente
          ? 'bg-transparent py-2'
          : 'border-b border-slate-100/80 bg-white/85 shadow-suave backdrop-blur-md'
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
        <Link
          to="/"
          className="flex min-w-0 items-center gap-3"
          aria-label={`Inicio · ${CLINICA.nombre}`}
        >
          <span
            className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-sm font-semibold tracking-tight transition-colors duration-300 ${
              transparente
                ? 'bg-white/15 text-white ring-1 ring-white/30 backdrop-blur-sm'
                : 'bg-petroleo-600 text-white shadow-suave'
            }`}
            aria-hidden
          >
            DT
          </span>
          <span className="min-w-0">
            <span
              className={`block truncate font-semibold leading-tight tracking-tight transition-colors duration-300 ${
                transparente ? 'text-white' : 'text-slate-900'
              }`}
            >
              {CLINICA.nombre}
            </span>
            <span
              className={`hidden text-xs leading-tight transition-colors duration-300 sm:block ${
                transparente ? 'text-white/70' : 'text-slate-500'
              }`}
            >
              {CLINICA.descripcion}
            </span>
          </span>
        </Link>

        {/* Menú de secciones. Desde lg, que es donde caben cinco entradas más el botón. */}
        <nav className="hidden lg:block" aria-label="Secciones">
          <ul className="flex items-center gap-1">
            {enlaces.map((enlace) => {
              const activo = enInicio && seccionActiva === enlace.id;
              return (
                <li key={enlace.id}>
                  <Link
                    to={enlace.destino}
                    className={`relative inline-flex items-center px-3 py-2 text-sm font-medium transition-colors ${
                      transparente
                        ? 'text-white/80 hover:text-white'
                        : activo
                          ? 'text-petroleo-700'
                          : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {enlace.etiqueta}
                    {/*
                      Subrayado que crece desde el centro. Es un elemento aparte
                      y no un `border-bottom` para poder animar su escala sin
                      mover el texto de sitio.
                    */}
                    <span
                      className={`pointer-events-none absolute inset-x-3 bottom-1 h-0.5 origin-center rounded-full transition-transform duration-300 ease-suave ${
                        transparente ? 'bg-white' : 'bg-petroleo-600'
                      } ${activo ? 'scale-x-100' : 'scale-x-0'}`}
                      aria-hidden
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          <Link
            to="/ingresar"
            className={`hidden items-center rounded-xl px-3.5 py-2 text-sm font-medium transition-colors sm:inline-flex ${
              transparente
                ? 'text-white/85 hover:bg-white/10 hover:text-white'
                : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            Ya soy paciente
          </Link>

          {!enAgendar && (
            <Boton
              a="/agendar"
              variante={transparente ? 'claro' : 'primario'}
              icono={<CalendarPlus className="h-4 w-4" aria-hidden />}
            >
              {/*
                A 390 px, "Agendar cita" más el nombre de la clínica suman unos
                395 px y el nombre se quedaba cortado en "Dentistetic Turb…".
              */}
              <span className="sm:hidden">Cita</span>
              <span className="hidden sm:inline">Pedir cita</span>
            </Boton>
          )}

          <button
            type="button"
            onClick={() => setMenuAbierto((abierto) => !abierto)}
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
            className={`grid h-11 w-11 place-items-center rounded-xl transition-colors lg:hidden ${
              transparente
                ? 'text-white hover:bg-white/10'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            {menuAbierto ? (
              <X className="h-5 w-5" aria-hidden />
            ) : (
              <Menu className="h-5 w-5" aria-hidden />
            )}
          </button>
        </div>
      </div>

      {/*
        Panel de celular. Se despliega con una transición de altura máxima en vez
        de montarse y desmontarse: así el cierre también se ve, que es la mitad
        de la sensación de app.
      */}
      <div
        id="menu-movil"
        className={`overflow-hidden border-slate-100 bg-white transition-all duration-300 ease-suave lg:hidden ${
          menuAbierto ? 'max-h-[44rem] border-t opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <nav className="mx-auto max-w-6xl px-5 py-3 sm:px-8" aria-label="Secciones">
          <ul className="divide-y divide-slate-100">
            {enlaces.map((enlace) => (
              <li key={enlace.id}>
                <Link
                  to={enlace.destino}
                  onClick={() => setMenuAbierto(false)}
                  className={`flex items-center py-3.5 text-base font-medium transition-colors ${
                    enInicio && seccionActiva === enlace.id
                      ? 'text-petroleo-700'
                      : 'text-slate-700 hover:text-petroleo-700'
                  }`}
                >
                  {enlace.etiqueta}
                </Link>
              </li>
            ))}
            <li>
              <Link
                to="/ingresar"
                onClick={() => setMenuAbierto(false)}
                className="flex items-center py-3.5 text-base font-medium text-slate-700"
              >
                Ya soy paciente
              </Link>
            </li>
            <li>
              <Link
                to="/acceso"
                onClick={() => setMenuAbierto(false)}
                className="flex items-center py-3.5 text-base font-medium text-slate-700"
              >
                Acceso del personal
              </Link>
            </li>
          </ul>

          <div className="flex items-center gap-2 py-4">
            {REDES.map((red) => (
              <a
                key={red.nombre}
                href={red.url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={red.nombre}
                className="grid h-11 w-11 place-items-center rounded-xl bg-slate-50 text-slate-600 transition-colors hover:bg-petroleo-50 hover:text-petroleo-700"
              >
                <IconoRed tipo={red.icono} className="h-4.5 w-4.5" />
              </a>
            ))}
          </div>
        </nav>
      </div>
    </header>
  );
}
