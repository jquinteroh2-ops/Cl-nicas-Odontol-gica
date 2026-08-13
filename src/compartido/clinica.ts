/**
 * Datos reales de la clínica. Único lugar donde viven.
 * Los iconos se nombran, no se importan: este archivo no depende de React.
 */

export const CLINICA = {
  nombre: 'Dentistetic Turbaco',
  descripcion: 'Clínica de Ortodoncia y Estética Dental',
  aniosTrayectoria: 15,
  pacientesAtendidos: 5000,
  direccion: 'Cra 16 #24-75, Barrio 13 de Junio',
  ciudad: 'Turbaco, Bolívar',
  referencia: 'Media cuadra antes de llegar al Éxito',
  /** Formato crudo, sin espacios. Usa formatoTelefono() para mostrarlo. */
  whatsapp: '+573126689413',
} as const;

export const DIRECCION_COMPLETA = `${CLINICA.direccion}, ${CLINICA.ciudad}`;

/** Enlace wa.me con mensaje precargado. */
export function enlaceWhatsApp(mensaje?: string): string {
  const numero = CLINICA.whatsapp.replace(/\D/g, '');
  const texto = mensaje ?? `Hola, escribo desde el portal de ${CLINICA.nombre}.`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export interface FranjaHorarioAtencion {
  /** Etiqueta visible. */
  dias: string;
  horario: string;
  cerrado: boolean;
}

/** Tal como se anuncia al público. Las reglas operativas viven en disponibilidad.ts. */
export const HORARIO_PUBLICO: FranjaHorarioAtencion[] = [
  { dias: 'Lunes a viernes', horario: '8:00 a.m. – 6:00 p.m.', cerrado: false },
  { dias: 'Sábados', horario: '8:00 a.m. – 12:00 m.', cerrado: false },
  { dias: 'Domingos', horario: 'Cerrado', cerrado: true },
];

export interface Servicio {
  id: string;
  nombre: string;
  descripcion: string;
  /** Nombre del icono de lucide-react. La interfaz lo resuelve. */
  icono: string;
}

export const SERVICIOS: Servicio[] = [
  {
    id: 'ortodoncia',
    nombre: 'Ortodoncia',
    descripcion: 'Brackets metálicos con control mensual y plan de pagos.',
    icono: 'AlignHorizontalDistributeCenter',
  },
  {
    id: 'brackets-transparentes',
    nombre: 'Brackets transparentes',
    descripcion: 'La misma corrección, prácticamente invisible.',
    icono: 'Sparkles',
  },
  {
    id: 'resinas',
    nombre: 'Resinas',
    descripcion: 'Restauración estética del color natural del diente.',
    icono: 'Layers',
  },
  {
    id: 'limpieza',
    nombre: 'Limpieza y profilaxis',
    descripcion: 'Remoción de placa y sarro. Recomendada cada seis meses.',
    icono: 'Wind',
  },
  {
    id: 'periodoncia',
    nombre: 'Periodoncia',
    descripcion: 'Tratamiento de encías y tejidos de soporte.',
    icono: 'HeartPulse',
  },
  {
    id: 'endodoncia',
    nombre: 'Endodoncia',
    descripcion: 'Tratamiento de conducto para salvar el diente.',
    icono: 'Syringe',
  },
  {
    id: 'rehabilitacion',
    nombre: 'Rehabilitación oral',
    descripcion: 'Coronas, puentes y prótesis para recuperar la función.',
    icono: 'Wrench',
  },
  {
    id: 'blanqueamiento',
    nombre: 'Blanqueamiento',
    descripcion: 'Aclaramiento dental profesional en consultorio.',
    icono: 'Sun',
  },
];

/* ------------------------------------------------------------------ redes -- */

export interface RedSocial {
  nombre: string;
  url: string;
  /** Marca a dibujar. La resuelve `IconoRed`. */
  icono: 'facebook' | 'instagram' | 'whatsapp';
}

/**
 * Perfiles de la clínica. Los enlaces son de muestra: al publicar hay que
 * reemplazarlos por los reales, o quitar la red que no se use.
 */
export const REDES: RedSocial[] = [
  { nombre: 'Facebook', url: 'https://www.facebook.com/dentistetic.turbaco', icono: 'facebook' },
  { nombre: 'Instagram', url: 'https://www.instagram.com/dentistetic.turbaco', icono: 'instagram' },
  { nombre: 'WhatsApp', url: enlaceWhatsApp(), icono: 'whatsapp' },
];

/* ------------------------------------------------------------------ cifras -- */

export interface Cifra {
  valor: number;
  prefijo?: string;
  sufijo?: string;
  etiqueta: string;
  icono: string;
}

/** Las cuatro cifras de la banda intermedia. Suben desde cero al aparecer. */
export const CIFRAS: Cifra[] = [
  {
    valor: CLINICA.aniosTrayectoria,
    etiqueta: 'Años de trayectoria',
    icono: 'CalendarCheck',
  },
  {
    valor: CLINICA.pacientesAtendidos,
    prefijo: '+',
    etiqueta: 'Pacientes atendidos',
    icono: 'Users',
  },
  { valor: 1200, prefijo: '+', etiqueta: 'Tratamientos de ortodoncia', icono: 'Smile' },
  { valor: 6, etiqueta: 'Días de atención a la semana', icono: 'Clock' },
];

/* --------------------------------------------------- reparto de la consulta -- */

export interface ProporcionTratamiento {
  nombre: string;
  /** Porcentaje sobre el total de tratamientos del último año. */
  porcentaje: number;
}

/**
 * Qué se hace más en el consultorio. Son barras de reparto, no de "destreza":
 * una clínica no se autocalifica, pero sí puede decir en qué se especializa.
 */
export const REPARTO_TRATAMIENTOS: ProporcionTratamiento[] = [
  { nombre: 'Ortodoncia', porcentaje: 46 },
  { nombre: 'Odontología general y limpieza', porcentaje: 24 },
  { nombre: 'Estética dental', porcentaje: 14 },
  { nombre: 'Rehabilitación oral', porcentaje: 9 },
  { nombre: 'Endodoncia y periodoncia', porcentaje: 7 },
];

/* -------------------------------------------------------------- actualidad -- */

export interface Articulo {
  id: string;
  categoria: string;
  titulo: string;
  resumen: string;
  /** Nombre del icono de lucide-react para la portada. */
  icono: string;
  /** Minutos de lectura aproximados. */
  lectura: number;
}

/** Contenido informativo de la portada. Educa y da algo que compartir. */
export const ARTICULOS: Articulo[] = [
  {
    id: 'limpieza',
    categoria: 'Prevención',
    titulo: '¿Cada cuánto debo hacerme una limpieza dental?',
    resumen:
      'La recomendación general es cada seis meses. Si usas brackets o tienes tendencia a formar sarro, tu odontóloga puede acortar ese plazo.',
    icono: 'Wind',
    lectura: 3,
  },
  {
    id: 'brackets',
    categoria: 'Ortodoncia',
    titulo: 'Brackets metálicos o transparentes: cómo elegir',
    resumen:
      'Corrigen igual y el tiempo de tratamiento es parecido. La diferencia está en cuánto se notan, en el cuidado diario y en el precio.',
    icono: 'Sparkles',
    lectura: 4,
  },
  {
    id: 'urgencias',
    categoria: 'Urgencias',
    titulo: 'Qué hacer ante un golpe o un dolor dental fuerte',
    resumen:
      'Si se desprende un diente, guárdalo en leche y no lo frotes. Escríbenos por WhatsApp: las urgencias se atienden el mismo día.',
    icono: 'HeartPulse',
    lectura: 3,
  },
];

/** Aviso permanente. La app no puede presentarse como el sistema real de la clínica. */
export const AVISO_DEMO = 'Versión de demostración';
export const AVISO_DEMO_DETALLE =
  'Los datos que ves son ficticios y se generan al abrir la aplicación. No corresponden a pacientes reales.';
