/**
 * Capa de acceso a datos. Única puerta.
 *
 * Objetivo explícito: poder reemplazar este archivo por llamadas HTTP reales sin
 * tocar ni un componente. Por eso todo es asíncrono, todo devuelve promesas y
 * todo falla con ErrorApi. Ningún componente importa los arreglos de datos ni
 * escribe en el almacén por su cuenta.
 *
 * La bitácora se escribe aquí dentro, no en las pantallas: cada mutación toma el
 * usuario de la sesión de la pestaña y firma el registro. Así es imposible
 * olvidar anotar una acción, que es justo lo que el dueño quiere poder auditar.
 */

import { addMinutes, endOfWeek, parseISO, startOfWeek } from 'date-fns';
import type {
  Cita,
  CredencialesPaciente,
  CredencialesPersonal,
  Cuota,
  EntradaSolicitud,
  EstadoDemo,
  FranjaDisponible,
  MetodoPago,
  Notificacion,
  Paciente,
  Profesional,
  RegistroBitacora,
  ResultadoSolicitud,
  Rol,
  SolicitudCita,
  TipoCita,
  TipoNotificacion,
  Tratamiento,
  Usuario,
} from './tipos';
import { actualizarEstado, obtenerEstado } from './sync';
import { cerrarSesion, establecerSesion, usuarioActualId } from './auth';
import {
  DURACION_POR_TIPO,
  claveDia,
  diasConDisponibilidad,
  franjasLibresDelDia,
  profesionalesLibres,
} from './disponibilidad';
import { DIAS_SIN_CONTROL_ALERTA, HORAS_PARA_EXPIRAR } from './datosSemilla';
import { destinatarioDe, redactarMensaje } from './mensajeria';
import { nombreCompleto } from './formato';

/** Error de dominio con mensaje listo para mostrar. */
export class ErrorApi extends Error {
  constructor(
    mensaje: string,
    readonly codigo:
      | 'credenciales'
      | 'franja_ocupada'
      | 'no_encontrado'
      | 'sin_permiso'
      | 'estado_invalido' = 'estado_invalido',
  ) {
    super(mensaje);
    this.name = 'ErrorApi';
  }
}

/** Retardo artificial de 200 a 400 ms: obliga a que la interfaz tenga estados de carga de verdad. */
function retardo(): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, 200 + Math.random() * 200));
}

