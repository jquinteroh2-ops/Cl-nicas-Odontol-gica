/**
 * Contrato de datos de Dentistetic Turbaco.
 *
 * Este archivo lo comparten la aplicación de usuarios y la de administración.
 * No debe importar nada de `usuarios/` ni de `administracion/`.
 *
 * Convención de fechas: todas las fechas y fechas-hora se guardan como cadenas
 * ISO 8601 (`new Date().toISOString()`), porque el estado completo viaja por
 * localStorage y por BroadcastChannel, y ninguno de los dos conserva objetos Date.
 * Las fechas sin hora (nacimiento, vencimiento, mes de cuota) usan 'yyyy-MM-dd'.
 */

/* ------------------------------------------------------------- usuarios y rol -- */

export type Rol = 'paciente' | 'secretaria' | 'odontologo' | 'administrador';

export interface Usuario {
  id: string;
  nombre: string;
  rol: Rol;
  /** Personal de la clínica. Los pacientes entran con documento + código. */
  usuario?: string;
  /** Texto plano a propósito: es un demo, no hay criptografía. */
  clave?: string;
  /** Presente si rol === 'paciente'. */
  pacienteId?: string;
  /** Presente si rol === 'odontologo'. */
  profesionalId?: string;
  activo: boolean;
}

export type TipoDocumento = 'CC' | 'TI' | 'CE';

export interface Acudiente {
  nombre: string;
  telefono: string;
  parentesco: string;
}

export interface Paciente {
  id: string;
  nombres: string;
  apellidos: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  telefono: string;
  /** Canal secundario. La clínica notifica por WhatsApp, no por correo. */
  correo?: string;
  /** 'yyyy-MM-dd' */
  fechaNacimiento: string;
  /** Obligatorio cuando tipoDocumento === 'TI'. Recibe todas las notificaciones. */
  acudiente?: Acudiente;
  /** Código de 4 dígitos para entrar al portal. Añadido al contrato: /ingresar lo exige. */
  codigoAcceso: string;
}

export type TipoTratamiento = 'ortodoncia' | 'estetica' | 'general';
export type EstadoTratamiento = 'activo' | 'finalizado' | 'suspendido';

export interface Tratamiento {
  id: string;
  pacienteId: string;
  tipo: TipoTratamiento;
  /** 'yyyy-MM-dd' */
  fechaInicio: string;
  duracionEstimadaMeses: number;
  valorTotal: number;
  cuotaInicial: number;
  numeroCuotas: number;
  valorCuotaMensual: number;
  estado: EstadoTratamiento;
  profesionalId: string;
}

export type TipoCita = 'valoracion' | 'control' | 'procedimiento' | 'urgencia';

export type EstadoSolicitud =
  | 'solicitada'
  | 'confirmada'
  | 'aprobada'
  | 'contrapropuesta'
  | 'rechazada'
  | 'cancelada'
  | 'expirada';

export interface DatosContacto {
  nombres: string;
  apellidos: string;
  telefono: string;
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  /** Obligatorio cuando tipoDocumento === 'TI'. Añadido al contrato: el paso 3 de /agendar lo pide. */
  acudiente?: Acudiente;
}

export interface SolicitudCita {
  id: string;
  /** Ausente si es un paciente nuevo sin cuenta. */
  pacienteId?: string;
  /** Presente solo cuando no hay pacienteId. */
  datosContacto?: DatosContacto;
  /** Se asigna al confirmar o aprobar. */
  profesionalId?: string;
  /** ISO 8601 */
  fechaHoraSolicitada: string;
  duracionMinutos: number;
  tipo: TipoCita;
  estado: EstadoSolicitud;
  motivoConsulta?: string;
  motivoRechazo?: string;
  /** Exactamente 2 cuando estado === 'contrapropuesta'. ISO 8601. */
  horariosPropuestos?: string[];
  /** ISO 8601 */
  creadaEn: string;
  /** ISO 8601 */
  resueltaEn?: string;
  /** Id del Usuario que la resolvió. */
  resueltaPor?: string;
  /**
   * ISO 8601. Vence a las 24 h sin respuesta y libera el cupo reservado.
   * Se guarda como dato en vez de recalcularse en cada pantalla.
   */
  expiraEn?: string;
  requiereAprobacion: boolean;
}

export type EstadoCita = 'confirmada' | 'asistio' | 'no_asistio' | 'cancelada';

