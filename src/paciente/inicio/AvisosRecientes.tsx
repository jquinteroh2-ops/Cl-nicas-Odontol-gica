/**
 * Mensajes que la clínica ya envió por WhatsApp.
 *
 * Se dibujan como burbujas de conversación porque eso es literalmente lo que le
 * llegó al celular: el portal no inventa un canal nuevo, solo deja constancia de
 * lo que se le escribió. En la demostración es donde aparece, sin recargar, el
 * mensaje que la secretaria acaba de generar desde el panel.
 */

import { MessageCircle } from 'lucide-react';
import type { Notificacion } from '@compartido/tipos';
import { formatoDiaRelativo, formatoHora, formatoTelefono } from '@compartido/formato';
import { resumenNotificacion } from '@compartido/mensajeria';
import Tarjeta from '@componentes/ui/Tarjeta';

const VISIBLES = 3;

interface Props {
  notificaciones: Notificacion[];
  /** El número real al que se escribe: el del acudiente cuando es menor de edad. */
  destinatario?: string;
}

export default function AvisosRecientes({ notificaciones, destinatario }: Props) {
  if (notificaciones.length === 0) return null;

  return (
    <section>
      <h2 className="flex items-center gap-2.5 px-1 text-xl font-semibold tracking-tight text-slate-900">
        <MessageCircle className="h-5 w-5 text-slate-400" aria-hidden strokeWidth={1.5} />
        Mensajes de la clínica
      </h2>

      <Tarjeta className="mt-4 p-5">
        <ul className="space-y-5">
          {notificaciones.slice(0, VISIBLES).map((notificacion) => (
            <li key={notificacion.id} className="animar-entrada">
              <div className="rounded-3xl rounded-tl-lg bg-emerald-50/70 px-5 py-4 ring-1 ring-inset ring-emerald-600/10">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700/80">
                  {resumenNotificacion(notificacion)}
                </p>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {notificacion.mensaje}
                </p>
              </div>
              <p className="mt-1.5 px-2 text-xs text-slate-400">
                Enviado {formatoDiaRelativo(notificacion.enviadaEn)} a las{' '}
                {formatoHora(notificacion.enviadaEn)}
              </p>
            </li>
          ))}
        </ul>

        {destinatario && (
          <p className="mt-5 border-t border-slate-100/80 pt-4 text-xs text-slate-400">
            Escribimos siempre al {formatoTelefono(destinatario)}.
          </p>
        )}
      </Tarjeta>
    </section>
  );
}
