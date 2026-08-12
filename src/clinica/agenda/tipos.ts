/**
 * Una cita ya resuelta contra el resto del estado.
 *
 * La API devuelve `Cita` con identificadores sueltos; la agenda necesita el
 * nombre del paciente y el color del profesional en cada celda. Se cruza una
 * sola vez en la página y las vistas reciben esto ya armado.
 */

import type { Cita, Paciente, Profesional } from '@compartido/tipos';

export interface CitaConContexto {
  cita: Cita;
  paciente?: Paciente;
  profesional?: Profesional;
}

/** Franja horaria que dibuja la rejilla. La clínica abre a las 8 y cierra a las 18. */
export const HORA_APERTURA = 8;
export const HORA_CIERRE = 18;

/** Alto de una hora en la rejilla, en píxeles. */
export const ALTO_HORA = 72;

/** Desplazamiento vertical de una cita dentro de la rejilla. */
export function posicionDe(fechaHora: Date, duracionMinutos: number) {
  const minutosDesdeApertura = (fechaHora.getHours() - HORA_APERTURA) * 60 + fechaHora.getMinutes();
  return {
    top: (minutosDesdeApertura / 60) * ALTO_HORA,
    // Mínimo 26 px: una cita de 15 minutos sería una raya ilegible.
    alto: Math.max(26, (duracionMinutos / 60) * ALTO_HORA - 3),
  };
}

export interface CitaColocada {
  entrada: CitaConContexto;
  /** Columna que ocupa dentro de su grupo de citas solapadas. */
  columna: number;
  /** Cuántas columnas tiene el grupo. Con 1, la cita ocupa todo el ancho del día. */
  columnas: number;
}

/**
 * Reparte en columnas las citas que se pisan.
 *
 * Dos odontólogas atendiendo a la misma hora es lo normal aquí, y si las dos
 * citas se dibujan a todo el ancho del día quedan una encima de otra y no se
 * lee ninguna. Se agrupan las que se solapan en cadena y cada grupo se divide
 * en tantas columnas como haga falta; una cita sola sigue ocupando todo.
 */
export function repartirEnColumnas(citas: CitaConContexto[]): CitaColocada[] {
  const ordenadas = [...citas].sort(
    (a, b) => new Date(a.cita.fechaHora).getTime() - new Date(b.cita.fechaHora).getTime(),
  );

  const resultado: CitaColocada[] = [];
  let grupo: CitaColocada[] = [];
  /** Fin de la última cita de cada columna del grupo en curso. */
  let finPorColumna: number[] = [];
  let finDelGrupo = 0;

  function cerrarGrupo() {
    for (const colocada of grupo) colocada.columnas = finPorColumna.length;
    resultado.push(...grupo);
    grupo = [];
    finPorColumna = [];
    finDelGrupo = 0;
  }

  for (const entrada of ordenadas) {
    const inicio = new Date(entrada.cita.fechaHora).getTime();
    const fin = inicio + entrada.cita.duracionMinutos * 60_000;

    // Empieza después de todo el grupo anterior: ese grupo ya está completo.
    if (grupo.length > 0 && inicio >= finDelGrupo) cerrarGrupo();

    // Se reaprovecha la primera columna que ya haya quedado libre.
    let columna = finPorColumna.findIndex((finColumna) => finColumna <= inicio);
    if (columna === -1) {
      columna = finPorColumna.length;
      finPorColumna.push(fin);
    } else {
      finPorColumna[columna] = fin;
    }

    grupo.push({ entrada, columna, columnas: 1 });
    finDelGrupo = Math.max(finDelGrupo, fin);
  }

  if (grupo.length > 0) cerrarGrupo();
  return resultado;
}
