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

/** Aviso permanente. La app no puede presentarse como el sistema real de la clínica. */
export const AVISO_DEMO = 'Versión de demostración';
export const AVISO_DEMO_DETALLE =
  'Los datos que ves son ficticios y se generan al abrir la aplicación. No corresponden a pacientes reales.';