function nuevoId(prefijo: string): string {
  return `${prefijo}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/* ==================================================================== bitácora == */

interface Actor {
  id: string;
  nombre: string;
  rol: Rol;
}

/** Quién está actuando. Un paciente sin cuenta también deja rastro. */
function actorActual(nombreAlterno?: string): Actor {
  const id = usuarioActualId();
  const usuario = id ? obtenerEstado().usuarios.find((u) => u.id === id) : undefined;
  if (usuario) return { id: usuario.id, nombre: usuario.nombre, rol: usuario.rol };
  return { id: 'anonimo', nombre: nombreAlterno ?? 'Paciente sin cuenta', rol: 'paciente' };
}

/**
 * Añade el asiento de bitácora al mismo cambio de estado que la mutación, para
 * que nunca queden desincronizados.
 */
function conBitacora(
  estado: EstadoDemo,
  actor: Actor,
  accion: string,
  detalle: string,
): RegistroBitacora[] {
  const registro: RegistroBitacora = {
    id: nuevoId('bit'),
    usuarioId: actor.id,
    nombreUsuario: actor.nombre,
    rol: actor.rol,
    accion,
    detalle,
    fechaHora: new Date().toISOString(),
  };
  return [registro, ...estado.bitacora];
}

/* ===================================================================== sesión == */

/** Ingreso de pacientes: documento + código de 4 dígitos. Sin correo ni contraseña. */
export async function iniciarSesionPaciente(credenciales: CredencialesPaciente): Promise<Usuario> {
  await retardo();
  const estado = obtenerEstado();
  const documento = credenciales.numeroDocumento.replace(/\D/g, '');

  const paciente = estado.pacientes.find(
    (p) =>
      p.tipoDocumento === credenciales.tipoDocumento &&
      p.numeroDocumento === documento &&
      p.codigoAcceso === credenciales.codigoAcceso.trim(),
  );
  if (!paciente) {
    throw new ErrorApi(
      'No encontramos una cuenta con esos datos. Revisa el número de documento y el código.',
      'credenciales',
    );
  }

  const usuario = estado.usuarios.find((u) => u.rol === 'paciente' && u.pacienteId === paciente.id);
  if (!usuario?.activo) throw new ErrorApi('Esta cuenta está inactiva.', 'credenciales');

  establecerSesion(usuario.id);
  return usuario;
}

/** Ingreso del personal: usuario + contraseña, por la ruta discreta /acceso. */
export async function iniciarSesionPersonal(credenciales: CredencialesPersonal): Promise<Usuario> {
  await retardo();
  const usuario = obtenerEstado().usuarios.find(
    (u) =>
      u.usuario === credenciales.usuario.trim().toLowerCase() && u.clave === credenciales.clave,
  );
  if (!usuario) throw new ErrorApi('Usuario o contraseña incorrectos.', 'credenciales');
  if (!usuario.activo) throw new ErrorApi('Esta cuenta está inactiva.', 'credenciales');

  establecerSesion(usuario.id);
  return usuario;
}

export async function cerrarSesionUsuario(): Promise<void> {
  cerrarSesion();
}

/* ================================================================== consultas == */

export async function obtenerProfesionales(): Promise<Profesional[]> {
  await retardo();
  return obtenerEstado().profesionales;
}

export async function obtenerPaciente(id: string): Promise<Paciente | null> {
  await retardo();
  return obtenerEstado().pacientes.find((p) => p.id === id) ?? null;
}

/** Listado de la pantalla de pacientes, con búsqueda por nombre o documento. */
export async function buscarPacientes(texto = ''): Promise<Paciente[]> {
  await retardo();
  const consulta = texto.trim().toLowerCase();
  const pacientes = obtenerEstado().pacientes;
  if (!consulta) return [...pacientes].sort((a, b) => a.apellidos.localeCompare(b.apellidos));
  return pacientes
    .filter(
      (p) =>
        nombreCompleto(p).toLowerCase().includes(consulta) ||
        p.numeroDocumento.includes(consulta.replace(/\D/g, '')),
    )
    .sort((a, b) => a.apellidos.localeCompare(b.apellidos));
}

export async function obtenerTratamientos(pacienteId: string): Promise<Tratamiento[]> {
  await retardo();
  return obtenerEstado().tratamientos.filter((t) => t.pacienteId === pacienteId);
}

export async function obtenerTratamientoActivo(pacienteId: string): Promise<Tratamiento | null> {
  await retardo();
  return (
    obtenerEstado().tratamientos.find((t) => t.pacienteId === pacienteId && t.estado === 'activo') ?? null
  );
}

export async function obtenerCuotas(tratamientoId: string): Promise<Cuota[]> {
  await retardo();
  return obtenerEstado()
    .cuotas.filter((c) => c.tratamientoId === tratamientoId)
    .sort((a, b) => a.numeroCuota - b.numeroCuota);
}

/** Citas del paciente, de la más reciente a la más antigua. */
export async function obtenerCitas(pacienteId: string): Promise<Cita[]> {
  await retardo();
  return obtenerEstado()
    .citas.filter((c) => c.pacienteId === pacienteId)
    .sort((a, b) => parseISO(b.fechaHora).getTime() - parseISO(a.fechaHora).getTime());
}

/** La próxima cita confirmada. Es la tarjeta principal del portal. */
export async function obtenerProximaCita(pacienteId: string): Promise<Cita | null> {
  await retardo();
  const ahora = Date.now();
  return (
    obtenerEstado()
      .citas.filter(
        (c) => c.pacienteId === pacienteId && c.estado === 'confirmada' && parseISO(c.fechaHora).getTime() >= ahora,
      )
      .sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime())[0] ?? null
  );
}

export async function obtenerSolicitudes(pacienteId: string): Promise<SolicitudCita[]> {
  await retardo();
  return obtenerEstado()
    .solicitudes.filter((s) => s.pacienteId === pacienteId)
    .sort((a, b) => parseISO(b.creadaEn).getTime() - parseISO(a.creadaEn).getTime());
}

/** Solicitud abierta: la que el portal muestra como "en curso". */
export async function obtenerSolicitudEnCurso(pacienteId: string): Promise<SolicitudCita | null> {
  await retardo();
  return (
    obtenerEstado()
      .solicitudes.filter(
        (s) => s.pacienteId === pacienteId && (s.estado === 'solicitada' || s.estado === 'contrapropuesta'),
      )
      .sort((a, b) => parseISO(b.creadaEn).getTime() - parseISO(a.creadaEn).getTime())[0] ?? null
  );
}

export async function obtenerNotificaciones(pacienteId: string): Promise<Notificacion[]> {
  await retardo();
  return obtenerEstado()
    .notificaciones.filter((n) => n.pacienteId === pacienteId)
    .sort((a, b) => parseISO(b.enviadaEn).getTime() - parseISO(a.enviadaEn).getTime());
}

export interface FiltroBitacora {
  usuarioId?: string;
  /** ISO 8601 */
  desde?: string;
  hasta?: string;
}

export async function obtenerBitacora(filtro: FiltroBitacora = {}): Promise<RegistroBitacora[]> {
  await retardo();
  return obtenerEstado()
    .bitacora.filter((registro) => {
      if (filtro.usuarioId && registro.usuarioId !== filtro.usuarioId) return false;
      const momento = parseISO(registro.fechaHora).getTime();
      if (filtro.desde && momento < parseISO(filtro.desde).getTime()) return false;
      if (filtro.hasta && momento > parseISO(filtro.hasta).getTime()) return false;
      return true;
    })
    .sort((a, b) => parseISO(b.fechaHora).getTime() - parseISO(a.fechaHora).getTime());
}

/* ============================================================= área de clínica == */

/** Bandeja de entrada: todo lo que espera decisión, lo más viejo primero. */
export async function obtenerSolicitudesPendientes(): Promise<SolicitudCita[]> {
  await retardo();
  expirarVencidas();
  return obtenerEstado()
    .solicitudes.filter((s) => s.estado === 'solicitada')
    .sort((a, b) => parseISO(a.creadaEn).getTime() - parseISO(b.creadaEn).getTime());
}

/** Agenda de un día. `profesionalId` la acota a un solo odontólogo. */
export async function obtenerAgendaDelDia(dia: Date, profesionalId?: string | null): Promise<Cita[]> {
  await retardo();
  const clave = claveDia(dia);
  return obtenerEstado()
    .citas.filter(
      (c) =>
        claveDia(c.fechaHora) === clave &&
        c.estado !== 'cancelada' &&
        (!profesionalId || c.profesionalId === profesionalId),
    )
    .sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime());
}

/** Semana completa para la grilla, de lunes a sábado. */
export async function obtenerAgendaSemana(
  referencia: Date,
  profesionalId?: string | null,
): Promise<Cita[]> {
  await retardo();
  const inicio = startOfWeek(referencia, { weekStartsOn: 1 }).getTime();
  const fin = endOfWeek(referencia, { weekStartsOn: 1 }).getTime();
  return obtenerEstado()
    .citas.filter((c) => {
      const momento = parseISO(c.fechaHora).getTime();
      if (momento < inicio || momento > fin) return false;
      return !profesionalId || c.profesionalId === profesionalId;
    })
    .sort((a, b) => parseISO(a.fechaHora).getTime() - parseISO(b.fechaHora).getTime());
}

export interface PacienteSinControl {
  paciente: Paciente;
  tratamiento: Tratamiento;
  /** Días desde el último control atendido. */
  diasSinControl: number;
  /** ISO 8601 del último control, ausente si nunca ha venido. */
  ultimoControl?: string;
  cuotasVencidas: number;
}

/**
 * Pacientes silenciosos: ortodoncia activa, sin control en más de 35 días y sin
 * ninguna cita futura agendada. Es el riesgo real del negocio: nadie los nota
 * hasta que acumulan cuotas vencidas.
 */
export async function obtenerPacientesSinControl(): Promise<PacienteSinControl[]> {
  await retardo();
  const estado = obtenerEstado();
  const ahora = Date.now();
  const umbral = DIAS_SIN_CONTROL_ALERTA * 86_400_000;
  const resultado: PacienteSinControl[] = [];

  for (const tratamiento of estado.tratamientos) {
    if (tratamiento.estado !== 'activo' || tratamiento.tipo !== 'ortodoncia') continue;

    const citasPaciente = estado.citas.filter((c) => c.pacienteId === tratamiento.pacienteId);
    const tieneFutura = citasPaciente.some(
      (c) => c.estado === 'confirmada' && parseISO(c.fechaHora).getTime() >= ahora,
    );
    if (tieneFutura) continue;

    const atendidas = citasPaciente
      .filter((c) => c.estado === 'asistio' && parseISO(c.fechaHora).getTime() < ahora)
      .sort((a, b) => parseISO(b.fechaHora).getTime() - parseISO(a.fechaHora).getTime());

    const ultimo = atendidas[0];
    const referencia = ultimo
      ? parseISO(ultimo.fechaHora).getTime()
      : parseISO(`${tratamiento.fechaInicio}T00:00:00`).getTime();
    const transcurrido = ahora - referencia;
    if (transcurrido < umbral) continue;

    const paciente = estado.pacientes.find((p) => p.id === tratamiento.pacienteId);
    if (!paciente) continue;

    resultado.push({
      paciente,
      tratamiento,
      diasSinControl: Math.floor(transcurrido / 86_400_000),
      ultimoControl: ultimo?.fechaHora,
      cuotasVencidas: estado.cuotas.filter(
        (c) => c.tratamientoId === tratamiento.id && c.estado === 'vencida',
      ).length,
    });
  }

  return resultado.sort((a, b) => b.diasSinControl - a.diasSinControl);
}

export interface CuotaVencida {
  cuota: Cuota;
  paciente: Paciente;
  tratamiento: Tratamiento;
  diasMora: number;
}

export async function obtenerCuotasVencidas(): Promise<CuotaVencida[]> {
  await retardo();
  const estado = obtenerEstado();
  const ahora = Date.now();

  return estado.cuotas
    .filter((c) => c.estado === 'vencida')
    .flatMap((cuota) => {
      const tratamiento = estado.tratamientos.find((t) => t.id === cuota.tratamientoId);
      const paciente = tratamiento
        ? estado.pacientes.find((p) => p.id === tratamiento.pacienteId)
        : undefined;
      if (!tratamiento || !paciente) return [];
      return [
        {
          cuota,
          paciente,
          tratamiento,
          diasMora: Math.floor((ahora - parseISO(`${cuota.fechaVencimiento}T00:00:00`).getTime()) / 86_400_000),
        },
      ];
    })
    .sort((a, b) => b.diasMora - a.diasMora);
}

export interface Indicadores {
  citasHoy: number;
  citasHoyConfirmadas: number;
  solicitudesPendientes: number;
  ortodonciasActivas: number;
  cuotasVencidas: number;
  montoVencido: number;
}

/** Los cuatro números de la cabecera del panel clínico. */
export async function obtenerIndicadores(profesionalId?: string | null): Promise<Indicadores> {
  await retardo();
  expirarVencidas();
  const estado = obtenerEstado();
  const hoy = claveDia(new Date());

  const citasDeHoy = estado.citas.filter(
    (c) =>
      claveDia(c.fechaHora) === hoy &&
      c.estado !== 'cancelada' &&
      (!profesionalId || c.profesionalId === profesionalId),
  );
  const vencidas = estado.cuotas.filter((c) => c.estado === 'vencida');

  return {
    citasHoy: citasDeHoy.length,
    citasHoyConfirmadas: citasDeHoy.filter((c) => c.estado === 'confirmada').length,
    solicitudesPendientes: estado.solicitudes.filter((s) => s.estado === 'solicitada').length,
    ortodonciasActivas: estado.tratamientos.filter(
      (t) => t.estado === 'activo' && t.tipo === 'ortodoncia',
    ).length,
    cuotasVencidas: vencidas.length,
    montoVencido: vencidas.reduce((suma, c) => suma + c.valor, 0),
  };
}

/* ============================================================= disponibilidad == */

/** Días del mes que el calendario puede ofrecer. Claves 'yyyy-MM-dd'. */
export async function obtenerDiasDisponibles(
  mes: Date,
  tipo: TipoCita,
  pacienteId?: string,
): Promise<string[]> {
  await retardo();
  expirarVencidas();
  const estado = obtenerEstado();
  return diasConDisponibilidad(estado, mes, tipo, new Date(), profesionalDeCabecera(estado, pacienteId));
}

/** Franjas realmente libres de un día. Es lo único que se le ofrece al paciente. */
export async function obtenerFranjasDisponibles(
  dia: Date,
  tipo: TipoCita,
  pacienteId?: string,
): Promise<FranjaDisponible[]> {
  await retardo();
  expirarVencidas();
  const estado = obtenerEstado();
  return franjasLibresDelDia(estado, dia, tipo, new Date(), profesionalDeCabecera(estado, pacienteId));
}

/** El profesional que ya lleva el caso, para no rotar de odontóloga sin motivo. */
function profesionalDeCabecera(estado: EstadoDemo, pacienteId?: string): string | undefined {
  if (!pacienteId) return undefined;
  return estado.tratamientos.find((t) => t.pacienteId === pacienteId && t.estado === 'activo')?.profesionalId;
}

/**
 * Camino A: un control de ortodoncia de un paciente con tratamiento activo es
 * rutina y se confirma solo. Camino B: todo lo demás lo decide la clínica.
 * El paciente ve esta distinción antes de enviar, no después.
 */
export function requiereAprobacion(tipo: TipoCita, pacienteId?: string): boolean {
  if (tipo !== 'control' || !pacienteId) return true;
  const estado = obtenerEstado();
  return !estado.tratamientos.some(
    (t) => t.pacienteId === pacienteId && t.estado === 'activo' && t.tipo === 'ortodoncia',
  );
}

/* ================================================================= expiración == */

/**
 * Caduca las solicitudes sin respuesta a las 24 h y libera el cupo que tenían
 * reservado. Se llama sola desde las consultas del panel y desde un temporizador
 * de la aplicación: sin eso, una solicitud que vence durante la reunión no
 * cambiaría de estado hasta recargar.
 */
export function expirarSolicitudesVencidas(): number {
  return expirarVencidas();
}

function expirarVencidas(): number {
  const ahora = Date.now();
  const estado = obtenerEstado();
  const caducadas = estado.solicitudes.filter(
    (s) => s.estado === 'solicitada' && s.expiraEn && parseISO(s.expiraEn).getTime() <= ahora,
  );
  if (caducadas.length === 0) return 0;

  const sistema: Actor = { id: 'sistema', nombre: 'Sistema', rol: 'administrador' };
  const ids = new Set(caducadas.map((s) => s.id));

  actualizarEstado((actual) => ({
    ...actual,
    solicitudes: actual.solicitudes.map((s) =>
      ids.has(s.id) ? { ...s, estado: 'expirada' as const, resueltaEn: new Date().toISOString() } : s,
    ),
    bitacora: conBitacora(
      actual,
      sistema,
      'Expiró solicitud',
      `${caducadas.length} solicitud(es) sin respuesta en ${HORAS_PARA_EXPIRAR} horas`,
    ),
  }));

  return caducadas.length;
}

/* ================================================================ solicitudes == */

/**
 * Crea la solicitud y, si va por el camino A, además la cita ya confirmada.
 * Revalida la franja: entre que el paciente eligió y pulsó enviar pudieron
 * habérsela tomado desde otra pestaña.
 */
export async function crearSolicitudCita(entrada: EntradaSolicitud): Promise<ResultadoSolicitud> {
  await retardo();
  expirarVencidas();

  const inicio = parseISO(entrada.fechaHoraSolicitada);
  const duracion = DURACION_POR_TIPO[entrada.tipo];
  const necesitaAprobacion = requiereAprobacion(entrada.tipo, entrada.pacienteId);

  const estadoPrevio = obtenerEstado();
  const preferido = profesionalDeCabecera(estadoPrevio, entrada.pacienteId);
  const libres = profesionalesLibres(estadoPrevio, inicio, duracion, preferido);
  if (libres.length === 0) {
    throw new ErrorApi('Ese horario acaba de ocuparse. Elige otro, por favor.', 'franja_ocupada');
  }

  const ahora = new Date();
  const solicitud: SolicitudCita = {
    id: nuevoId('sol'),
    pacienteId: entrada.pacienteId,
    datosContacto: entrada.pacienteId ? undefined : entrada.datosContacto,
    profesionalId: necesitaAprobacion ? undefined : libres[0],
    fechaHoraSolicitada: entrada.fechaHoraSolicitada,
    duracionMinutos: duracion,
    tipo: entrada.tipo,
    estado: necesitaAprobacion ? 'solicitada' : 'confirmada',
    motivoConsulta: entrada.motivoConsulta?.trim() || undefined,
    creadaEn: ahora.toISOString(),
    expiraEn: necesitaAprobacion
      ? new Date(ahora.getTime() + HORAS_PARA_EXPIRAR * 3_600_000).toISOString()
      : undefined,
    resueltaEn: necesitaAprobacion ? undefined : ahora.toISOString(),
    requiereAprobacion: necesitaAprobacion,
  };

  let cita: Cita | undefined;
  if (!necesitaAprobacion && entrada.pacienteId) {
    cita = {
      id: nuevoId('cit'),
      solicitudId: solicitud.id,
      pacienteId: entrada.pacienteId,
      profesionalId: libres[0],
      fechaHora: entrada.fechaHoraSolicitada,
      duracionMinutos: duracion,
      tipo: entrada.tipo,
      estado: 'confirmada',
    };
  }

  const nombreSolicitante = entrada.datosContacto
    ? nombreCompleto(entrada.datosContacto)
    : (estadoPrevio.pacientes.find((p) => p.id === entrada.pacienteId)
        ? nombreCompleto(estadoPrevio.pacientes.find((p) => p.id === entrada.pacienteId)!)
        : 'Paciente');
  const actor = actorActual(nombreSolicitante);

  actualizarEstado((estado) => ({
    ...estado,
    solicitudes: [...estado.solicitudes, solicitud],
    citas: cita ? [...estado.citas, cita] : estado.citas,
    bitacora: conBitacora(
      estado,
      actor,
      cita ? 'Cita confirmada automáticamente' : 'Solicitó cita',
      `${nombreSolicitante} · ${entrada.tipo}`,
    ),
  }));

  return { solicitud, cita };
}

/** El paciente cancela su propia solicitud antes de que la clínica la resuelva. */
export async function cancelarSolicitud(solicitudId: string): Promise<SolicitudCita> {
  await retardo();
  return mutarSolicitud(solicitudId, 'Canceló solicitud', (solicitud) => {
    if (solicitud.estado !== 'solicitada' && solicitud.estado !== 'contrapropuesta') {
      throw new ErrorApi('Esta solicitud ya fue resuelta.');
    }
    return { ...solicitud, estado: 'cancelada', resueltaEn: new Date().toISOString() };
  });
}

/**
 * El paciente acepta uno de los dos horarios propuestos por la clínica.
 * Queda confirmado al instante: la clínica ya dijo que sí a ambos.
 */
export async function aceptarHorarioPropuesto(
  solicitudId: string,
  horarioElegido: string,
): Promise<{ solicitud: SolicitudCita; cita: Cita }> {
  await retardo();

  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.solicitudes.find((s) => s.id === solicitudId);
  if (!original) throw new ErrorApi('No encontramos la solicitud.', 'no_encontrado');
  if (original.estado !== 'contrapropuesta') {
    throw new ErrorApi('Esta solicitud ya no tiene horarios por elegir.');
  }
  if (!original.horariosPropuestos?.includes(horarioElegido)) {
    throw new ErrorApi('Ese horario no está entre los propuestos.');
  }
  if (!original.pacienteId) throw new ErrorApi('La solicitud no tiene paciente asociado.');

  // El horario ya estaba apartado para este paciente: solo falta quién lo atiende.
  const profesionalId =
    original.profesionalId ??
    profesionalesLibres(estadoPrevio, parseISO(horarioElegido), original.duracionMinutos)[0] ??
    estadoPrevio.profesionales[0].id;

  const solicitud: SolicitudCita = {
    ...original,
    estado: 'confirmada',
    profesionalId,
    fechaHoraSolicitada: horarioElegido,
    horariosPropuestos: undefined,
    resueltaEn: new Date().toISOString(),
  };

  const cita: Cita = {
    id: nuevoId('cit'),
    solicitudId: solicitud.id,
    pacienteId: original.pacienteId,
    profesionalId,
    fechaHora: horarioElegido,
    duracionMinutos: original.duracionMinutos,
    tipo: original.tipo,
    estado: 'confirmada',
  };

  const paciente = estadoPrevio.pacientes.find((p) => p.id === original.pacienteId);
  const actor = actorActual(paciente ? nombreCompleto(paciente) : undefined);

  actualizarEstado((estado) => ({
    ...estado,
    solicitudes: estado.solicitudes.map((s) => (s.id === solicitudId ? solicitud : s)),
    citas: [...estado.citas, cita],
    bitacora: conBitacora(
      estado,
      actor,
      'Aceptó horario propuesto',
      paciente ? nombreCompleto(paciente) : solicitudId,
    ),
  }));

  return { solicitud, cita };
}

/** El paciente rechaza los dos horarios propuestos. */
export async function rechazarHorariosPropuestos(solicitudId: string): Promise<SolicitudCita> {
  await retardo();
  return mutarSolicitud(solicitudId, 'Rechazó los horarios propuestos', (solicitud) => {
    if (solicitud.estado !== 'contrapropuesta') {
      throw new ErrorApi('Esta solicitud ya no tiene horarios por elegir.');
    }
    return {
      ...solicitud,
      estado: 'cancelada',
      horariosPropuestos: undefined,
      resueltaEn: new Date().toISOString(),
    };
  });
}

/* ============================================== resolución desde la clínica == */

export interface ResultadoResolucion {
  solicitud: SolicitudCita;
  cita?: Cita;
  /** Mensaje redactado y ya registrado, listo para la vista previa de WhatsApp. */
  notificacion?: Notificacion;
}

/** Aprueba la solicitud en el horario pedido y crea la cita. */
export async function aprobarSolicitud(
  solicitudId: string,
  profesionalId?: string,
): Promise<ResultadoResolucion> {
  await retardo();

  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.solicitudes.find((s) => s.id === solicitudId);
  if (!original) throw new ErrorApi('No encontramos la solicitud.', 'no_encontrado');
  if (original.estado !== 'solicitada') throw new ErrorApi('Esta solicitud ya fue resuelta.');

  const actor = actorActual();
  const asignado =
    profesionalId ??
    original.profesionalId ??
    profesionalesLibres(estadoPrevio, parseISO(original.fechaHoraSolicitada), original.duracionMinutos)[0] ??
    estadoPrevio.profesionales[0].id;

  // Un paciente sin cuenta se registra en el momento de aprobar, con los datos
  // de contacto que dejó al solicitar.
  let pacienteNuevo: Paciente | undefined;
  let usuarioNuevo: Usuario | undefined;
  let pacienteId = original.pacienteId;

  if (!pacienteId && original.datosContacto) {
    pacienteNuevo = {
      id: nuevoId('pac'),
      nombres: original.datosContacto.nombres,
      apellidos: original.datosContacto.apellidos,
      tipoDocumento: original.datosContacto.tipoDocumento,
      numeroDocumento: original.datosContacto.numeroDocumento,
      telefono: original.datosContacto.telefono,
      fechaNacimiento: '',
      acudiente: original.datosContacto.acudiente,
      codigoAcceso: String(Math.floor(1000 + Math.random() * 9000)),
    };
    usuarioNuevo = {
      id: nuevoId('usr'),
      nombre: nombreCompleto(pacienteNuevo),
      rol: 'paciente',
      pacienteId: pacienteNuevo.id,
      activo: true,
    };
    pacienteId = pacienteNuevo.id;
  }
  if (!pacienteId) throw new ErrorApi('La solicitud no tiene datos de paciente.');

  const solicitud: SolicitudCita = {
    ...original,
    estado: 'aprobada',
    profesionalId: asignado,
    pacienteId,
    resueltaEn: new Date().toISOString(),
    resueltaPor: actor.id,
  };

  const cita: Cita = {
    id: nuevoId('cit'),
    solicitudId: solicitud.id,
    pacienteId,
    profesionalId: asignado,
    fechaHora: original.fechaHoraSolicitada,
    duracionMinutos: original.duracionMinutos,
    tipo: original.tipo,
    estado: 'confirmada',
  };

  const paciente = pacienteNuevo ?? estadoPrevio.pacientes.find((p) => p.id === pacienteId)!;
  const notificacion = componerNotificacion('aprobada', {
    paciente,
    solicitud,
    cita,
    profesional: estadoPrevio.profesionales.find((p) => p.id === asignado),
  });

  actualizarEstado((estado) => ({
    ...estado,
    pacientes: pacienteNuevo ? [...estado.pacientes, pacienteNuevo] : estado.pacientes,
    usuarios: usuarioNuevo ? [...estado.usuarios, usuarioNuevo] : estado.usuarios,
    solicitudes: estado.solicitudes.map((s) => (s.id === solicitudId ? solicitud : s)),
    citas: [...estado.citas, cita],
    notificaciones: [...estado.notificaciones, notificacion],
    bitacora: conBitacora(estado, actor, 'Aprobó solicitud', nombreCompleto(paciente)),
  }));

  return { solicitud, cita, notificacion };
}

/**
 * La clínica no puede en el horario pedido y ofrece exactamente dos alternativas.
 * Es la acción principal de la bandeja: un paciente rechazado sin alternativa es
 * un paciente perdido.
 */
export async function contraproponerHorarios(
  solicitudId: string,
  horarios: [string, string],
  profesionalId?: string,
): Promise<ResultadoResolucion> {
  await retardo();

  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.solicitudes.find((s) => s.id === solicitudId);
  if (!original) throw new ErrorApi('No encontramos la solicitud.', 'no_encontrado');
  if (original.estado !== 'solicitada') throw new ErrorApi('Esta solicitud ya fue resuelta.');

  const actor = actorActual();
  const solicitud: SolicitudCita = {
    ...original,
    estado: 'contrapropuesta',
    profesionalId: profesionalId ?? original.profesionalId,
    horariosPropuestos: [...horarios],
    // Deja de correr el reloj de las 24 h: ahora la pelota está en el paciente.
    expiraEn: undefined,
    resueltaPor: actor.id,
  };

  const paciente = estadoPrevio.pacientes.find((p) => p.id === original.pacienteId);
  const notificacion = paciente
    ? componerNotificacion('contrapropuesta', { paciente, solicitud })
    : undefined;

  actualizarEstado((estado) => ({
    ...estado,
    solicitudes: estado.solicitudes.map((s) => (s.id === solicitudId ? solicitud : s)),
    notificaciones: notificacion ? [...estado.notificaciones, notificacion] : estado.notificaciones,
    bitacora: conBitacora(
      estado,
      actor,
      'Propuso otro horario',
      paciente ? nombreCompleto(paciente) : nombreDeSolicitud(original),
    ),
  }));

  return { solicitud, notificacion };
}

/** Rechazo con motivo obligatorio. Va como enlace discreto, nunca como botón principal. */
export async function rechazarSolicitud(
  solicitudId: string,
  motivoRechazo: string,
): Promise<ResultadoResolucion> {
  await retardo();

  const motivo = motivoRechazo.trim();
  if (!motivo) throw new ErrorApi('El motivo del rechazo es obligatorio.');

  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.solicitudes.find((s) => s.id === solicitudId);
  if (!original) throw new ErrorApi('No encontramos la solicitud.', 'no_encontrado');
  if (original.estado !== 'solicitada' && original.estado !== 'contrapropuesta') {
    throw new ErrorApi('Esta solicitud ya fue resuelta.');
  }

  const actor = actorActual();
  const solicitud: SolicitudCita = {
    ...original,
    estado: 'rechazada',
    motivoRechazo: motivo,
    expiraEn: undefined,
    resueltaEn: new Date().toISOString(),
    resueltaPor: actor.id,
  };

  const paciente = estadoPrevio.pacientes.find((p) => p.id === original.pacienteId);
  const notificacion = paciente
    ? componerNotificacion('rechazada', { paciente, solicitud, motivoRechazo: motivo })
    : undefined;

  actualizarEstado((estado) => ({
    ...estado,
    solicitudes: estado.solicitudes.map((s) => (s.id === solicitudId ? solicitud : s)),
    notificaciones: notificacion ? [...estado.notificaciones, notificacion] : estado.notificaciones,
    bitacora: conBitacora(
      estado,
      actor,
      'Rechazó solicitud',
      `${paciente ? nombreCompleto(paciente) : nombreDeSolicitud(original)} · ${motivo}`,
    ),
  }));

  return { solicitud, notificacion };
}

/* ====================================================================== citas == */

/** "Confirmar asistencia" del portal. No es lo mismo que marcar que asistió. */
export async function confirmarAsistencia(citaId: string): Promise<Cita> {
  await retardo();
  return mutarCita(citaId, 'Confirmó asistencia', (cita) => {
    if (cita.estado !== 'confirmada') throw new ErrorApi('Esta cita ya no admite confirmación.');
    return { ...cita, confirmadaPorPaciente: true };
  });
}

/** La clínica marca lo que pasó el día de la cita. */
export async function marcarAsistencia(citaId: string, asistio: boolean): Promise<Cita> {
  await retardo();
  return mutarCita(citaId, asistio ? 'Registró asistencia' : 'Registró inasistencia', (cita) => ({
    ...cita,
    estado: asistio ? 'asistio' : 'no_asistio',
  }));
}

export async function cancelarCita(citaId: string): Promise<Cita> {
  await retardo();
  return mutarCita(citaId, 'Canceló cita', (cita) => {
    if (cita.estado !== 'confirmada') throw new ErrorApi('Esta cita ya no se puede cancelar.');
    return { ...cita, estado: 'cancelada' };
  });
}

/** Reagenda a otra franja, validando que esté libre. */
export async function reagendarCita(citaId: string, nuevaFechaHora: string): Promise<Cita> {
  await retardo();
  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.citas.find((c) => c.id === citaId);
  if (!original) throw new ErrorApi('No encontramos la cita.', 'no_encontrado');

  const libres = profesionalesLibres(
    estadoPrevio,
    parseISO(nuevaFechaHora),
    original.duracionMinutos,
    original.profesionalId,
  );
  if (!libres.includes(original.profesionalId) && libres.length === 0) {
    throw new ErrorApi('Ese horario ya está ocupado.', 'franja_ocupada');
  }

  return mutarCita(citaId, 'Reagendó cita', (cita) => ({
    ...cita,
    fechaHora: nuevaFechaHora,
    profesionalId: libres.includes(cita.profesionalId) ? cita.profesionalId : libres[0],
  }));
}

/** Nota clínica del tratamiento. Solo la escriben odontólogo y administrador. */
export async function guardarNotaClinica(citaId: string, notasClinicas: string): Promise<Cita> {
  await retardo();
  return mutarCita(citaId, 'Agregó nota clínica', (cita) => ({ ...cita, notasClinicas }));
}

/* ===================================================================== cuotas == */

/** Registro del pago, normalmente el mismo día del control. */
export async function registrarPago(cuotaId: string, metodoPago: MetodoPago): Promise<Cuota> {
  await retardo();

  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.cuotas.find((c) => c.id === cuotaId);
  if (!original) throw new ErrorApi('No encontramos la cuota.', 'no_encontrado');
  if (original.estado === 'pagada') throw new ErrorApi('Esta cuota ya está pagada.');

  const actor = actorActual();
  const siguiente: Cuota = {
    ...original,
    estado: 'pagada',
    fechaPago: claveDia(new Date()),
    metodoPago,
    registradaPor: actor.id,
  };

  const tratamiento = estadoPrevio.tratamientos.find((t) => t.id === original.tratamientoId);
  const paciente = tratamiento
    ? estadoPrevio.pacientes.find((p) => p.id === tratamiento.pacienteId)
    : undefined;

  actualizarEstado((estado) => ({
    ...estado,
    cuotas: estado.cuotas.map((c) => (c.id === cuotaId ? siguiente : c)),
    bitacora: conBitacora(
      estado,
      actor,
      'Registró pago',
      `${paciente ? nombreCompleto(paciente) : 'Paciente'} · cuota ${original.numeroCuota} · ${metodoPago}`,
    ),
  }));

  return siguiente;
}

/* ================================================================== pacientes == */

export async function crearPaciente(datos: Omit<Paciente, 'id' | 'codigoAcceso'>): Promise<Paciente> {
  await retardo();
  const actor = actorActual();
  const paciente: Paciente = {
    ...datos,
    id: nuevoId('pac'),
    codigoAcceso: String(Math.floor(1000 + Math.random() * 9000)),
  };
  const usuario: Usuario = {
    id: nuevoId('usr'),
    nombre: nombreCompleto(paciente),
    rol: 'paciente',
    pacienteId: paciente.id,
    activo: true,
  };

  actualizarEstado((estado) => ({
    ...estado,
    pacientes: [...estado.pacientes, paciente],
    usuarios: [...estado.usuarios, usuario],
    bitacora: conBitacora(estado, actor, 'Creó paciente', nombreCompleto(paciente)),
  }));

  return paciente;
}

export async function actualizarPaciente(id: string, cambios: Partial<Paciente>): Promise<Paciente> {
  await retardo();
  const original = obtenerEstado().pacientes.find((p) => p.id === id);
  if (!original) throw new ErrorApi('No encontramos el paciente.', 'no_encontrado');

  const actor = actorActual();
  const siguiente: Paciente = { ...original, ...cambios, id: original.id };

  actualizarEstado((estado) => ({
    ...estado,
    pacientes: estado.pacientes.map((p) => (p.id === id ? siguiente : p)),
    bitacora: conBitacora(estado, actor, 'Editó paciente', nombreCompleto(siguiente)),
  }));

  return siguiente;
}

/* ============================================================== notificaciones == */

/** Redacta el mensaje y lo deja registrado. La vista previa lo muestra tal cual. */
function componerNotificacion(
  tipo: TipoNotificacion,
  contexto: Parameters<typeof redactarMensaje>[1],
): Notificacion {
  return {
    id: nuevoId('not'),
    pacienteId: contexto.paciente.id,
    solicitudId: contexto.solicitud?.id,
    canal: 'whatsapp',
    tipo,
    mensaje: redactarMensaje(tipo, contexto),
    enviadaEn: new Date().toISOString(),
    destinatario: destinatarioDe(contexto.paciente).numero,
  };
}

/** Recordatorio manual de control, desde la alerta de pacientes silenciosos. */
export async function crearRecordatorio(pacienteId: string, citaId?: string): Promise<Notificacion> {
  await retardo();
  const estado = obtenerEstado();
  const paciente = estado.pacientes.find((p) => p.id === pacienteId);
  if (!paciente) throw new ErrorApi('No encontramos el paciente.', 'no_encontrado');

  const cita = citaId ? estado.citas.find((c) => c.id === citaId) : undefined;
  const tratamiento = estado.tratamientos.find((t) => t.pacienteId === pacienteId && t.estado === 'activo');
  const notificacion = componerNotificacion('recordatorio', {
    paciente,
    cita,
    profesional: estado.profesionales.find((p) => p.id === tratamiento?.profesionalId),
  });

  const actor = actorActual();
  actualizarEstado((actual) => ({
    ...actual,
    notificaciones: [...actual.notificaciones, notificacion],
    bitacora: conBitacora(actual, actor, 'Envió recordatorio', nombreCompleto(paciente)),
  }));

  return notificacion;
}

/* ==================================================================== internos == */

function nombreDeSolicitud(solicitud: SolicitudCita): string {
  return solicitud.datosContacto ? nombreCompleto(solicitud.datosContacto) : 'Paciente';
}

function mutarSolicitud(
  solicitudId: string,
  accion: string,
  receta: (solicitud: SolicitudCita) => SolicitudCita,
): SolicitudCita {
  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.solicitudes.find((s) => s.id === solicitudId);
  if (!original) throw new ErrorApi('No encontramos la solicitud.', 'no_encontrado');

  const siguiente = receta(original);
  const paciente = estadoPrevio.pacientes.find((p) => p.id === original.pacienteId);
  const actor = actorActual(paciente ? nombreCompleto(paciente) : undefined);

  actualizarEstado((estado) => ({
    ...estado,
    solicitudes: estado.solicitudes.map((s) => (s.id === solicitudId ? siguiente : s)),
    bitacora: conBitacora(
      estado,
      actor,
      accion,
      paciente ? nombreCompleto(paciente) : nombreDeSolicitud(original),
    ),
  }));

  return siguiente;
}

function mutarCita(citaId: string, accion: string, receta: (cita: Cita) => Cita): Cita {
  const estadoPrevio = obtenerEstado();
  const original = estadoPrevio.citas.find((c) => c.id === citaId);
  if (!original) throw new ErrorApi('No encontramos la cita.', 'no_encontrado');

  const siguiente = receta(original);
  const paciente = estadoPrevio.pacientes.find((p) => p.id === original.pacienteId);
  const actor = actorActual(paciente ? nombreCompleto(paciente) : undefined);

  actualizarEstado((estado) => ({
    ...estado,
    citas: estado.citas.map((c) => (c.id === citaId ? siguiente : c)),
    bitacora: conBitacora(estado, actor, accion, paciente ? nombreCompleto(paciente) : citaId),
  }));

  return siguiente;
}

/** Fin de una cita, para pintar bloques en la agenda. */
export function finDeCita(cita: Cita): Date {
  return addMinutes(parseISO(cita.fechaHora), cita.duracionMinutos);
}
