/**
 * Bandeja de solicitudes pendientes: el corazón del panel.
 *
 * Es lo que se demuestra en la reunión — la paciente pide una cita desde su
 * portal en un celular y aquí aparece sola, sin recargar, porque `useConsulta`
 * se repite cuando cambia la revisión del estado compartido.
 *
 * El odontólogo solo ve las solicitudes dirigidas a él; la secretaria y el
 * administrador las ven todas. Eso no se decide aquí sino en `permisos.ts`.
 */

import { useMemo, useState } from 'react';
import { Inbox } from 'lucide-react';
import type { SolicitudCita } from '@compartido/tipos';
import { useUsuario } from '@compartido/auth';
import { useConsulta } from '@compartido/contexto';
import { puedeResolverSolicitud } from '@compartido/permisos';
import * as api from '@compartido/mockApi';
import Esqueleto from '@componentes/ui/Esqueleto';
import EstadoVacio from '@componentes/ui/EstadoVacio';
import Tarjeta from '@componentes/ui/Tarjeta';
import FilaSolicitud from './FilaSolicitud';
import ResolverSolicitud from './ResolverSolicitud';

export default function BandejaSolicitudes() {
  const usuario = useUsuario();
  const [enResolucion, setEnResolucion] = useState<SolicitudCita | null>(null);

  const consulta = useConsulta(api.obtenerSolicitudesPendientes, []);

  const solicitudes = useMemo(
    () => (consulta.datos ?? []).filter((s) => puedeResolverSolicitud(usuario, s)),
    [consulta.datos, usuario],
  );

  return (
    <section>
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <div>
          <p className="rotulo">Bandeja</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-slate-900">
            Solicitudes por resolver
          </h2>
        </div>
        {solicitudes.length > 0 && (
          <span className="shrink-0 rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold tabular-nums text-amber-900 ring-1 ring-inset ring-amber-600/15">
            {solicitudes.length}
          </span>
        )}
      </div>

      <Tarjeta destacada={solicitudes.length > 0} className="overflow-hidden">
        {consulta.cargando ? (
          <div className="space-y-4 p-6">
            {[0, 1].map((indice) => (
              <div key={indice} className="space-y-2.5">
                <Esqueleto className="h-5 w-2/5" />
                <Esqueleto className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : solicitudes.length === 0 ? (
          <EstadoVacio
            icono={<Inbox className="h-6 w-6" aria-hidden />}
            titulo="Todo al día"
            descripcion="No hay solicitudes esperando respuesta. Cuando un paciente pida una cita desde el portal, aparecerá aquí."
          />
        ) : (
          /*
            Sin líneas divisorias: con dos o tres solicitudes el espacio separa
            mejor que una regla, y deja que el resalte redondeado del hover se
            vea entero.
          */
          <ul className="space-y-1 p-2">
            {solicitudes.map((solicitud) => (
              <FilaSolicitud
                key={solicitud.id}
                solicitud={solicitud}
                alResolver={() => setEnResolucion(solicitud)}
              />
            ))}
          </ul>
        )}
      </Tarjeta>

      {enResolucion && (
        <ResolverSolicitud
          solicitud={enResolucion}
          alCerrar={() => setEnResolucion(null)}
        />
      )}
    </section>
  );
}
