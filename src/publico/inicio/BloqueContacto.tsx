/**
 * Contacto: formulario, datos y horario.
 *
 * El formulario no manda correos —no hay servidor detrás— sino que arma el
 * mensaje y abre WhatsApp con él escrito. Es lo que de verdad usa la clínica, y
 * de paso quien escribe se queda con la conversación en su propio celular.
 */

import { useState, type FormEvent } from 'react';
import { Clock, MapPin, MessageCircle, Navigation, Phone, Send } from 'lucide-react';
import {
  CLINICA,
  DIRECCION_COMPLETA,
  HORARIO_PUBLICO,
  enlaceWhatsApp,
} from '@compartido/clinica';
import { estaAtendiendoAhora } from '@compartido/disponibilidad';
import { formatoTelefono } from '@compartido/formato';
import Boton from '@componentes/ui/Boton';
import CampoTexto from '@componentes/ui/CampoTexto';
import Insignia from '@componentes/ui/Insignia';
import Revelar from '@publico/animacion/Revelar';
import EncabezadoSeccion from '@publico/inicio/EncabezadoSeccion';

const ENLACE_MAPA = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  `${DIRECCION_COMPLETA}, Colombia`,
)}`;

const DATOS = [
  {
    icono: MapPin,
    titulo: 'Dirección',
    lineas: [CLINICA.direccion, CLINICA.ciudad],
  },
  {
    icono: Clock,
    titulo: 'Horario',
    lineas: HORARIO_PUBLICO.map((franja) => `${franja.dias}: ${franja.horario}`),
  },
  {
    icono: Phone,
    titulo: 'WhatsApp',
    lineas: [formatoTelefono(CLINICA.whatsapp)],
  },
  {
    icono: Navigation,
    titulo: 'Cómo llegar',
    lineas: [`${CLINICA.referencia}.`],
  },
];

export default function BloqueContacto() {
  const atendiendo = estaAtendiendoAhora();
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [intentado, setIntentado] = useState(false);

  const faltaNombre = intentado && nombre.trim().length < 3;
  const faltaMensaje = intentado && mensaje.trim().length < 5;

  function enviar(evento: FormEvent) {
    evento.preventDefault();
    setIntentado(true);

    if (nombre.trim().length < 3 || mensaje.trim().length < 5) return;

    const texto = [
      `Hola, soy ${nombre.trim()}.`,
      mensaje.trim(),
      telefono.trim() ? `Mi teléfono es ${telefono.trim()}.` : '',
      `(Escribo desde la página de ${CLINICA.nombre}.)`,
    ]
      .filter(Boolean)
      .join('\n');

    window.open(enlaceWhatsApp(texto), '_blank', 'noopener,noreferrer');
  }

  return (
    <section id="contacto" className="bg-slate-50 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-6">
        <EncabezadoSeccion
          rotulo="Contacto"
          titulo="Hablemos"
          descripcion="Escríbenos y te respondemos por WhatsApp, normalmente el mismo día."
        />

        <div className="mt-14 grid gap-6 lg:grid-cols-[1.1fr_1fr] lg:gap-8">
          <Revelar desde="izquierda">
            <form
              onSubmit={enviar}
              noValidate
              className="rounded-3xl bg-white p-6 shadow-suave ring-1 ring-slate-200/70 sm:p-8"
            >
              <p className="text-lg font-semibold tracking-tight text-slate-900">
                Cuéntanos qué necesitas
              </p>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">
                Al enviar se abre WhatsApp con tu mensaje ya escrito. Nada se guarda en esta página.
              </p>

              <div className="mt-6 space-y-5">
                <CampoTexto
                  etiqueta="Nombre completo"
                  obligatorio
                  value={nombre}
                  onChange={(evento) => setNombre(evento.target.value)}
                  placeholder="Camila Pérez"
                  autoComplete="name"
                  error={faltaNombre ? 'Escribe tu nombre para saber con quién hablamos.' : null}
                />

                <CampoTexto
                  etiqueta="Teléfono"
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={(evento) => setTelefono(evento.target.value)}
                  placeholder="300 000 0000"
                  autoComplete="tel"
                  ayuda="Opcional. Solo si prefieres que te llamemos."
                />

                <div>
                  <label
                    htmlFor="mensaje-contacto"
                    className="block text-sm font-medium text-slate-700"
                  >
                    Mensaje
                    <span className="ml-1 text-red-600" aria-hidden>
                      *
                    </span>
                  </label>
                  <textarea
                    id="mensaje-contacto"
                    rows={4}
                    value={mensaje}
                    onChange={(evento) => setMensaje(evento.target.value)}
                    placeholder="Quiero una valoración para brackets…"
                    aria-invalid={faltaMensaje || undefined}
                    aria-describedby={faltaMensaje ? 'error-mensaje' : undefined}
                    className={`mt-2 block w-full resize-y rounded-2xl border-0 px-4 py-3.5 text-base text-slate-900 ring-1 ring-inset transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset ${
                      faltaMensaje
                        ? 'bg-red-50/50 ring-red-300 focus:ring-red-500'
                        : 'bg-slate-50 ring-slate-200 focus:ring-petroleo-600'
                    }`}
                  />
                  {faltaMensaje && (
                    <p id="error-mensaje" className="mt-2 text-sm text-red-700">
                      Cuéntanos brevemente qué necesitas.
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Boton
                  tipo="submit"
                  tamano="lg"
                  anchoCompleto
                  icono={<Send className="h-4.5 w-4.5" aria-hidden />}
                >
                  Enviar por WhatsApp
                </Boton>
                <Boton a="/agendar" variante="secundario" tamano="lg" anchoCompleto>
                  Prefiero agendar en línea
                </Boton>
              </div>
            </form>
          </Revelar>

          <div>
            <ul className="grid gap-4 sm:grid-cols-2">
              {DATOS.map((dato, indice) => (
                <Revelar as="li" key={dato.titulo} desde="derecha" retardo={indice * 100}>
                  <div className="group h-full rounded-3xl bg-white p-5 shadow-suave ring-1 ring-slate-200/70 transition-all duration-300 ease-suave hover:-translate-y-1 hover:shadow-media">
                    <span className="grid h-11 w-11 place-items-center rounded-2xl bg-petroleo-50 text-petroleo-700 transition-colors duration-300 group-hover:bg-petroleo-600 group-hover:text-white">
                      <dato.icono className="h-5 w-5" aria-hidden strokeWidth={1.5} />
                    </span>
                    <p className="mt-4 text-xs font-semibold tracking-[0.14em] text-slate-400 uppercase">
                      {dato.titulo}
                    </p>
                    <div className="mt-2 space-y-0.5">
                      {dato.lineas.map((linea) => (
                        <p key={linea} className="text-sm leading-relaxed text-slate-700">
                          {linea}
                        </p>
                      ))}
                    </div>
                  </div>
                </Revelar>
              ))}
            </ul>

            <Revelar desde="derecha" retardo={400} className="mt-4">
              <div className="rounded-3xl bg-white p-6 shadow-suave ring-1 ring-slate-200/70">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="font-semibold tracking-tight text-slate-900">¿Estamos abiertos?</p>
                  <Insignia tono={atendiendo ? 'verde' : 'neutro'}>
                    {atendiendo ? 'Abierto ahora' : 'Cerrado ahora'}
                  </Insignia>
                </div>

                <div className="mt-5 flex flex-col gap-2.5 sm:flex-row">
                  <Boton enlaceExterno={ENLACE_MAPA} variante="secundario" anchoCompleto>
                    Ver en el mapa
                  </Boton>
                  <Boton
                    enlaceExterno={enlaceWhatsApp()}
                    variante="fantasma"
                    anchoCompleto
                    icono={<MessageCircle className="h-4 w-4" aria-hidden />}
                  >
                    {formatoTelefono(CLINICA.whatsapp)}
                  </Boton>
                </div>
              </div>
            </Revelar>
          </div>
        </div>
      </div>
    </section>
  );
}
