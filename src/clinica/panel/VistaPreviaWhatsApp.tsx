/**
 * Vista previa del WhatsApp que sale hacia el paciente.
 *
 * Es la pieza que más convence en la reunión: la clínica no solo resuelve la
 * solicitud, sino que ve el mensaje exacto —ya redactado, con el tono de la
 * casa— y lo abre en su propio WhatsApp con un toque. El mensaje no se compone
 * aquí; llega ya redactado y registrado por mockApi.
 */

import { ExternalLink, Check } from 'lucide-react';
import type { Notificacion, Paciente } from '@compartido/tipos';
import { enlaceWhatsAppNumero, etiquetaDestinatario, resumenNotificacion } from '@compartido/mensajeria';
import { formatoHora, formatoTelefono } from '@compartido/formato';
import Boton from '@componentes/ui/Boton';

interface Props {
  notificacion: Notificacion;
  /** Da nombre al destinatario. Sin él se muestra solo el número. */
  paciente?: Paciente;
}

export default function VistaPreviaWhatsApp({ notificacion, paciente }: Props) {
  const destinatario = paciente
    ? etiquetaDestinatario(paciente)
    : formatoTelefono(notificacion.destinatario);

  return (
    <div className="rounded-3xl bg-slate-50 p-5 ring-1 ring-slate-200/70">
      <div className="flex items-baseline justify-between gap-3">
        <p className="rotulo">{resumenNotificacion(notificacion)}</p>
        <span className="shrink-0 text-xs text-slate-400">
          {formatoHora(notificacion.enviadaEn)}
        </span>
      </div>

      <p className="mt-2 truncate text-sm font-medium text-slate-700">Para {destinatario}</p>

      {/*
        Burbuja verde alineada a la derecha, como la del mensaje propio en
        WhatsApp: se reconoce al instante sin necesidad de explicarla.
      */}
      <div className="mt-4 flex justify-end">
        <div className="relative max-w-[92%] rounded-3xl rounded-br-lg bg-[#d9fdd3] px-4 py-3 shadow-suave">
          <p className="whitespace-pre-line text-sm leading-relaxed text-slate-800">
            {notificacion.mensaje}
          </p>
          <span className="mt-1 flex items-center justify-end gap-1 text-[11px] text-slate-500">
            {formatoHora(notificacion.enviadaEn)}
            <Check className="h-3 w-3 text-sky-600" aria-hidden />
          </span>
        </div>
      </div>

      <Boton
        variante="secundario"
        anchoCompleto
        className="mt-5"
        enlaceExterno={enlaceWhatsAppNumero(notificacion.destinatario, notificacion.mensaje)}
        iconoDerecha={<ExternalLink className="h-4 w-4" aria-hidden />}
      >
        Abrir en WhatsApp
      </Boton>
    </div>
  );
}
