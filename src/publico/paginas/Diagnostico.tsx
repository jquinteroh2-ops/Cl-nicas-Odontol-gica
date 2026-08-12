/**
 * Pantalla de verificación de la fase 1. No forma parte del producto.
 *
 * Sirve para comprobar de una sola mirada las tres cosas que sostienen el demo:
 *  1. la sesión es por pestaña —cada pestaña puede tener un usuario distinto—;
 *  2. los datos son compartidos y se propagan entre pestañas sin recargar;
 *  3. cada acción queda firmada en la bitácora por quien la hizo.
 */

import { useState } from 'react';
import { addDays } from 'date-fns';
import { AlertCircle, Check, LogOut, RefreshCw, Radio, Send, X } from 'lucide-react';
import { useAccion, useConsulta, useDatos } from '@compartido/contexto';
import { useUsuario } from '@compartido/auth';
import { DIAGNOSTICO_SYNC, ID_PESTANA } from '@compartido/sync';
import * as api from '@compartido/mockApi';
import {
  ETIQUETA_CAPACIDAD,
  ETIQUETA_ROL,
  TODAS_LAS_CAPACIDADES,
  puede,
} from '@compartido/permisos';
import {
  ETIQUETA_TIPO_CITA,
  formatoFechaHoraLarga,
  formatoHora,
  nombreCompleto,
} from '@compartido/formato';
import { CLINICA } from '@compartido/clinica';
import Boton from '@componentes/ui/Boton';
import Insignia from '@componentes/ui/Insignia';

const ACCESOS = [
  { etiqueta: 'Paciente · Camila', tipo: 'paciente' as const },
  { etiqueta: 'Secretaria', tipo: 'personal' as const, usuario: 'secretaria' },
  { etiqueta: 'Odontóloga', tipo: 'personal' as const, usuario: 'doctora' },
  { etiqueta: 'Administrador', tipo: 'personal' as const, usuario: 'admin' },
];

