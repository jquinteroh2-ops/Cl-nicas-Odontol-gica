/**
 * Inicio del área clínica.
 *
 * El orden de los bloques responde a la pregunta con la que alguien abre esto a
 * las ocho de la mañana: cómo viene el día (indicadores), qué tengo que
 * contestar (bandeja), a quién veo hoy (agenda) y a quién estoy perdiendo
 * (alertas). Ninguna de las cuatro decide por sí sola qué mostrar: todas
 * consultan los permisos del usuario.
 */

import { useUsuario } from '@compartido/auth';
import { formatoFechaConDia } from '@compartido/formato';
import RejillaIndicadores from '@clinica/panel/RejillaIndicadores';
import BandejaSolicitudes from '@clinica/panel/BandejaSolicitudes';
import AgendaDeHoy from '@clinica/panel/AgendaDeHoy';
import AlertasSeguimiento from '@clinica/panel/AlertasSeguimiento';

/** El saludo cambia con la hora: es lo que hace que el panel se sienta vivo. */
function saludo(): string {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export default function PanelClinica() {
  const usuario = useUsuario();
  const primerNombre = (usuario?.nombre ?? '').replace(/^(Dra?\.|Sra?\.)\s*/i, '').split(' ')[0];

  return (
    <div className="space-y-10">
      <header>
        <p className="rotulo">{formatoFechaConDia(new Date())}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {saludo()}, {primerNombre}
        </h1>
      </header>

      <RejillaIndicadores />
      <BandejaSolicitudes />
      <AgendaDeHoy />
      <AlertasSeguimiento />
    </div>
  );
}
