/**
 * Generación de los datos de demostración.
 *
 * Dos reglas que no se negocian:
 *  1. Todo se calcula contra la fecha del sistema. Ninguna fecha fija. El demo
 *     debe verse vivo cualquier día que se abra.
 *  2. Ninguna cita se inventa fuera del horario de atención ni encima de otra.
 *     La agenda simulada se llena con el mismo criterio de ocupación que usa
 *     el portal para ofrecer cupos.
 *
 * El azar es determinista (semilla fija), así el demo es reproducible: reiniciar
 * devuelve exactamente los mismos pacientes, corridos a la fecha de hoy.
 */

import { addDays, addMonths, format, startOfDay, subDays, subMonths } from 'date-fns';
import type {
  Cita,
  Cuota,
  EstadoCita,
  EstadoDemo,
  Notificacion,
  Paciente,
  Profesional,
  RegistroBitacora,
  SolicitudCita,
  Tratamiento,
  TipoCita,
  TipoDocumento,
  Usuario,
} from './tipos';
import { DURACION_POR_TIPO, esDiaHabil, franjasCandidatas } from './disponibilidad';
import { destinatarioDe, redactarMensaje } from './mensajeria';

/** Sube cuando cambia la forma de los datos: invalida los almacenes anteriores. */
export const VERSION_DATOS = 2;

/** Una solicitud sin respuesta caduca a las 24 horas y libera el cupo. */
export const HORAS_PARA_EXPIRAR = 24;

/** Ortodoncia activa sin control en más de este plazo: paciente silencioso. */
export const DIAS_SIN_CONTROL_ALERTA = 35;

/* --------------------------------------------------------------- utilidades -- */