export default function Diagnostico() {
  const { estado, reiniciar, revision } = useDatos();
  const usuario = useUsuario();
  const [mensaje, setMensaje] = useState<string | null>(null);

  const pendientes = useConsulta(() => api.obtenerSolicitudesPendientes());
  const bitacora = useConsulta(() => api.obtenerBitacora());

  const entrarPaciente = useAccion(api.iniciarSesionPaciente);
  const entrarPersonal = useAccion(api.iniciarSesionPersonal);
  const crear = useAccion(api.crearSolicitudCita);
  const aprobar = useAccion(api.aprobarSolicitud);

  const pacienteEnSesion = usuario?.pacienteId
    ? estado.pacientes.find((p) => p.id === usuario.pacienteId)
    : undefined;

  async function entrar(acceso: (typeof ACCESOS)[number]) {
    setMensaje(null);
    if (acceso.tipo === 'paciente') {
      await entrarPaciente.ejecutar({
        tipoDocumento: 'CC',
        numeroDocumento: '1047882331',
        codigoAcceso: '1234',
      });
    } else {
      await entrarPersonal.ejecutar({ usuario: acceso.usuario!, clave: 'clinica123' });
    }
  }

  async function solicitarControl() {
    if (!usuario?.pacienteId) return;
    const franjas = await api.obtenerFranjasDisponibles(
      addDays(new Date(), 9),
      'control',
      usuario.pacienteId,
    );
    if (franjas.length === 0) {
      setMensaje('No hay franjas libres ese día.');
      return;
    }
    const resultado = await crear.ejecutar({
      pacienteId: usuario.pacienteId,
      tipo: 'control',
      fechaHoraSolicitada: franjas[Math.floor(franjas.length / 2)].inicio,
    });
    if (resultado) {
      setMensaje(
        resultado.cita
          ? `Cita confirmada al instante: ${formatoFechaHoraLarga(resultado.cita.fechaHora)}`
          : 'Solicitud enviada. Queda pendiente de aprobación.',
      );
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12 pb-seguro">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-petroleo-600">
          {CLINICA.nombre} · Fase 1
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">
          Verificación de sesiones y sincronización
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-600">
          Pantalla temporal. Abre esta dirección en dos pestañas, entra con un usuario distinto en
          cada una y comprueba que las sesiones no se pisan mientras los datos sí se comparten.
        </p>
      </header>

      {/* ------------------------------------------------ sesión de esta pestaña */}
      <section className="mb-5 rounded-3xl bg-white p-6 shadow-suave ring-1 ring-slate-200/70">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="rotulo">Sesión de esta pestaña</p>
            {usuario ? (
              <>
                <p className="mt-2 truncate text-lg font-semibold tracking-tight text-slate-900">
                  {usuario.nombre}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Insignia tono="petroleo">{ETIQUETA_ROL[usuario.rol]}</Insignia>
                  <span className="font-mono text-xs text-slate-400">
                    pestaña {ID_PESTANA.slice(0, 8)}
                  </span>
                </div>
              </>
            ) : (
              <>
                <p className="mt-2 text-lg font-semibold tracking-tight text-slate-400">
                  Sin sesión
                </p>
                <span className="font-mono text-xs text-slate-400">
                  pestaña {ID_PESTANA.slice(0, 8)}
                </span>
              </>
            )}
          </div>

          {usuario && (
            <button
              type="button"
              onClick={() => api.cerrarSesionUsuario()}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
            >
              <LogOut className="h-4 w-4" aria-hidden />
              Salir
            </button>
          )}
        </div>

        <div className="mt-5 flex flex-wrap gap-2.5">
          {ACCESOS.map((acceso) => (
            <Boton
              key={acceso.etiqueta}
              variante="secundario"
              alPulsar={() => entrar(acceso)}
              deshabilitado={entrarPaciente.enCurso || entrarPersonal.enCurso}
            >
              {acceso.etiqueta}
            </Boton>
          ))}
        </div>

        {(entrarPaciente.error || entrarPersonal.error) && (
          <p className="mt-3 text-sm text-red-700">{entrarPaciente.error ?? entrarPersonal.error}</p>
        )}

        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          Credenciales de prueba: paciente CC 1.047.882.331 con código 1234 · personal{' '}
          <span className="font-mono">secretaria</span> / <span className="font-mono">doctora</span> /{' '}
          <span className="font-mono">admin</span>, contraseña{' '}
          <span className="font-mono">clinica123</span>.
        </p>
      </section>

      {/* --------------------------------------------------------- permisos */}
      {usuario && (
        <section className="mb-5 rounded-3xl bg-white p-6 shadow-suave ring-1 ring-slate-200/70">
          <p className="rotulo">Permisos de {ETIQUETA_ROL[usuario.rol].toLowerCase()}</p>
          <ul className="mt-4 grid gap-x-6 gap-y-2 sm:grid-cols-2">
            {TODAS_LAS_CAPACIDADES.map((capacidad) => {
              const habilitada = puede(usuario, capacidad);
              return (
                <li key={capacidad} className="flex items-center gap-2 text-sm">
                  {habilitada ? (
                    <Check className="h-4 w-4 shrink-0 text-emerald-600" aria-hidden />
                  ) : (
                    <X className="h-4 w-4 shrink-0 text-slate-300" aria-hidden />
                  )}
                  <span className={habilitada ? 'text-slate-800' : 'text-slate-400'}>
                    {ETIQUETA_CAPACIDAD[capacidad]}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* ------------------------------------------------- estado compartido */}
      <section className="mb-5 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200/70">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Radio className="h-4 w-4 text-petroleo-600" aria-hidden />
          Estado compartido entre pestañas
        </div>
        <p className="mt-2 text-sm text-slate-600">
          Revisión{' '}
          <span className="text-lg font-semibold tabular-nums text-petroleo-700">{revision}</span> ·
          canal {DIAGNOSTICO_SYNC.soportaCanal ? 'BroadcastChannel' : 'evento storage'}
        </p>
        <dl className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
          {[
            ['Pacientes', estado.pacientes.length],
            ['Usuarios', estado.usuarios.length],
            ['Citas', estado.citas.length],
            ['Solicitudes', estado.solicitudes.length],
            ['Cuotas', estado.cuotas.length],
            ['Bitácora', estado.bitacora.length],
          ].map(([etiqueta, valor]) => (
            <div
              key={etiqueta}
              className="rounded-2xl bg-white p-3.5 text-center shadow-suave ring-1 ring-slate-200/70"
            >
              <dt className="text-lg font-semibold tabular-nums text-slate-900">{valor}</dt>
              <dd className="mt-0.5 text-xs text-slate-500">{etiqueta}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs leading-relaxed text-slate-500">
          La revisión debe subir en las dos pestañas a la vez. Si sube en una y en la otra no, la
          sincronización está rota.
        </p>
      </section>

      {/* ------------------------------------------------------ acción según rol */}
      <section className="mb-5 rounded-3xl bg-white p-6 shadow-suave ring-1 ring-slate-200/70">
        <p className="rotulo">Acción disponible para este rol</p>

        {!usuario && <p className="mt-3 text-sm text-slate-500">Entra con algún usuario primero.</p>}

        {usuario?.rol === 'paciente' && (
          <div className="mt-3">
            <p className="text-sm text-slate-600">
              Como {pacienteEnSesion ? nombreCompleto(pacienteEnSesion) : 'paciente'}, un control de
              ortodoncia se confirma solo. Debe aparecer en la otra pestaña al instante.
            </p>
            <div className="mt-3">
              <Boton
                alPulsar={solicitarControl}
                cargando={crear.enCurso}
                icono={<Send className="h-4 w-4" aria-hidden />}
              >
                Solicitar control
              </Boton>
            </div>
          </div>
        )}

        {usuario && usuario.rol !== 'paciente' && (
          <div className="mt-3">
            <p className="text-sm text-slate-600">
              Bandeja de la clínica · {pendientes.datos?.length ?? 0} solicitudes por decidir.
            </p>
            {pendientes.cargando ? (
              <p className="mt-3 text-sm text-slate-500">Cargando…</p>
            ) : pendientes.datos && pendientes.datos.length > 0 ? (
              <ul className="mt-3 divide-y divide-slate-100">
                {pendientes.datos.map((solicitud) => {
                  const paciente = estado.pacientes.find((p) => p.id === solicitud.pacienteId);
                  const quien = solicitud.datosContacto
                    ? nombreCompleto(solicitud.datosContacto)
                    : paciente
                      ? nombreCompleto(paciente)
                      : 'Paciente';
                  return (
                    <li key={solicitud.id} className="flex items-center justify-between gap-3 py-3">
                      <div className="min-w-0 text-sm">
                        <p className="truncate font-medium text-slate-800">{quien}</p>
                        <p className="truncate text-slate-500">
                          {ETIQUETA_TIPO_CITA[solicitud.tipo]} ·{' '}
                          {formatoFechaHoraLarga(solicitud.fechaHoraSolicitada)}
                        </p>
                      </div>
                      <Boton
                        alPulsar={() => aprobar.ejecutar(solicitud.id)}
                        deshabilitado={aprobar.enCurso}
                      >
                        Aprobar
                      </Boton>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-3 text-sm text-slate-500">No hay solicitudes pendientes.</p>
            )}
          </div>
        )}

        {(mensaje || crear.error || aprobar.error) && (
          <p className="mt-5 flex items-start gap-2.5 rounded-2xl bg-slate-50 p-4 text-sm leading-relaxed text-slate-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-petroleo-600" aria-hidden />
            {crear.error ?? aprobar.error ?? mensaje}
          </p>
        )}
      </section>

      {/* ---------------------------------------------------------- bitácora */}
      <section className="mb-8 rounded-3xl bg-white p-6 shadow-suave ring-1 ring-slate-200/70">
        <p className="rotulo">Últimos movimientos registrados</p>
        <p className="mt-2 text-xs text-slate-500">
          Cada acción queda firmada por el usuario de la pestaña que la hizo.
        </p>
        <ul className="mt-4 space-y-3">
          {(bitacora.datos ?? []).slice(0, 6).map((registro) => (
            <li key={registro.id} className="flex gap-3 text-sm">
              <span className="shrink-0 font-mono text-xs text-slate-400">
                {formatoHora(registro.fechaHora)}
              </span>
              <span className="min-w-0">
                <span className="font-medium text-slate-800">{registro.accion}</span>
                <span className="text-slate-500"> · {registro.detalle}</span>
                <span className="block text-xs text-slate-400">
                  {registro.nombreUsuario} · {ETIQUETA_ROL[registro.rol].toLowerCase()}
                </span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <footer className="flex items-center justify-between gap-3 border-t border-slate-200/70 pt-6">
        <p className="text-xs text-slate-500">Versión de demostración · datos ficticios</p>
        <button
          type="button"
          onClick={reiniciar}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <RefreshCw className="h-3.5 w-3.5" aria-hidden />
          Reiniciar demostración
        </button>
      </footer>
    </div>
  );
}
