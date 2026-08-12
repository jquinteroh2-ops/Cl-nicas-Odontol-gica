/**
 * Agendar una cita desde el mostrador.
 *
 * El caso real: alguien escribe por WhatsApp o llama, y quien atiende lo mete
 * en la agenda en el momento. Por eso no hay nada que aprobar y la cita nace
 * confirmada — a diferencia del portal, aquí la decisión ya la tomó la clínica.
 *
 * Tres pasos y en este orden: primero de quién es la cita, porque de eso
 * depende qué horarios se ofrecen (el sistema respeta al profesional que ya
 * lleva el caso), y después cuándo. Al final sale el WhatsApp de confirmación
 * listo para enviar, que es lo que cierra la llamada.
 */

import { useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, Search, UserPlus, Users } from 'lucide-react';
import type { DatosContacto, Paciente, TipoCita, TipoDocumento } from '@compartido/tipos';
import { useAccion, useConsulta } from '@compartido/contexto';
import { DURACION_POR_TIPO } from '@compartido/disponibilidad';
import {
  ETIQUETA_TIPO_CITA,
  NOMBRE_TIPO_DOCUMENTO,
  formatoDocumentoCompleto,
  formatoDuracion,
  formatoTelefono,
  nombreCompleto,
} from '@compartido/formato';
import * as api from '@compartido/mockApi';
import Boton from '@componentes/ui/Boton';
import CampoTexto from '@componentes/ui/CampoTexto';
import Esqueleto from '@componentes/ui/Esqueleto';
import Hoja from '@componentes/ui/Hoja';
import Insignia from '@componentes/ui/Insignia';
import Selector from '@componentes/ui/Selector';
import SelectorHorarios from '@clinica/panel/SelectorHorarios';
import VistaPreviaWhatsApp from '@clinica/panel/VistaPreviaWhatsApp';

type Paso = 'paciente' | 'cuando' | 'listo';

const TIPOS: TipoCita[] = ['control', 'valoracion', 'procedimiento', 'urgencia'];

const CONTACTO_VACIO: DatosContacto = {
  nombres: '',
  apellidos: '',
  telefono: '',
  tipoDocumento: 'CC',
  numeroDocumento: '',
};

interface Props {
  alCerrar: () => void;
}

