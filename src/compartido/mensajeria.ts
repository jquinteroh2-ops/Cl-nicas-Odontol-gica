/**
 * Redacción de los mensajes de WhatsApp.
 *
 * El canal de esta clínica es WhatsApp: sus pacientes no revisan correo. Si el
 * paciente es menor de edad (documento TI), todo mensaje va al teléfono del
 * acudiente y se le habla a él, no al menor.
 *
 * Tono: español colombiano, de "tú", cordial y corto. Emojis con cuentagotas,
 * uno por mensaje como máximo — en la interfaz no va ninguno.
 */

import type {
  Cita,
  Notificacion,
  Paciente,
  Profesional,
  SolicitudCita,
  TipoCita,
  TipoNotificacion,
} from './tipos';
import { CLINICA } from './clinica';
import { ETIQUETA_TIPO_CITA, formatoFechaHoraLarga, nombreCompleto } from './formato';

export interface Destinatario {
  numero: string;
  nombre: string;
  /** Verdadero cuando el mensaje va al acudiente en vez de al paciente. */
  esAcudiente: boolean;
}

/** A quién se le escribe: al acudiente si el paciente tiene tarjeta de identidad. */
export function destinatarioDe(paciente: Paciente): Destinatario {
  if (paciente.tipoDocumento === 'TI' && paciente.acudiente) {
    return {
      numero: paciente.acudiente.telefono,
      nombre: paciente.acudiente.nombre,
      esAcudiente: true,
    };
  }
  return { numero: paciente.telefono, nombre: nombreCompleto(paciente), esAcudiente: false };
}

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0];

/**
 * Baja solo la inicial, para encajar una frase en mitad de otra.
 *
 * `toLowerCase()` sobre el texto entero se comía los nombres propios: la
 * referencia de la clínica es "…antes de llegar al Éxito" —el supermercado— y
 * salía "al éxito", que se lee como otra cosa. Con los motivos de rechazo, que
 * los escribe a mano quien atiende, pasaba igual con cualquier ciudad o nombre.
 */
const inicialEnMinuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1);

/** Artículo de cada tipo de cita: "la valoración", "el control de ortodoncia". */
const ARTICULO_TIPO_CITA: Record<TipoCita, 'el' | 'la'> = {
  valoracion: 'la',
  control: 'el',
  procedimiento: 'el',
  urgencia: 'la',
};

/**
 * Arma el sintagma completo: "tu cita" al paciente, "la cita de Juan" al
 * acudiente. Tiene que construir la frase entera y no devolver un trozo suelto
 * porque el posesivo va antes del sustantivo y el complemento con "de" va
 * después; encajar los dos en el mismo hueco produce "la solicitud de de Juan
 * cita".
 */
function frase(
  articulo: 'el' | 'la',
  sustantivo: string,
  paciente: Paciente,
  destinatario: Destinatario,
): string {
  return destinatario.esAcudiente
    ? `${articulo} ${sustantivo} de ${primerNombre(paciente.nombres)}`
    : `tu ${sustantivo}`;
}

export interface ContextoMensaje {
  paciente: Paciente;
  solicitud?: SolicitudCita;
  cita?: Cita;
  profesional?: Profesional;
  motivoRechazo?: string;
}

/**
 * Texto del mensaje según el desenlace de la solicitud.
 * Devuelve el cuerpo listo para enviar, sin codificar.
 */