/** mulberry32: azar reproducible sin dependencias. */
function crearAzar(semilla: number): () => number {
  let a = semilla;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function crearContador(prefijo: string) {
  let n = 0;
  return () => `${prefijo}-${String(++n).padStart(3, '0')}`;
}

const dia = (fecha: Date) => format(fecha, 'yyyy-MM-dd');
const mes = (fecha: Date) => format(fecha, 'yyyy-MM');

/**
 * Agenda simulada: replica la ocupación por profesional mientras se siembra,
 * de modo que las citas generadas nunca se solapen entre sí.
 */
class AgendaSimulada {
  private ocupado = new Map<string, Array<[number, number]>>();

  constructor(private readonly profesionales: string[]) {
    for (const id of profesionales) this.ocupado.set(id, []);
  }

  private estaLibre(profesionalId: string, inicio: number, fin: number): boolean {
    const bloques = this.ocupado.get(profesionalId) ?? [];
    return !bloques.some(([a, b]) => a < fin && inicio < b);
  }

  reservar(profesionalId: string, inicio: Date, duracionMinutos: number): void {
    const desde = inicio.getTime();
    this.ocupado.get(profesionalId)?.push([desde, desde + duracionMinutos * 60_000]);
  }

  /**
   * Aparta el cupo en el primer profesional libre, sin asignárselo a nadie de cara
   * al usuario. Es lo que hace una solicitud pendiente: ocupa agenda mientras se decide.
   */
  reservarCupoGenerico(inicio: Date, duracionMinutos: number): boolean {
    const desde = inicio.getTime();
    const hasta = desde + duracionMinutos * 60_000;
    for (const profesionalId of this.profesionales) {
      if (this.estaLibre(profesionalId, desde, hasta)) {
        this.reservar(profesionalId, inicio, duracionMinutos);
        return true;
      }
    }
    return false;
  }

  /**
   * Primer cupo libre a partir de un día, saltando domingos y sábados por la tarde.
   * Prefiere al profesional que ya lleva el caso y, si se le indica, una hora concreta.
   */
  buscarCupo(
    desde: Date,
    tipo: TipoCita,
    azar: () => number,
    preferidoId?: string,
    horaPreferida?: { hora: number; minuto: number },
  ): { inicio: Date; profesionalId: string } | null {
    const duracion = DURACION_POR_TIPO[tipo];
    const orden = preferidoId
      ? [preferidoId, ...this.profesionales.filter((id) => id !== preferidoId)]
      : this.profesionales;

    for (let salto = 0; salto < 45; salto++) {
      const jornadaDia = addDays(startOfDay(desde), salto);
      if (!esDiaHabil(jornadaDia)) continue;

      let candidatas = franjasCandidatas(jornadaDia, duracion);
      if (candidatas.length === 0) continue;

      if (salto === 0 && horaPreferida) {
        const exacta = candidatas.find(
          (c) => c.getHours() === horaPreferida.hora && c.getMinutes() === horaPreferida.minuto,
        );
        if (exacta) candidatas = [exacta, ...candidatas.filter((c) => c !== exacta)];
      } else {
        candidatas = [...candidatas].sort(() => azar() - 0.5);
      }

      for (const inicio of candidatas) {
        const fin = inicio.getTime() + duracion * 60_000;
        for (const profesionalId of orden) {
          if (this.estaLibre(profesionalId, inicio.getTime(), fin)) {
            return { inicio, profesionalId };
          }
        }
      }
    }
    return null;
  }
}

/* ------------------------------------------------------------ nombres costeños -- */

const NOMBRES_F = [
  'Yuranis',
  'Katherine',
  'Yulieth',
  'Dayana',
  'Karolay',
  'Valentina',
  'Isabella',
  'Shirley',
  'Milena',
  'Nataly',
  'Greisy',
  'Luz Marina',
  'Kelly Johana',
  'Yiseth',
  'Estefany',
];

const NOMBRES_M = [
  'Jorge Luis',
  'Deivis',
  'Alfonso',
  'Óscar',
  'Breiner',
  'Wilmer',
  'Jesús David',
  'Elkin',
  'Andrés Felipe',
  'Rafael',
  'Yeison',
  'Cristian',
  'Hernando',
  'Duvan',
  'Emiro',
];

const APELLIDOS = [
  'Pájaro',
  'Villarreal',
  'Cantero',
  'Meza',
  'Carrasquilla',
  'Fuentes',
  'Torres',
  'Pérez',
  'De la Rosa',
  'Barrios',
  'Julio',
  'Herrera',
  'Ospino',
  'Marimón',
  'Zabaleta',
  'Puello',
  'Guerrero',
  'Salgado',
  'Berrío',
  'Padilla',
];

const PARENTESCOS = ['Madre', 'Padre', 'Abuela', 'Tía', 'Tío'];

const MOTIVOS_VALORACION = [
  'Quiero saber si necesito brackets.',
  'Tengo los dientes de adelante montados.',
  'Me recomendaron la clínica para ortodoncia.',
  'Quiero una valoración general y limpieza.',
  '',
];

/* ------------------------------------------------------------------ semilla -- */

export function generarDatosDemo(ahora: Date = new Date()): EstadoDemo {
  const azar = crearAzar(20260811);
  const hoy = startOfDay(ahora);

  const nuevoIdPaciente = crearContador('pac');
  const nuevoIdTratamiento = crearContador('tra');
  const nuevoIdCita = crearContador('cit');
  const nuevoIdSolicitud = crearContador('sol');
  const nuevoIdCuota = crearContador('cuo');

  const enteroEntre = (min: number, max: number) => min + Math.floor(azar() * (max - min + 1));
  const elegir = <T,>(lista: T[]): T => lista[Math.floor(azar() * lista.length)];

  /* ---------------------------------------------------------- profesionales -- */

  const profesionales: Profesional[] = [
    {
      id: 'pro-1',
      nombre: 'Dra. Yuranis Meza Pájaro',
      especialidad: 'Ortodoncista',
      color: '#0f6e78',
    },
    {
      id: 'pro-2',
      nombre: 'Dr. Alfonso Carrasquilla Torres',
      especialidad: 'Rehabilitación oral y estética',
      color: '#4f46e5',
    },
    {
      id: 'pro-3',
      nombre: 'Dra. Katherine Villarreal Fuentes',
      especialidad: 'Periodoncia y endodoncia',
      color: '#475569',
    },
  ];

  const agenda = new AgendaSimulada(profesionales.map((p) => p.id));

  /* --------------------------------------------------------------- pacientes -- */

  const pacientes: Paciente[] = [];

  // Paciente destacado de la demostración. Adulta, cédula, código fácil de dictar.
  pacientes.push({
    id: nuevoIdPaciente(),
    nombres: 'Camila Andrea',
    apellidos: 'Pérez Villarreal',
    tipoDocumento: 'CC',
    numeroDocumento: '1047882331',
    telefono: '3145562018',
    correo: 'camila.perez@ejemplo.co',
    fechaNacimiento: '1998-03-14',
    codigoAcceso: '1234',
  });

  // Segundo paciente de prueba: adolescente con acudiente y una contrapropuesta pendiente.
  pacientes.push({
    id: nuevoIdPaciente(),
    nombres: 'Juan David',
    apellidos: 'Cantero Fuentes',
    tipoDocumento: 'TI',
    numeroDocumento: '1104857720',
    telefono: '3012247765',
    fechaNacimiento: '2011-07-22',
    acudiente: {
      nombre: 'Marta Fuentes Ospino',
      telefono: '3157782314',
      parentesco: 'Madre',
    },
    codigoAcceso: '5678',
  });

  for (let i = 2; i < 25; i++) {
    // Los índices 2 a 8 son adolescentes con tarjeta de identidad: con el
    // paciente 2 suman ocho menores con acudiente registrado.
    const esMenor = i <= 8;
    const femenino = azar() < 0.58;
    const nombres = femenino ? elegir(NOMBRES_F) : elegir(NOMBRES_M);
    const apellidos = `${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`;
    const tipoDocumento: TipoDocumento = esMenor ? 'TI' : azar() < 0.94 ? 'CC' : 'CE';
    const anioNacimiento = esMenor ? enteroEntre(2008, 2013) : enteroEntre(1972, 2004);

    pacientes.push({
      id: nuevoIdPaciente(),
      nombres,
      apellidos,
      tipoDocumento,
      numeroDocumento: String(esMenor ? 1100000000 + enteroEntre(0, 89999999) : 1000000000 + enteroEntre(0, 99999999)),
      telefono: `3${enteroEntre(0, 2)}${enteroEntre(0, 9)}${String(enteroEntre(1000000, 9999999))}`,
      correo: azar() < 0.35 ? `${nombres.split(' ')[0].toLowerCase()}@ejemplo.co` : undefined,
      fechaNacimiento: `${anioNacimiento}-${String(enteroEntre(1, 12)).padStart(2, '0')}-${String(enteroEntre(1, 28)).padStart(2, '0')}`,
      acudiente: esMenor
        ? {
            nombre: `${elegir(femenino ? NOMBRES_F : NOMBRES_M)} ${elegir(APELLIDOS)}`,
            telefono: `3${enteroEntre(0, 2)}${enteroEntre(0, 9)}${String(enteroEntre(1000000, 9999999))}`,
            parentesco: elegir(PARENTESCOS),
          }
        : undefined,
      codigoAcceso: String(enteroEntre(1000, 9999)),
    });
  }

  /* ---------------------------------------------------------------- usuarios -- */

  // Personal de la clínica. Contraseñas en texto plano y todas iguales: es un
  // demo y hay que poder dictarlas en voz alta durante la reunión.
  const usuarios: Usuario[] = [
    {
      id: 'usr-secretaria',
      nombre: 'Liliana Ospino Barrios',
      rol: 'secretaria',
      usuario: 'secretaria',
      clave: 'clinica123',
      activo: true,
    },
    {
      id: 'usr-odontologo',
      nombre: 'Dra. Yuranis Meza Pájaro',
      rol: 'odontologo',
      usuario: 'doctora',
      clave: 'clinica123',
      profesionalId: 'pro-1',
      activo: true,
    },
    {
      id: 'usr-administrador',
      nombre: 'Dayana Meza Pájaro',
      rol: 'administrador',
      usuario: 'admin',
      clave: 'clinica123',
      activo: true,
    },
  ];

  // Cada paciente tiene su usuario: entra con documento y código, no con clave.
  for (const paciente of pacientes) {
    usuarios.push({
      id: `usr-${paciente.id}`,
      nombre: `${paciente.nombres} ${paciente.apellidos}`,
      rol: 'paciente',
      pacienteId: paciente.id,
      activo: true,
    });
  }

  /* ------------------------------------------------------------ tratamientos -- */

  const tratamientos: Tratamiento[] = [];

  // El vencimiento de la cuota pendiente del paciente destacado se ancla dentro
  // del mes en curso, para que siempre se vea "próxima a vencer" y nunca vencida.
  const diasDelMesRestantes =
    new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate() - hoy.getDate();
  const desfaseCuota = Math.min(6, Math.max(0, diasDelMesRestantes - 1));
  const inicioDestacado = subMonths(addDays(hoy, desfaseCuota), 7);

  tratamientos.push({
    id: nuevoIdTratamiento(),
    pacienteId: pacientes[0].id,
    tipo: 'ortodoncia',
    fechaInicio: dia(inicioDestacado),
    duracionEstimadaMeses: 20,
    valorTotal: 3_800_000,
    cuotaInicial: 600_000,
    numeroCuotas: 20,
    valorCuotaMensual: 160_000,
    estado: 'activo',
    profesionalId: 'pro-1',
  });

  tratamientos.push({
    id: nuevoIdTratamiento(),
    pacienteId: pacientes[1].id,
    tipo: 'ortodoncia',
    fechaInicio: dia(subMonths(hoy, 4)),
    duracionEstimadaMeses: 24,
    valorTotal: 3_400_000,
    cuotaInicial: 400_000,
    numeroCuotas: 24,
    valorCuotaMensual: 125_000,
    estado: 'activo',
    profesionalId: 'pro-1',
  });

  // Índices 2 a 17: completan los dieciocho tratamientos de ortodoncia activos.
  for (let i = 2; i < 18; i++) {
    const duracion = enteroEntre(18, 24);
    const avance = enteroEntre(1, duracion - 2);
    const cuotas = duracion;
    const valorCuota = enteroEntre(11, 18) * 10_000;
    const inicial = enteroEntre(4, 8) * 100_000;

    tratamientos.push({
      id: nuevoIdTratamiento(),
      pacienteId: pacientes[i].id,
      tipo: 'ortodoncia',
      fechaInicio: dia(subMonths(addDays(hoy, enteroEntre(-12, 12)), avance - 1)),
      duracionEstimadaMeses: duracion,
      valorTotal: inicial + cuotas * valorCuota,
      cuotaInicial: inicial,
      numeroCuotas: cuotas,
      valorCuotaMensual: valorCuota,
      estado: 'activo',
      profesionalId: azar() < 0.75 ? 'pro-1' : 'pro-2',
    });
  }

  // Estética y odontología general en curso.
  for (let i = 18; i < 22; i++) {
    const valor = enteroEntre(6, 22) * 100_000;
    tratamientos.push({
      id: nuevoIdTratamiento(),
      pacienteId: pacientes[i].id,
      tipo: azar() < 0.5 ? 'estetica' : 'general',
      fechaInicio: dia(subMonths(hoy, enteroEntre(0, 3))),
      duracionEstimadaMeses: enteroEntre(1, 4),
      valorTotal: valor,
      cuotaInicial: Math.round(valor * 0.4),
      numeroCuotas: 3,
      valorCuotaMensual: Math.round((valor * 0.6) / 3),
      estado: 'activo',
      profesionalId: azar() < 0.5 ? 'pro-2' : 'pro-3',
    });
  }

  // Ortodoncias terminadas: dan realismo al historial de la clínica.
  for (let i = 22; i < 25; i++) {
    const duracion = enteroEntre(18, 22);
    const valorCuota = 140_000;
    tratamientos.push({
      id: nuevoIdTratamiento(),
      pacienteId: pacientes[i].id,
      tipo: 'ortodoncia',
      fechaInicio: dia(subMonths(hoy, duracion + enteroEntre(1, 6))),
      duracionEstimadaMeses: duracion,
      valorTotal: 500_000 + duracion * valorCuota,
      cuotaInicial: 500_000,
      numeroCuotas: duracion,
      valorCuotaMensual: valorCuota,
      estado: 'finalizado',
      profesionalId: 'pro-1',
    });
  }

  /* -------------------------------------------------------- citas y solicitudes -- */

  const citas: Cita[] = [];
  const solicitudes: SolicitudCita[] = [];

  /** Toda cita nace de una solicitud: se crean juntas para no romper la trazabilidad. */
  function registrarCita(
    pacienteId: string,
    profesionalId: string,
    inicio: Date,
    tipo: TipoCita,
    estadoCita: EstadoCita,
    notasClinicas?: string,
  ): Cita {
    const duracion = DURACION_POR_TIPO[tipo];
    const requiereAprobacion = tipo !== 'control';
    const creadaEn = addDays(inicio, -enteroEntre(2, 12));

    const solicitud: SolicitudCita = {
      id: nuevoIdSolicitud(),
      pacienteId,
      profesionalId,
      fechaHoraSolicitada: inicio.toISOString(),
      duracionMinutos: duracion,
      tipo,
      estado: requiereAprobacion ? 'aprobada' : 'confirmada',
      creadaEn: creadaEn.toISOString(),
      resueltaEn: addDays(creadaEn, requiereAprobacion ? 1 : 0).toISOString(),
      requiereAprobacion,
    };
    solicitudes.push(solicitud);

    const cita: Cita = {
      id: nuevoIdCita(),
      solicitudId: solicitud.id,
      pacienteId,
      profesionalId,
      fechaHora: inicio.toISOString(),
      duracionMinutos: duracion,
      tipo,
      estado: estadoCita,
      notasClinicas,
    };
    citas.push(cita);
    agenda.reservar(profesionalId, inicio, duracion);
    return cita;
  }

  const activos = tratamientos.filter((t) => t.estado === 'activo');

  // 1. Próxima cita del paciente destacado. Se agenda primero para que caiga en
  //    una hora presentable y no en el hueco que sobre.
  const destacado = tratamientos[0];
  const cupoDestacado = agenda.buscarCupo(addDays(hoy, 3), 'control', azar, destacado.profesionalId, {
    hora: 10,
    minuto: 30,
  });
  if (cupoDestacado) {
    registrarCita(
      destacado.pacienteId,
      cupoDestacado.profesionalId,
      cupoDestacado.inicio,
      'control',
      'confirmada',
    );
  }

  // Pacientes silenciosos: ortodoncia activa, último control hace más de 35 días
  // y ninguna cita futura. Es el riesgo real del negocio —nadie los nota hasta
  // que acumulan cuotas vencidas— y la alerta que más peso tiene en la reunión.
  const DIAS_DE_SILENCIO = [38, 47, 62, 79, 96];
  const ortodonciasActivas = activos.filter((t) => t.tipo === 'ortodoncia');
  const silenciosos = new Map<string, number>();
  DIAS_DE_SILENCIO.forEach((dias, indice) => {
    // Se saltan los dos primeros tratamientos: son los pacientes de prueba y
    // deben verse al día.
    const tratamiento = ortodonciasActivas[3 + indice * 3];
    if (tratamiento) silenciosos.set(tratamiento.id, dias);
  });

  // 2. Historial mensual de cada tratamiento activo: un control por mes cursado.
  for (const tratamiento of activos) {
    const silencio = silenciosos.get(tratamiento.id);
    const mesesCursados = Math.max(
      0,
      Math.round((hoy.getTime() - new Date(`${tratamiento.fechaInicio}T00:00:00`).getTime()) / 2_592_000_000),
    );

    if (silencio !== undefined) {
      // Su último control cae justo antes del umbral de alerta, y los anteriores
      // van mes a mes hacia atrás.
      for (let k = 2; k >= 0; k--) {
        const objetivo = subDays(hoy, silencio + k * 31);
        const cupo = agenda.buscarCupo(objetivo, 'control', azar, tratamiento.profesionalId);
        if (!cupo || cupo.inicio.getTime() >= subDays(hoy, DIAS_SIN_CONTROL_ALERTA).getTime()) continue;
        registrarCita(
          tratamiento.pacienteId,
          cupo.profesionalId,
          cupo.inicio,
          'control',
          k === 0 && azar() < 0.5 ? 'no_asistio' : 'asistio',
          'Ajuste de arco y cambio de ligas.',
        );
      }
      continue;
    }

    const historial = Math.min(mesesCursados, 5);
    for (let k = historial; k >= 1; k--) {
      const objetivo = addDays(subMonths(hoy, k), enteroEntre(-3, 3));
      if (objetivo.getTime() >= hoy.getTime()) continue;
      const cupo = agenda.buscarCupo(objetivo, 'control', azar, tratamiento.profesionalId);
      if (!cupo || cupo.inicio.getTime() >= hoy.getTime()) continue;
      registrarCita(
        tratamiento.pacienteId,
        cupo.profesionalId,
        cupo.inicio,
        'control',
        azar() < 0.12 ? 'no_asistio' : 'asistio',
        'Ajuste de arco y cambio de ligas.',
      );
    }
  }

  // 3. Ciclo actual repartido entre la semana pasada, esta y las dos siguientes.
  //    Los silenciosos quedan fuera a propósito: no tienen cita agendada.
  const restantes = activos.slice(1).filter((t) => !silenciosos.has(t.id));
  restantes.forEach((tratamiento, indice) => {
    const desplazamiento = -7 + Math.round((indice * 21) / Math.max(1, restantes.length - 1));
    const objetivo = addDays(hoy, desplazamiento);
    const cupo = agenda.buscarCupo(objetivo, 'control', azar, tratamiento.profesionalId);
    if (!cupo) return;
    const yaPaso = cupo.inicio.getTime() < ahora.getTime();
    registrarCita(
      tratamiento.pacienteId,
      cupo.profesionalId,
      cupo.inicio,
      'control',
      yaPaso ? (azar() < 0.1 ? 'no_asistio' : 'asistio') : 'confirmada',
    );
  });

  // 4. Un puñado de valoraciones y procedimientos, para que la agenda no sea
  //    solo controles de ortodoncia.
  for (let i = 0; i < 8; i++) {
    const paciente = pacientes[enteroEntre(18, 24)];
    const tipo: TipoCita = azar() < 0.5 ? 'valoracion' : 'procedimiento';
    const objetivo = addDays(hoy, enteroEntre(-6, 13));
    const cupo = agenda.buscarCupo(objetivo, tipo, azar, azar() < 0.5 ? 'pro-2' : 'pro-3');
    if (!cupo) continue;
    const yaPaso = cupo.inicio.getTime() < ahora.getTime();
    registrarCita(
      paciente.id,
      cupo.profesionalId,
      cupo.inicio,
      tipo,
      yaPaso ? 'asistio' : 'confirmada',
    );
  }

  /* ------------------------------------------------- solicitudes sin resolver -- */

  /** Reserva el hueco para que el portal no vuelva a ofrecerlo mientras se decide. */
  function reservarPendiente(inicio: Date, tipo: TipoCita): void {
    agenda.reservarCupoGenerico(inicio, DURACION_POR_TIPO[tipo]);
  }

  // Contrapropuesta para el segundo paciente de prueba: la clínica no pudo con
  // el horario pedido y le ofrece dos alternativas.
  const pedidoOriginal = agenda.buscarCupo(addDays(hoy, 2), 'procedimiento', azar, 'pro-3');
  const alternativa1 = agenda.buscarCupo(addDays(hoy, 4), 'procedimiento', azar, 'pro-3');
  const alternativa2 = agenda.buscarCupo(addDays(hoy, 6), 'procedimiento', azar, 'pro-2');

  if (pedidoOriginal && alternativa1 && alternativa2) {
    solicitudes.push({
      id: nuevoIdSolicitud(),
      pacienteId: pacientes[1].id,
      fechaHoraSolicitada: pedidoOriginal.inicio.toISOString(),
      duracionMinutos: DURACION_POR_TIPO.procedimiento,
      tipo: 'procedimiento',
      estado: 'contrapropuesta',
      motivoConsulta: 'Limpieza y revisión de una resina que se me despicó.',
      horariosPropuestos: [alternativa1.inicio.toISOString(), alternativa2.inicio.toISOString()],
      creadaEn: addDays(hoy, -1).toISOString(),
      resueltaPor: 'usr-secretaria',
      requiereAprobacion: true,
    });
    reservarPendiente(alternativa1.inicio, 'procedimiento');
    reservarPendiente(alternativa2.inicio, 'procedimiento');
  }

  /**
   * Bandeja de entrada de la clínica: cuatro solicitudes esperando decisión.
   * Las horas de llegada están escalonadas a propósito —2, 9, 15 y 21 horas—
   * para que se vean los tres estados de la alerta: reciente, pasadas las 12 h,
   * y a punto de expirar a las 24 h.
   */
  const PENDIENTES: Array<{
    tipo: TipoCita;
    horasDesdeCreada: number;
    diasAdelante: number;
    /** Índice del paciente registrado, o null si es alguien sin cuenta. */
    pacienteIndice: number | null;
    motivo: string;
  }> = [
    {
      tipo: 'valoracion',
      horasDesdeCreada: 2,
      diasAdelante: 4,
      pacienteIndice: null,
      motivo: 'Quiero saber si necesito brackets.',
    },
    {
      tipo: 'urgencia',
      horasDesdeCreada: 9,
      diasAdelante: 1,
      pacienteIndice: 20,
      motivo: 'Se me partió un diente esta mañana y me duele al masticar.',
    },
    {
      tipo: 'procedimiento',
      horasDesdeCreada: 15,
      diasAdelante: 6,
      pacienteIndice: 22,
      motivo: 'Necesito limpieza y una resina que se me cayó.',
    },
    {
      tipo: 'valoracion',
      horasDesdeCreada: 21,
      diasAdelante: 8,
      pacienteIndice: null,
      motivo: 'Mi hija tiene los dientes de adelante montados.',
    },
  ];

  for (const pendiente of PENDIENTES) {
    const cupo = agenda.buscarCupo(addDays(hoy, pendiente.diasAdelante), pendiente.tipo, azar);
    if (!cupo) continue;

    const creadaEn = new Date(ahora.getTime() - pendiente.horasDesdeCreada * 3_600_000);
    const registrado = pendiente.pacienteIndice !== null ? pacientes[pendiente.pacienteIndice] : null;

    // Los que no tienen cuenta dejan sus datos de contacto; si son menores,
    // el acudiente es obligatorio porque ahí llegan las confirmaciones.
    const esMenor = !registrado && pendiente.motivo.includes('hija');
    const nombres = esMenor ? elegir(NOMBRES_F) : elegir(azar() < 0.5 ? NOMBRES_F : NOMBRES_M);

    solicitudes.push({
      id: nuevoIdSolicitud(),
      pacienteId: registrado?.id,
      datosContacto: registrado
        ? undefined
        : {
            nombres,
            apellidos: `${elegir(APELLIDOS)} ${elegir(APELLIDOS)}`,
            telefono: `3${enteroEntre(0, 2)}${enteroEntre(0, 9)}${String(enteroEntre(1000000, 9999999))}`,
            tipoDocumento: esMenor ? 'TI' : 'CC',
            numeroDocumento: String((esMenor ? 1100000000 : 1000000000) + enteroEntre(0, 89999999)),
            acudiente: esMenor
              ? {
                  nombre: `${elegir(NOMBRES_F)} ${elegir(APELLIDOS)}`,
                  telefono: `31${enteroEntre(0, 9)}${String(enteroEntre(1000000, 9999999))}`,
                  parentesco: 'Madre',
                }
              : undefined,
          },
      fechaHoraSolicitada: cupo.inicio.toISOString(),
      duracionMinutos: DURACION_POR_TIPO[pendiente.tipo],
      tipo: pendiente.tipo,
      estado: 'solicitada',
      motivoConsulta: pendiente.motivo,
      creadaEn: creadaEn.toISOString(),
      expiraEn: new Date(creadaEn.getTime() + HORAS_PARA_EXPIRAR * 3_600_000).toISOString(),
      requiereAprobacion: true,
    });
    reservarPendiente(cupo.inicio, pendiente.tipo);
  }

  /* ------------------------------------------------------------------- cuotas -- */

  const cuotas: Cuota[] = [];

  const METODOS = ['efectivo', 'transferencia', 'tarjeta'] as const;

  // Primera pasada: todo lo vencido se da por pagado. La mora se decide después,
  // sobre casos concretos, para que la cartera dé cifras exactas y no aleatorias.
  for (const tratamiento of tratamientos) {
    const inicio = new Date(`${tratamiento.fechaInicio}T00:00:00`);

    for (let numero = 0; numero <= tratamiento.numeroCuotas; numero++) {
      const vencimiento = addMonths(inicio, numero);
      const esInicial = numero === 0;
      const yaVencio = vencimiento.getTime() < hoy.getTime();
      const estado: Cuota['estado'] = yaVencio ? 'pagada' : 'pendiente';
      const fechaPago = yaVencio ? addDays(vencimiento, -enteroEntre(0, 4)) : undefined;

      cuotas.push({
        id: nuevoIdCuota(),
        tratamientoId: tratamiento.id,
        numeroCuota: numero,
        mesCorrespondiente: mes(vencimiento),
        valor: esInicial ? tratamiento.cuotaInicial : tratamiento.valorCuotaMensual,
        fechaVencimiento: dia(vencimiento),
        estado,
        fechaPago: fechaPago ? dia(fechaPago) : undefined,
        metodoPago: yaVencio ? METODOS[enteroEntre(0, 2)] : undefined,
        registradaPor: yaVencio ? 'usr-secretaria' : undefined,
      });
    }
  }

  /**
   * Segunda pasada: cuatro cuotas vencidas con moras distintas —8, 21, 45 y 63
   * días— sobre los pacientes silenciosos. No es casualidad: el paciente que
   * deja de venir a control es el mismo que deja de pagar, y esa correlación es
   * justo lo que la clínica no ve hoy.
   */
  const MORAS = [8, 21, 45, 63];
  const idsSilenciosos = [...silenciosos.keys()];
  MORAS.forEach((diasMora, indice) => {
    const tratamientoId = idsSilenciosos[indice];
    if (!tratamientoId) return;
    // La última cuota ya vencida de ese tratamiento pasa a mora.
    const candidatas = cuotas
      .filter((c) => c.tratamientoId === tratamientoId && c.numeroCuota > 0 && c.estado === 'pagada')
      .sort((a, b) => b.numeroCuota - a.numeroCuota);
    const cuota = candidatas[0];
    if (!cuota) return;

    const vencimiento = subDays(hoy, diasMora);
    cuota.estado = 'vencida';
    cuota.fechaVencimiento = dia(vencimiento);
    cuota.mesCorrespondiente = mes(vencimiento);
    cuota.fechaPago = undefined;
    cuota.metodoPago = undefined;
    cuota.registradaPor = undefined;
  });

  /**
   * Tercera pasada: exactamente seis cuotas pendientes con vencimiento dentro del
   * mes en curso, empezando por la del paciente destacado. Las demás del mes se
   * dan por pagadas. Así la vista de cartera del mes muestra 6 pendientes y 4
   * vencidas, sin depender de en qué día del mes se abra el demo.
   */
  const mesActual = mes(hoy);
  const finDeMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0, 23, 59, 59);
  const delMes = cuotas.filter((c) => c.mesCorrespondiente === mesActual && c.estado !== 'vencida');
  const tratamientoDestacado = tratamientos[0].id;

  delMes.sort((a, b) => {
    if (a.tratamientoId === tratamientoDestacado) return -1;
    if (b.tratamientoId === tratamientoDestacado) return 1;
    return a.tratamientoId.localeCompare(b.tratamientoId);
  });

  delMes.forEach((cuota, indice) => {
    if (indice < 6) {
      // Si su vencimiento ya pasó, se corre a un día futuro dentro del mismo mes.
      const vencimiento = new Date(`${cuota.fechaVencimiento}T00:00:00`);
      if (vencimiento.getTime() < hoy.getTime()) {
        const propuesto = addDays(hoy, 2 + indice);
        cuota.fechaVencimiento = dia(propuesto.getTime() > finDeMes.getTime() ? finDeMes : propuesto);
      }
      cuota.estado = 'pendiente';
      cuota.fechaPago = undefined;
      cuota.metodoPago = undefined;
      cuota.registradaPor = undefined;
    } else if (cuota.estado === 'pendiente') {
      cuota.estado = 'pagada';
      cuota.fechaPago = dia(subDays(hoy, enteroEntre(1, 10)));
      cuota.metodoPago = METODOS[enteroEntre(0, 2)];
      cuota.registradaPor = 'usr-secretaria';
    }
  });

  /* ---------------------------------------------------------- notificaciones -- */

  // Mensajes de WhatsApp ya enviados, para que la ficha del paciente tenga
  // historial y el argumento del canal se vea funcionando desde el primer minuto.
  const notificaciones: Notificacion[] = [];
  const resueltas = solicitudes
    .filter((s) => s.pacienteId && (s.estado === 'confirmada' || s.estado === 'aprobada'))
    .sort((a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime())
    .slice(0, 12);

  for (const solicitud of resueltas) {
    const paciente = pacientes.find((p) => p.id === solicitud.pacienteId);
    if (!paciente) continue;
    const cita = citas.find((c) => c.solicitudId === solicitud.id);
    const profesional = profesionales.find((p) => p.id === solicitud.profesionalId);
    const tipo = solicitud.estado === 'confirmada' ? 'confirmada' : 'aprobada';

    notificaciones.push({
      id: `not-${notificaciones.length + 1}`.padStart(7, '0'),
      pacienteId: paciente.id,
      solicitudId: solicitud.id,
      canal: 'whatsapp',
      tipo,
      mensaje: redactarMensaje(tipo, { paciente, solicitud, cita, profesional }),
      enviadaEn: solicitud.resueltaEn ?? solicitud.creadaEn,
      destinatario: destinatarioDe(paciente).numero,
    });
  }

  // La contrapropuesta pendiente también generó su mensaje en su momento.
  const contrapropuesta = solicitudes.find((s) => s.estado === 'contrapropuesta');
  if (contrapropuesta?.pacienteId) {
    const paciente = pacientes.find((p) => p.id === contrapropuesta.pacienteId);
    if (paciente) {
      notificaciones.push({
        id: `not-${notificaciones.length + 1}`,
        pacienteId: paciente.id,
        solicitudId: contrapropuesta.id,
        canal: 'whatsapp',
        tipo: 'contrapropuesta',
        mensaje: redactarMensaje('contrapropuesta', { paciente, solicitud: contrapropuesta }),
        enviadaEn: contrapropuesta.creadaEn,
        destinatario: destinatarioDe(paciente).numero,
      });
    }
  }

  /* ---------------------------------------------------------------- bitácora -- */

  // Actividad de los últimos días. El dueño quiere saber quién cambió qué, así
  // que el registro guarda el nombre del usuario tal como estaba al momento.
  const bitacora: RegistroBitacora[] = [];
  const porUsuario = new Map(usuarios.map((u) => [u.id, u]));

  function anotar(usuarioId: string, accion: string, detalle: string, horasAtras: number): void {
    const usuario = porUsuario.get(usuarioId);
    if (!usuario) return;
    bitacora.push({
      id: `bit-${String(bitacora.length + 1).padStart(3, '0')}`,
      usuarioId,
      nombreUsuario: usuario.nombre,
      rol: usuario.rol,
      accion,
      detalle,
      fechaHora: new Date(ahora.getTime() - horasAtras * 3_600_000).toISOString(),
    });
  }

  const nombreDe = (paciente: Paciente) => `${paciente.nombres} ${paciente.apellidos}`;

  anotar('usr-secretaria', 'Registró pago', `Cuota de ${nombreDe(pacientes[6])} por transferencia`, 3);
  anotar('usr-odontologo', 'Registró asistencia', `Control de ${nombreDe(pacientes[4])}`, 4);
  anotar('usr-secretaria', 'Aprobó solicitud', `Valoración de ${nombreDe(pacientes[19])}`, 5);
  anotar('usr-odontologo', 'Agregó nota clínica', `Tratamiento de ${nombreDe(pacientes[2])}`, 6);
  anotar('usr-secretaria', 'Registró asistencia', `Control de ${nombreDe(pacientes[8])}`, 7);
  anotar('usr-administrador', 'Consultó cartera', 'Cuotas vencidas del mes en curso', 9);
  anotar('usr-secretaria', 'Propuso otro horario', `Procedimiento de ${nombreDe(pacientes[1])}`, 24);
  anotar('usr-secretaria', 'Registró pago', `Cuota de ${nombreDe(pacientes[11])} en efectivo`, 27);
  anotar('usr-odontologo', 'Registró asistencia', `Control de ${nombreDe(pacientes[13])}`, 28);
  anotar('usr-secretaria', 'Creó paciente', nombreDe(pacientes[24]), 30);
  anotar('usr-administrador', 'Actualizó tarifa', 'Ortodoncia: cuota mensual pasa a $160.000', 32);
  anotar('usr-secretaria', 'Rechazó solicitud', 'Urgencia fuera del horario de atención', 33);
  anotar('usr-odontologo', 'Agregó nota clínica', `Tratamiento de ${nombreDe(pacientes[9])}`, 50);
  anotar('usr-secretaria', 'Registró pago', `Cuota de ${nombreDe(pacientes[15])} con tarjeta`, 52);
  anotar('usr-secretaria', 'Aprobó solicitud', `Procedimiento de ${nombreDe(pacientes[21])}`, 54);
  anotar('usr-administrador', 'Creó usuario', 'Secretaria: Liliana Ospino Barrios', 72);
  anotar('usr-odontologo', 'Registró inasistencia', `Control de ${nombreDe(pacientes[16])}`, 74);
  anotar('usr-secretaria', 'Reagendó cita', `Control de ${nombreDe(pacientes[10])}`, 76);

  bitacora.sort((a, b) => new Date(b.fechaHora).getTime() - new Date(a.fechaHora).getTime());

  return {
    version: VERSION_DATOS,
    revision: 1,
    generadoEn: new Date().toISOString(),
    usuarios,
    profesionales,
    pacientes,
    tratamientos,
    solicitudes,
    notificaciones,
    bitacora,
    citas,
    cuotas,
  };
}