export interface Cita {
  id: string;
  solicitudId: string;
  pacienteId: string;
  profesionalId: string;
  /** ISO 8601 */
  fechaHora: string;
  duracionMinutos: number;
  tipo: TipoCita;
  estado: EstadoCita;
  /** Solo lo ven odontólogo y administrador. Nunca se envía al portal del paciente. */
  notasClinicas?: string;
  /**
   * El paciente pulsó "Confirmar asistencia" en el portal.
   * Distinto de estado 'asistio', que solo lo marca la clínica después de la cita.
   * Añadido al contrato: el portal lo exige.
   */
  confirmadaPorPaciente?: boolean;
}

export type EstadoCuota = 'pagada' | 'pendiente' | 'vencida';
export type MetodoPago = 'efectivo' | 'transferencia' | 'tarjeta';

export interface Cuota {
  id: string;
  tratamientoId: string;
  /** 0 = cuota inicial. */
  numeroCuota: number;
  /** 'yyyy-MM' */
  mesCorrespondiente: string;
  valor: number;
  /** 'yyyy-MM-dd' */
  fechaVencimiento: string;
  estado: EstadoCuota;
  /** 'yyyy-MM-dd' */
  fechaPago?: string;
  metodoPago?: MetodoPago;
  /** Id del Usuario que registró el pago. */
  registradaPor?: string;
}

export interface Profesional {
  id: string;
  nombre: string;
  especialidad: string;
  /** Color hexadecimal, usado en avatares y en la agenda de la clínica. */
  color: string;
}

/* -------------------------------------------------- notificaciones y bitácora -- */

export type TipoNotificacion =
  | 'confirmada'
  | 'aprobada'
  | 'contrapropuesta'
  | 'rechazada'
  | 'recordatorio';

export interface Notificacion {
  id: string;
  pacienteId: string;
  solicitudId?: string;
  /** Esta clínica solo usa WhatsApp: sus pacientes no revisan correo. */
  canal: 'whatsapp';
  tipo: TipoNotificacion;
  mensaje: string;
  /** ISO 8601 */
  enviadaEn: string;
  /** Número al que se envió: el del acudiente cuando el paciente es TI. */
  destinatario: string;
}

export interface RegistroBitacora {
  id: string;
  usuarioId: string;
  /** Se guarda el nombre del momento: si el usuario cambia, el registro no miente. */
  nombreUsuario: string;
  rol: Rol;
  accion: string;
  detalle: string;
  /** ISO 8601 */
  fechaHora: string;
}

/**
 * Raíz del almacén. Es exactamente lo que se persiste en localStorage y lo que
 * viaja entre pestañas. Un solo objeto para que la sincronización sea atómica.
 */
export interface EstadoDemo {
  /** Cambia cuando cambia la forma de los datos: invalida almacenes viejos. */
  version: number;
  /** Sube en cada escritura. Permite descartar mensajes duplicados o atrasados. */
  revision: number;
  /** ISO 8601 */
  generadoEn: string;
  usuarios: Usuario[];
  profesionales: Profesional[];
  pacientes: Paciente[];
  tratamientos: Tratamiento[];
  solicitudes: SolicitudCita[];
  citas: Cita[];
  cuotas: Cuota[];
  notificaciones: Notificacion[];
  bitacora: RegistroBitacora[];
}

/** Franja ofrecida por el portal. */
export interface FranjaDisponible {
  /** ISO 8601 */
  inicio: string;
  duracionMinutos: number;
  /** Profesionales realmente libres en esa franja. Nunca vacío. */
  profesionalesLibres: string[];
}

/** Entrada de crearSolicitudCita. */
export interface EntradaSolicitud {
  pacienteId?: string;
  datosContacto?: DatosContacto;
  tipo: TipoCita;
  /** ISO 8601 */
  fechaHoraSolicitada: string;
  motivoConsulta?: string;
}

/** Salida de crearSolicitudCita. `cita` solo viene por el camino de confirmación automática. */
export interface ResultadoSolicitud {
  solicitud: SolicitudCita;
  cita?: Cita;
}

/** Credenciales de /ingresar: pacientes. Sin correo ni contraseña. */
export interface CredencialesPaciente {
  tipoDocumento: TipoDocumento;
  numeroDocumento: string;
  codigoAcceso: string;
}

/** Credenciales de /acceso: personal de la clínica. */
export interface CredencialesPersonal {
  usuario: string;
  clave: string;
}
