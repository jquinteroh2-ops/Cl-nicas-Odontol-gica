/**
 * Una animación hecha con CSS ya queda desactivada por la regla global de
 * `index.css`. Las que se calculan en JavaScript —el contador que sube, el texto
 * que se escribe solo— tienen que preguntar por su cuenta.
 */
export function prefiereMenosMovimiento(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}
