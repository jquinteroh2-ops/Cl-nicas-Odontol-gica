/**
 * Pie común. Contiene el aviso permanente de demostración y el botón de reinicio,
 * sin el cual el demo solo se podría mostrar una vez.
 */

import { MapPin, MessageCircle, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  AVISO_DEMO,
  AVISO_DEMO_DETALLE,
  CLINICA,
  DIRECCION_COMPLETA,
  REDES,
  enlaceWhatsApp,
} from '@compartido/clinica';
import { formatoTelefono } from '@compartido/formato';
import { useDatos } from '@compartido/contexto';
import IconoRed from '@componentes/ui/IconoRed';

export default function PieDePagina() {
  const { reiniciar } = useDatos();

  return (
    <footer className="mt-auto border-t border-slate-100 bg-slate-50">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-3">
          <div>
            <p className="font-semibold tracking-tight text-slate-900">{CLINICA.nombre}</p>
            <p className="mt-1.5 text-sm text-slate-600">{CLINICA.descripcion}</p>
            <p className="mt-4 text-sm text-slate-500">
              {CLINICA.aniosTrayectoria} años en Turbaco
            </p>

            <div className="mt-5 flex items-center gap-2">
              {REDES.map((red) => (
                <a
                  key={red.nombre}
                  href={red.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={red.nombre}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200/70 transition-all duration-200 hover:-translate-y-0.5 hover:text-petroleo-700 hover:ring-petroleo-200"
                >
                  <IconoRed tipo={red.icono} className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <p className="rotulo">Contacto</p>
            <a
              href={enlaceWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-slate-700 transition-colors hover:text-petroleo-700"
            >
              <MessageCircle className="h-4 w-4 shrink-0" aria-hidden />
              {formatoTelefono(CLINICA.whatsapp)}
            </a>
            <p className="mt-3 flex items-start gap-2 text-sm text-slate-600">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" aria-hidden />
              <span>{DIRECCION_COMPLETA}</span>
            </p>
          </div>

          <div>
            <p className="rotulo">Pacientes</p>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li>
                <Link to="/agendar" className="text-slate-700 hover:text-petroleo-700">
                  Agendar cita
                </Link>
              </li>
              <li>
                <Link to="/ingresar" className="text-slate-700 hover:text-petroleo-700">
                  Ya soy paciente
                </Link>
              </li>
            </ul>

            {/* Bloque aparte: no es una opción para pacientes y no debe leerse como tal. */}
            <p className="rotulo mt-8">Clínica</p>
            <p className="mt-3 text-sm">
              <Link to="/acceso" className="text-slate-700 hover:text-petroleo-700">
                Acceso del personal
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-slate-200/70 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-600">{AVISO_DEMO}</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">{AVISO_DEMO_DETALLE}</p>
          </div>
          <button
            type="button"
            onClick={reiniciar}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl px-3.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-200/60 hover:text-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" aria-hidden />
            Reiniciar demostración
          </button>
        </div>
      </div>
    </footer>
  );
}
