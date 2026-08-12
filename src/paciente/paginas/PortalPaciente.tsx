/**
 * Portada del portal del paciente.
 *
 * Orden deliberado, de arriba abajo: lo que exige una decisión hoy (una
 * contrapropuesta de horario), luego lo que hay que recordar (la próxima cita),
 * después el avance del tratamiento y el dinero, y al final lo que solo se
 * consulta de vez en cuando. En un celular, lo que queda debajo del pliegue es
 * lo que nadie mira.
 *
 * Todas las consultas se rehacen solas cuando cambia el estado compartido —lo
 * hace useConsulta—, así que un cambio hecho desde el panel de la clínica en
 * otra pestaña aparece aquí sin recargar.
 */

import { CalendarCheck2, CalendarDays, CalendarPlus, CalendarRange, History } from 'lucide-react';
import { useUsuario } from '@compartido/auth';
import { useConsulta } from '@compartido/contexto';
import { destinatarioDe } from '@compartido/mensajeria';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';
import Esqueleto from '@componentes/ui/Esqueleto';
import EstadoVacio from '@componentes/ui/EstadoVacio';
import Tarjeta from '@componentes/ui/Tarjeta';
import AvisoCuota from '@paciente/inicio/AvisoCuota';
import AvisosRecientes from '@paciente/inicio/AvisosRecientes';
import CalendarioCitas from '@paciente/inicio/CalendarioCitas';
import ListaCitas from '@paciente/inicio/ListaCitas';
import ProgresoTratamiento from '@paciente/inicio/ProgresoTratamiento';
import TarjetaProximaCita from '@paciente/inicio/TarjetaProximaCita';
import TarjetaSolicitudEnCurso from '@paciente/inicio/TarjetaSolicitudEnCurso';
import { resumirCuotas } from '@paciente/cuenta/resumenCuotas';

export default function PortalPaciente() {
  const usuario = useUsuario();
  const pacienteId = usuario?.pacienteId ?? '';

  const paciente = useConsulta(() => api.obtenerPaciente(pacienteId), [pacienteId]);
  const proximaCita = useConsulta(() => api.obtenerProximaCita(pacienteId), [pacienteId]);
  const solicitud = useConsulta(() => api.obtenerSolicitudEnCurso(pacienteId), [pacienteId]);
  const tratamiento = useConsulta(() => api.obtenerTratamientoActivo(pacienteId), [pacienteId]);
  const citas = useConsulta(() => api.obtenerCitas(pacienteId), [pacienteId]);
  const notificaciones = useConsulta(() => api.obtenerNotificaciones(pacienteId), [pacienteId]);
  const profesionales = useConsulta(() => api.obtenerProfesionales(), []);

  const tratamientoId = tratamiento.datos?.id ?? '';
  const cuotas = useConsulta(
    () => (tratamientoId ? api.obtenerCuotas(tratamientoId) : Promise.resolve([])),
    [tratamientoId],
  );

  const nombrePorProfesional = Object.fromEntries(
    (profesionales.datos ?? []).map((p) => [p.id, p.nombre]),
  );

  // Tres montones distintos: la que se muestra arriba en grande, las demás que
  // todavía no llegan, y las que ya pasaron o se cancelaron. Mezclar las dos
  // últimas haría que una cita futura apareciera bajo el rótulo "historial".
  const ahora = Date.now();
  const restantes = (citas.datos ?? []).filter((c) => c.id !== proximaCita.datos?.id);
  const esFutura = (fechaHora: string) => new Date(fechaHora).getTime() >= ahora;
  const proximas = restantes
    .filter((c) => c.estado === 'confirmada' && esFutura(c.fechaHora))
    .sort((a, b) => new Date(a.fechaHora).getTime() - new Date(b.fechaHora).getTime());
  const historial = restantes.filter((c) => !(c.estado === 'confirmada' && esFutura(c.fechaHora)));

  // La portada espera solo a las dos consultas que deciden su forma; las demás
  // van llegando y se dibujan cuando estén.
  if (proximaCita.cargando || solicitud.cargando) {
    return (
      <div className="space-y-8">
        <Esqueleto className="h-64 w-full rounded-3xl" />
        <Esqueleto className="h-40 w-full rounded-3xl" />
        <Esqueleto className="h-24 w-full rounded-3xl" />
      </div>
    );
  }

  const sinNadaPendiente = !proximaCita.datos && !solicitud.datos;

  return (
    <div className="space-y-8">
      {solicitud.datos && <TarjetaSolicitudEnCurso solicitud={solicitud.datos} />}

      {proximaCita.datos && (
        <TarjetaProximaCita
          cita={proximaCita.datos}
          nombreProfesional={nombrePorProfesional[proximaCita.datos.profesionalId]}
        />
      )}

      {/*
        Cuando no hay nada pendiente, el hueco de la tarjeta principal lo ocupa el
        estado vacío de siempre: misma silueta y mismos márgenes que el resto de
        vacíos de la aplicación, para que la pantalla no se vea a medio dibujar.
      */}
      {sinNadaPendiente && (
        <Tarjeta destacada>
          <EstadoVacio
            icono={<CalendarDays className="h-6 w-6" aria-hidden strokeWidth={1.5} />}
            titulo="No tienes citas programadas"
            descripcion={
              tratamiento.datos
                ? 'Tu control de ortodoncia es cada mes. Pide el siguiente cuando quieras.'
                : 'Cuando quieras agendar, pide tu cita desde aquí.'
            }
            accion={
              <Boton
                a="/agendar"
                tamano="lg"
                icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
              >
                Pedir una cita
              </Boton>
            }
          />
        </Tarjeta>
      )}

      {/*
        Va justo debajo de la próxima cita porque contesta la pregunta que sigue
        de forma natural a "¿cuándo es la próxima?": cómo viene el resto del mes.
        Se dibuja solo cuando ya hay citas cargadas.
      */}
      {!citas.cargando && (
        <CalendarioCitas
          citas={citas.datos ?? []}
          nombrePorProfesional={nombrePorProfesional}
        />
      )}

      {tratamiento.datos && (
        <ProgresoTratamiento
          tratamiento={tratamiento.datos}
          nombreProfesional={nombrePorProfesional[tratamiento.datos.profesionalId]}
        />
      )}

      {tratamiento.datos && cuotas.datos && cuotas.datos.length > 0 && (
        <AvisoCuota resumen={resumirCuotas(cuotas.datos)} />
      )}

      {!citas.cargando && (
        <>
          <ListaCitas
            titulo="Más adelante"
            icono={<CalendarRange className="h-5 w-5" aria-hidden strokeWidth={1.5} />}
            citas={proximas}
            nombrePorProfesional={nombrePorProfesional}
          />
          <ListaCitas
            titulo="Historial de citas"
            icono={<History className="h-5 w-5" aria-hidden strokeWidth={1.5} />}
            citas={historial}
            nombrePorProfesional={nombrePorProfesional}
            plegable
            vacio={{
              icono: <CalendarCheck2 className="h-6 w-6" aria-hidden strokeWidth={1.5} />,
              titulo: 'Todavía no hay citas anteriores',
              descripcion: 'Aquí van a quedar registradas todas tus visitas a la clínica.',
            }}
          />
        </>
      )}

      {notificaciones.datos && (
        <AvisosRecientes
          notificaciones={notificaciones.datos}
          destinatario={paciente.datos ? destinatarioDe(paciente.datos).numero : undefined}
        />
      )}
    </div>
  );
}