export default function NuevaCita({ alCerrar }: Props) {
  const [paso, setPaso] = useState<Paso>('paciente');
  const [elegido, setElegido] = useState<Paciente | null>(null);
  const [esNuevo, setEsNuevo] = useState(false);
  const [contacto, setContacto] = useState<DatosContacto>(CONTACTO_VACIO);
  const [busqueda, setBusqueda] = useState('');
  const [tipo, setTipo] = useState<TipoCita>('control');
  const [horarios, setHorarios] = useState<string[]>([]);
  const [motivo, setMotivo] = useState('');

  const crear = useAccion(api.crearCitaDirecta);
  const [resultado, setResultado] = useState<Awaited<ReturnType<typeof api.crearCitaDirecta>> | null>(
    null,
  );

  /*
   * Se traen todos los pacientes una vez y se filtra en memoria. Consultar en
   * cada tecla dispararía una promesa con retardo artificial por pulsación y el
   * buscador daría tirones.
   */
  const consulta = useConsulta(() => api.buscarPacientes(''), []);

  const encontrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();
    const todos = consulta.datos ?? [];
    if (!texto) return todos.slice(0, 6);
    return todos
      .filter(
        (p) =>
          nombreCompleto(p).toLowerCase().includes(texto) ||
          p.numeroDocumento.includes(texto) ||
          p.telefono.includes(texto),
      )
      .slice(0, 8);
  }, [busqueda, consulta.datos]);

  const menorDeEdad = contacto.tipoDocumento === 'TI';
  const acudienteCompleto =
    !menorDeEdad ||
    Boolean(contacto.acudiente?.nombre.trim() && contacto.acudiente?.telefono.trim());

  const contactoValido =
    contacto.nombres.trim().length > 1 &&
    contacto.apellidos.trim().length > 1 &&
    contacto.numeroDocumento.trim().length > 4 &&
    contacto.telefono.replace(/\D/g, '').length >= 10 &&
    acudienteCompleto;

  const pacienteListo = esNuevo ? contactoValido : Boolean(elegido);

  function cambiarContacto(cambios: Partial<DatosContacto>) {
    setContacto((previo) => ({ ...previo, ...cambios }));
  }

  async function agendar() {
    const salida = await crear.ejecutar({
      pacienteId: elegido?.id,
      datosContacto: esNuevo ? contacto : undefined,
      tipo,
      fechaHora: horarios[0],
      motivoConsulta: motivo,
    });
    if (salida) {
      setResultado(salida);
      setPaso('listo');
    }
  }

  const titulos: Record<Paso, string> = {
    paciente: 'Nueva cita',
    cuando: 'Fecha y hora',
    listo: 'Cita agendada',
  };

  const nombreActual = elegido
    ? nombreCompleto(elegido)
    : contacto.nombres
      ? `${contacto.nombres} ${contacto.apellidos}`.trim()
      : undefined;

  return (
    <Hoja
      titulo={titulos[paso]}
      descripcion={paso === 'cuando' ? nombreActual : undefined}
      alCerrar={alCerrar}
      pie={pieDeHoja()}
    >
      {crear.error && (
        <p className="mb-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-800 ring-1 ring-red-600/15">
          {crear.error}
        </p>
      )}

      {paso === 'paciente' && (
        <div>
          {/* Dos caminos, y el de paciente existente primero: es el frecuente. */}
          <div className="flex gap-2">
            <BotonModo activo={!esNuevo} alPulsar={() => setEsNuevo(false)} icono={<Users className="h-4 w-4" aria-hidden />}>
              Ya es paciente
            </BotonModo>
            <BotonModo activo={esNuevo} alPulsar={() => setEsNuevo(true)} icono={<UserPlus className="h-4 w-4" aria-hidden />}>
              Es nuevo
            </BotonModo>
          </div>

          {!esNuevo ? (
            <div className="mt-5">
              <div className="relative">
                <Search
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  aria-hidden
                />
                <input
                  type="search"
                  value={busqueda}
                  onChange={(evento) => setBusqueda(evento.target.value)}
                  placeholder="Nombre, documento o teléfono"
                  aria-label="Buscar paciente"
                  className="block h-13 w-full rounded-2xl border-0 bg-slate-50 pl-11 pr-4 text-base text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-petroleo-600"
                />
              </div>

              {consulta.cargando ? (
                <div className="mt-4 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <Esqueleto key={i} className="h-16 w-full rounded-2xl" />
                  ))}
                </div>
              ) : encontrados.length === 0 ? (
                <p className="mt-6 text-center text-sm text-slate-500">
                  Nadie coincide con “{busqueda}”. Si es la primera vez que viene, márcalo como
                  nuevo.
                </p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {encontrados.map((paciente) => {
                    const activo = elegido?.id === paciente.id;
                    return (
                      <li key={paciente.id}>
                        <button
                          type="button"
                          onClick={() => setElegido(activo ? null : paciente)}
                          aria-pressed={activo}
                          className={`w-full rounded-2xl px-4 py-3 text-left transition-all ${
                            activo
                              ? 'bg-petroleo-50 ring-1 ring-petroleo-300'
                              : 'bg-slate-50 ring-1 ring-slate-200/70 hover:bg-slate-100'
                          }`}
                        >
                          <span className="block truncate font-medium text-slate-900">
                            {nombreCompleto(paciente)}
                          </span>
                          <span className="block truncate text-sm text-slate-500">
                            {formatoDocumentoCompleto(paciente.tipoDocumento, paciente.numeroDocumento)}
                            {' · '}
                            {formatoTelefono(paciente.telefono)}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          ) : (
            <div className="mt-5 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <CampoTexto
                  etiqueta="Nombres"
                  obligatorio
                  autoComplete="given-name"
                  value={contacto.nombres}
                  onChange={(e) => cambiarContacto({ nombres: e.target.value })}
                />
                <CampoTexto
                  etiqueta="Apellidos"
                  obligatorio
                  autoComplete="family-name"
                  value={contacto.apellidos}
                  onChange={(e) => cambiarContacto({ apellidos: e.target.value })}
                />
              </div>

              <Selector
                etiqueta="Tipo de documento"
                value={contacto.tipoDocumento}
                onChange={(e) =>
                  cambiarContacto({
                    tipoDocumento: e.target.value as TipoDocumento,
                    // Al dejar de ser menor, el acudiente sobra y no debe viajar.
                    acudiente:
                      e.target.value === 'TI'
                        ? (contacto.acudiente ?? { nombre: '', telefono: '', parentesco: 'Madre' })
                        : undefined,
                  })
                }
                opciones={(['CC', 'TI', 'CE'] as TipoDocumento[]).map((t) => ({
                  valor: t,
                  etiqueta: `${t} · ${NOMBRE_TIPO_DOCUMENTO[t]}`,
                }))}
              />

              <CampoTexto
                etiqueta="Número de documento"
                obligatorio
                inputMode="numeric"
                value={contacto.numeroDocumento}
                onChange={(e) => cambiarContacto({ numeroDocumento: e.target.value.replace(/\D/g, '') })}
              />

              <CampoTexto
                etiqueta="Teléfono de WhatsApp"
                obligatorio
                inputMode="tel"
                ayuda="A este número llega la confirmación."
                value={contacto.telefono}
                onChange={(e) => cambiarContacto({ telefono: e.target.value })}
              />

              {/* Si es menor, todo mensaje va al acudiente: lo exige mensajeria.ts. */}
              {menorDeEdad && (
                <div className="rounded-2xl bg-amber-50/60 p-4 ring-1 ring-amber-600/15">
                  <p className="text-sm font-medium text-amber-900">
                    Es menor de edad: los mensajes van al acudiente.
                  </p>
                  <div className="mt-4 space-y-4">
                    <CampoTexto
                      etiqueta="Nombre del acudiente"
                      obligatorio
                      value={contacto.acudiente?.nombre ?? ''}
                      onChange={(e) =>
                        cambiarContacto({
                          acudiente: {
                            parentesco: contacto.acudiente?.parentesco ?? 'Madre',
                            telefono: contacto.acudiente?.telefono ?? '',
                            nombre: e.target.value,
                          },
                        })
                      }
                    />
                    <CampoTexto
                      etiqueta="Teléfono del acudiente"
                      obligatorio
                      inputMode="tel"
                      value={contacto.acudiente?.telefono ?? ''}
                      onChange={(e) =>
                        cambiarContacto({
                          acudiente: {
                            parentesco: contacto.acudiente?.parentesco ?? 'Madre',
                            nombre: contacto.acudiente?.nombre ?? '',
                            telefono: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {paso === 'cuando' && (
        <div className="space-y-6">
          <div>
            <p className="rotulo">Tipo de cita</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {TIPOS.map((valor) => {
                const activo = tipo === valor;
                return (
                  <button
                    key={valor}
                    type="button"
                    onClick={() => {
                      setTipo(valor);
                      // La duración cambia y con ella las franjas que caben.
                      setHorarios([]);
                    }}
                    aria-pressed={activo}
                    className={`min-h-16 rounded-2xl px-3 py-2.5 text-left transition-all ${
                      activo
                        ? 'bg-petroleo-600 text-white shadow-suave'
                        : 'bg-slate-50 text-slate-700 ring-1 ring-slate-200/70 hover:bg-slate-100'
                    }`}
                  >
                    <span className="block text-sm font-medium leading-tight">
                      {ETIQUETA_TIPO_CITA[valor]}
                    </span>
                    <span className={`block text-xs ${activo ? 'text-white/70' : 'text-slate-500'}`}>
                      {formatoDuracion(DURACION_POR_TIPO[valor])}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <p className="rotulo mb-3">Cuándo</p>
            <SelectorHorarios
              tipo={tipo}
              pacienteId={elegido?.id}
              seleccion={horarios}
              alCambiar={setHorarios}
              maximo={1}
            />
          </div>

          <div>
            <label htmlFor="motivo-cita" className="block text-sm font-medium text-slate-700">
              Motivo (opcional)
            </label>
            <textarea
              id="motivo-cita"
              rows={2}
              value={motivo}
              onChange={(evento) => setMotivo(evento.target.value)}
              maxLength={160}
              placeholder="Se le cayó un bracket"
              className="mt-2 block w-full resize-none rounded-2xl border-0 bg-slate-50 px-4 py-3 text-base text-slate-900 ring-1 ring-inset ring-slate-200 transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-petroleo-600"
            />
          </div>
        </div>
      )}

      {paso === 'listo' && resultado && (
        <div>
          <div className="mb-5 flex flex-wrap items-center gap-2">
            <Insignia tono="verde">Confirmada</Insignia>
            {esNuevo && <Insignia tono="petroleo">Paciente registrado</Insignia>}
          </div>
          <VistaPreviaWhatsApp
            notificacion={resultado.notificacion}
            paciente={resultado.paciente}
          />
        </div>
      )}
    </Hoja>
  );

  function pieDeHoja() {
    if (paso === 'paciente') {
      return (
        <Boton
          anchoCompleto
          tamano="lg"
          deshabilitado={!pacienteListo}
          alPulsar={() => setPaso('cuando')}
        >
          Continuar
        </Boton>
      );
    }

    if (paso === 'cuando') {
      return (
        <div className="flex gap-2.5">
          <Boton
            variante="secundario"
            alPulsar={() => setPaso('paciente')}
            deshabilitado={crear.enCurso}
            aria-label="Volver"
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </Boton>
          <Boton
            anchoCompleto
            cargando={crear.enCurso}
            deshabilitado={horarios.length !== 1 || crear.enCurso}
            alPulsar={agendar}
          >
            Agendar cita
          </Boton>
        </div>
      );
    }

    return (
      <Boton anchoCompleto tamano="lg" alPulsar={alCerrar}>
        Listo
      </Boton>
    );
  }
}

/** Pastilla de los dos caminos: paciente existente o nuevo. */
function BotonModo({
  activo,
  alPulsar,
  icono,
  children,
}: {
  activo: boolean;
  alPulsar: () => void;
  icono: ReactNode;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={alPulsar}
      aria-pressed={activo}
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-all ${
        activo
          ? 'bg-petroleo-600 text-white shadow-suave'
          : 'bg-slate-50 text-slate-600 ring-1 ring-slate-200/70 hover:bg-slate-100'
      }`}
    >
      {icono}
      {children}
    </button>
  );
}
