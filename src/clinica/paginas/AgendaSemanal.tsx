/**
 * Agenda semanal de la clínica.
 *
 * Dos vistas del mismo dato según el ancho: rejilla horaria de lunes a sábado
 * en tableta y escritorio, y día a día en celular. El filtro por profesional
 * solo lo ve quien puede mirar la agenda completa; el odontólogo entra ya
 * acotado a la suya y no puede quitarse el filtro.
 */

import { useMemo, useState } from 'react';
import { addDays, addWeeks, format, isSameDay, isToday, startOfWeek, subWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUsuario } from '@compartido/auth';
import { useConsulta } from '@compartido/contexto';
import { claveDia } from '@compartido/disponibilidad';
import { profesionalVisible, puede } from '@compartido/permisos';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';
import Esqueleto from '@componentes/ui/Esqueleto';
import Tarjeta from '@componentes/ui/Tarjeta';
import RejillaSemana from '@clinica/agenda/RejillaSemana';
import ListaDia from '@clinica/agenda/ListaDia';
import DetalleCita from '@clinica/agenda/DetalleCita';
import NuevaCita from '@clinica/agenda/NuevaCita';
import type { CitaConContexto } from '@clinica/agenda/tipos';

/** Lunes a sábado. El domingo no se dibuja porque la clínica cierra. */
function diasDeLaSemana(referencia: Date): Date[] {
  const lunes = startOfWeek(referencia, { weekStartsOn: 1 });
  return Array.from({ length: 6 }, (_, indice) => addDays(lunes, indice));
}