export function redactarMensaje(tipo: TipoNotificacion, contexto: ContextoMensaje): string {
  const { paciente, solicitud, cita, profesional, motivoRechazo } = contexto;
  const destinatario = destinatarioDe(paciente);
  const hola = `Hola ${primerNombre(destinatario.nombre)}`;
  const de = (articulo: 'el' | 'la', sustantivo: string) =>
    frase(articulo, sustantivo, paciente, destinatario);
  const conProfesional = profesional ? ` con ${profesional.nombre}` : '';
  const direccion = `${CLINICA.direccion}, ${inicialEnMinuscula(CLINICA.referencia)}`;

  switch (tipo) {
    case 'confirmada': {
      const cuando = formatoFechaHoraLarga(cita?.fechaHora ?? solicitud?.fechaHoraSolicitada ?? '');
      return (
        `${hola} 👋 Quedó confirmada ${de('la', 'cita')} en ${CLINICA.nombre} para el ${cuando.toLowerCase()}${conProfesional}. ` +
        `Te esperamos en ${direccion}. Si no puedes asistir, avísanos por aquí.`
      );
    }

    case 'aprobada': {
      const cuando = formatoFechaHoraLarga(cita?.fechaHora ?? solicitud?.fechaHoraSolicitada ?? '');
      const clase = solicitud ? ETIQUETA_TIPO_CITA[solicitud.tipo].toLowerCase() : 'cita';
      const articulo = solicitud ? ARTICULO_TIPO_CITA[solicitud.tipo] : 'la';
      return (
        `${hola} 👋 Ya aprobamos ${de(articulo, clase)} en ${CLINICA.nombre}: ${cuando.toLowerCase()}${conProfesional}. ` +
        `Quedamos atentos en ${direccion}.`
      );
    }

    case 'contrapropuesta': {
      const opciones = (solicitud?.horariosPropuestos ?? [])
        .map((horario, indice) => `${indice + 1}) ${formatoFechaHoraLarga(horario).toLowerCase()}`)
        .join('\n');
      return (
        `${hola} 👋 Recibimos ${de('la', 'solicitud de cita')} en ${CLINICA.nombre}. ` +
        `A la hora que pediste ya tenemos la agenda ocupada, pero te ofrecemos dos opciones:\n\n${opciones}\n\n` +
        `Respóndenos con el número que te sirva, o elígela desde tu portal. Si ninguna te queda bien, dinos y buscamos otra.`
      );
    }

    case 'rechazada':
      return (
        `${hola}, gracias por escribirnos a ${CLINICA.nombre}. ` +
        `Esta vez no pudimos agendar ${de('la', 'cita')}${motivoRechazo ? `: ${inicialEnMinuscula(motivoRechazo)}` : '.'} ` +
        `Escríbenos por aquí y con gusto buscamos una fecha que te sirva.`
      );

    case 'recordatorio': {
      const cuando = formatoFechaHoraLarga(cita?.fechaHora ?? '');
      return (
        `${hola} 👋 Te recordamos ${de('el', 'control de ortodoncia')} en ${CLINICA.nombre}: ` +
        `${cuando.toLowerCase()}${conProfesional}. Recuerda que el control mensual evita que el tratamiento se alargue. ` +
        `Si no puedes, avísanos y lo reprogramamos.`
      );
    }
  }
}

/**
 * Enlace wa.me a un número suelto. La vista previa del panel parte de la
 * Notificacion ya registrada, que guarda el destinatario pero no el paciente.
 */
export function enlaceWhatsAppNumero(numero: string, mensaje: string): string {
  const digitos = numero.replace(/\D/g, '');
  const conIndicativo = digitos.length === 10 ? `57${digitos}` : digitos;
  return `https://wa.me/${conIndicativo}?text=${encodeURIComponent(mensaje)}`;
}

/** Enlace wa.me al número del paciente (o del acudiente) con el mensaje precargado. */
export function enlaceWhatsAppPaciente(paciente: Paciente, mensaje: string): string {
  return enlaceWhatsAppNumero(destinatarioDe(paciente).numero, mensaje);
}

/** Encabezado de la burbuja en la vista previa: "Marta Fuentes Ospino · acudiente". */
export function etiquetaDestinatario(paciente: Paciente): string {
  const destinatario = destinatarioDe(paciente);
  return destinatario.esAcudiente
    ? `${destinatario.nombre} · acudiente de ${primerNombre(paciente.nombres)}`
    : destinatario.nombre;
}

/** Notificación ya enviada, para el historial de mensajes de la ficha. */
export function resumenNotificacion(notificacion: Notificacion): string {
  const etiquetas: Record<TipoNotificacion, string> = {
    confirmada: 'Confirmación de cita',
    aprobada: 'Solicitud aprobada',
    contrapropuesta: 'Horarios alternativos',
    rechazada: 'Solicitud no aprobada',
    recordatorio: 'Recordatorio de control',
  };
  return etiquetas[notificacion.tipo];
}