export default function AgendaSemanal() {
  const usuario = useUsuario();
  const forzado = profesionalVisible(usuario);
  const puedeFiltrar = puede(usuario, 'ver_agenda_clinica');

  const [referencia, setReferencia] = useState(() => new Date());
  const [diaMovil, setDiaMovil] = useState(() => claveDia(new Date()));
  const [filtro, setFiltro] = useState<string | null>(null);
  const [abierta, setAbierta] = useState<CitaConContexto | null>(null);
  const [agendando, setAgendando] = useState(false);
  const puedeAgendar = puede(usuario, 'agendar_directo');

  const dias = useMemo(() => diasDeLaSemana(referencia), [referencia]);
  const profesionalConsultado = forzado ?? filtro;

  const consulta = useConsulta(async () => {
    const [citas, pacientes, profesionales] = await Promise.all([
      api.obtenerAgendaSemana(referencia, profesionalConsultado),
      api.buscarPacientes(''),
      api.obtenerProfesionales(),
    ]);
    return { citas, pacientes, profesionales };
  }, [referencia, profesionalConsultado]);

  const entradas: CitaConContexto[] = useMemo(() => {
    if (!consulta.datos) return [];
    const { citas, pacientes, profesionales } = consulta.datos;
    return citas
      .filter((cita) => cita.estado !== 'cancelada')
      .map((cita) => ({
        cita,
        paciente: pacientes.find((p) => p.id === cita.pacienteId),
        profesional: profesionales.find((p) => p.id === cita.profesionalId),
      }));
  }, [consulta.datos]);

  const profesionales = consulta.datos?.profesionales ?? [];
  const delDiaMovil = entradas.filter(({ cita }) => claveDia(cita.fechaHora) === diaMovil);

  const primero = dias[0];
  const ultimo = dias[dias.length - 1];
  const rango =
    primero.getMonth() === ultimo.getMonth()
      ? `${format(primero, 'd')} al ${format(ultimo, "d 'de' MMMM", { locale: es })}`
      : `${format(primero, "d 'de' MMM", { locale: es })} al ${format(ultimo, "d 'de' MMM", { locale: es })}`;

  function irAHoy() {
    const ahora = new Date();
    setReferencia(ahora);
    setDiaMovil(claveDia(ahora));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="rotulo">Agenda</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            Semana del {rango}
          </h1>
        </div>

        {puedeAgendar && (
          <Boton
            alPulsar={() => setAgendando(true)}
            icono={<CalendarPlus className="h-5 w-5" aria-hidden />}
          >
            Nueva cita
          </Boton>
        )}
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setReferencia(subWeeks(referencia, 1))}
          aria-label="Semana anterior"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-500 shadow-suave ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={() => setReferencia(addWeeks(referencia, 1))}
          aria-label="Semana siguiente"
          className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-500 shadow-suave ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
        <button
          type="button"
          onClick={irAHoy}
          className="rounded-2xl bg-white px-4 text-sm font-medium text-slate-700 shadow-suave ring-1 ring-slate-200/70 transition-colors hover:bg-slate-50"
        >
          Hoy
        </button>

        {puedeFiltrar && profesionales.length > 1 && (
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFiltro(null)}
              aria-pressed={filtro === null}
              className={`rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
                filtro === null
                  ? 'bg-petroleo-600 text-white shadow-suave'
                  : 'bg-white text-slate-600 ring-1 ring-slate-200/70 hover:bg-slate-50'
              }`}
            >
              Todas
            </button>
            {profesionales.map((profesional) => (
              <button
                key={profesional.id}
                type="button"
                onClick={() => setFiltro(profesional.id)}
                aria-pressed={filtro === profesional.id}
                className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-medium transition-all ${
                  filtro === profesional.id
                    ? 'bg-petroleo-600 text-white shadow-suave'
                    : 'bg-white text-slate-600 ring-1 ring-slate-200/70 hover:bg-slate-50'
                }`}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: profesional.color }}
                  aria-hidden
                />
                {profesional.nombre}
              </button>
            ))}
          </div>
        )}
      </div>

      {consulta.cargando ? (
        <Esqueleto className="h-96 w-full rounded-3xl" />
      ) : (
        <>
          {/* Celular: tira de días y lista del elegido. */}
          <div className="md:hidden">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {dias.map((dia) => {
                const clave = claveDia(dia);
                const activo = clave === diaMovil;
                const cuantas = entradas.filter(({ cita }) => isSameDay(new Date(cita.fechaHora), dia)).length;
                return (
                  <button
                    key={clave}
                    type="button"
                    onClick={() => setDiaMovil(clave)}
                    aria-pressed={activo}
                    className={`flex shrink-0 flex-col items-center rounded-2xl px-3.5 py-2.5 transition-all ${
                      activo
                        ? 'bg-petroleo-600 text-white shadow-suave'
                        : 'bg-white text-slate-600 shadow-suave ring-1 ring-slate-200/70'
                    }`}
                  >
                    <span className={`text-[11px] uppercase ${activo ? 'text-white/70' : 'text-slate-400'}`}>
                      {format(dia, 'EEE', { locale: es })}
                    </span>
                    <span className="text-sm font-semibold tabular-nums">{format(dia, 'd')}</span>
                    <span
                      className={`mt-1 h-1.5 w-1.5 rounded-full ${
                        cuantas === 0
                          ? 'bg-transparent'
                          : activo
                            ? 'bg-white'
                            : isToday(dia)
                              ? 'bg-petroleo-600'
                              : 'bg-slate-300'
                      }`}
                      aria-hidden
                    />
                  </button>
                );
              })}
            </div>

            <Tarjeta className="mt-3 overflow-hidden">
              <ListaDia citas={delDiaMovil} alAbrirCita={setAbierta} />
            </Tarjeta>
          </div>

          {/* Tableta y escritorio: rejilla horaria completa. */}
          <Tarjeta className="hidden overflow-hidden md:block">
            <RejillaSemana dias={dias} citas={entradas} alAbrirCita={setAbierta} />
          </Tarjeta>
        </>
      )}

      {abierta && <DetalleCita entrada={abierta} alCerrar={() => setAbierta(null)} />}
      {agendando && <NuevaCita alCerrar={() => setAgendando(false)} />}
    </div>
  );
}
