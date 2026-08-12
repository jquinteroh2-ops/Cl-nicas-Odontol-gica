/**
 * Asistente de solicitud de cita.
 *
 * Funciona sin iniciar sesión: un paciente nuevo que va a valoración todavía no
 * tiene cuenta, y obligarlo a registrarse aquí lo pierde. Si hay sesión abierta,
 * el paso de datos se salta y solo se confirman.
 *
 * Un paso por pantalla, que es como se llena un formulario largo en un celular.
 */

import { useEffect, useMemo, useState } from 'react';
import { parseISO, startOfMonth } from 'date-fns';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import type { Cita, FranjaDisponible, SolicitudCita, TipoCita } from '@compartido/tipos';
import { useUsuario } from '@compartido/auth';
import { useDatos } from '@compartido/contexto';
import * as api from '@compartido/mockApi';
import { claveDia } from '@compartido/disponibilidad';
import { formatoDocumentoCompleto, nombreCompleto } from '@compartido/formato';
import Boton from '@componentes/ui/Boton';
import BarraPasos from '@publico/agendar/BarraPasos';
import PasoTipo from '@publico/agendar/PasoTipo';
import PasoFecha from '@publico/agendar/PasoFecha';
import PasoDatos, {
  DATOS_VACIOS,
  validarDatos,
  type DatosFormulario,
  type ErroresFormulario,
} from '@publico/agendar/PasoDatos';
import PasoResumen from '@publico/agendar/PasoResumen';
import PantallaExito from '@publico/agendar/PantallaExito';

const PASOS = ['Qué necesitas', 'Cuándo', 'Quién eres', 'Confirmar'];

export default function Agendar() {
  const navegar = useNavigate();
  const usuario = useUsuario();
  const { estado, revision } = useDatos();

  const paciente = usuario?.pacienteId
    ? (estado.pacientes.find((p) => p.id === usuario.pacienteId) ?? null)
    : null;

  const [paso, setPaso] = useState(1);
  const [tipo, setTipo] = useState<TipoCita>();
  const [motivoConsulta, setMotivoConsulta] = useState('');
  const [mes, setMes] = useState(() => startOfMonth(new Date()));
  const [diaElegido, setDiaElegido] = useState<string>();
  const [horarioElegido, setHorarioElegido] = useState<string>();
  const [datos, setDatos] = useState<DatosFormulario>(DATOS_VACIOS);
  const [errores, setErrores] = useState<ErroresFormulario>({});

  const [diasDisponibles, setDiasDisponibles] = useState<string[]>([]);
  const [franjas, setFranjas] = useState<FranjaDisponible[]>([]);
  const [cargandoDias, setCargandoDias] = useState(false);
  const [cargandoFranjas, setCargandoFranjas] = useState(false);

  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{ solicitud: SolicitudCita; cita?: Cita }>();

  /** Un control se confirma solo si quien lo pide tiene ortodoncia activa. */
  const esInmediato = (candidato: TipoCita) => !api.requiereAprobacion(candidato, paciente?.id);
  const requiereAprobacion = tipo ? !esInmediato(tipo) : true;

  // Días con cupo del mes visible. Se recalcula cuando cambia la revisión del
  // estado compartido: si desde otra pestaña se ocupa el último cupo de un día,
  // ese día se apaga aquí sin recargar.
  useEffect(() => {
    if (!tipo || paso !== 2) return;
    let vigente = true;
    setCargandoDias(true);
    api
      .obtenerDiasDisponibles(mes, tipo, paciente?.id)
      .then((dias) => {
        if (!vigente) return;
        setDiasDisponibles(dias);
        setCargandoDias(false);
      })
      .catch(() => vigente && setCargandoDias(false));
    return () => {
      vigente = false;
    };
  }, [tipo, mes, paso, paciente?.id, revision]);

  // Franjas del día elegido.
  useEffect(() => {
    if (!tipo || !diaElegido || paso !== 2) return;
    let vigente = true;
    setCargandoFranjas(true);
    api
      .obtenerFranjasDisponibles(parseISO(`${diaElegido}T00:00:00`), tipo, paciente?.id)
      .then((libres) => {
        if (!vigente) return;
        setFranjas(libres);
        setCargandoFranjas(false);
        // Si el horario elegido dejó de estar libre, se suelta la selección.
        setHorarioElegido((actual) =>
          actual && libres.some((f) => f.inicio === actual) ? actual : undefined,
        );
      })
      .catch(() => vigente && setCargandoFranjas(false));
    return () => {
      vigente = false;
    };
  }, [tipo, diaElegido, paso, paciente?.id, revision]);

  const pasoValido = useMemo(() => {
    if (paso === 1) return Boolean(tipo);
    if (paso === 2) return Boolean(horarioElegido);
    if (paso === 3) return paciente ? true : Object.keys(validarDatos(datos)).length === 0;
    return true;
  }, [paso, tipo, horarioElegido, paciente, datos]);

  function avanzar() {
    if (paso === 3 && !paciente) {
      const encontrados = validarDatos(datos);
      setErrores(encontrados);
      if (Object.keys(encontrados).length > 0) return;
    }
    setPaso((actual) => Math.min(actual + 1, PASOS.length));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function retroceder() {
    if (paso === 1) {
      navegar('/');
      return;
    }
    setPaso((actual) => actual - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function enviar() {
    if (!tipo || !horarioElegido) return;
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const respuesta = await api.crearSolicitudCita({
        pacienteId: paciente?.id,
        tipo,
        fechaHoraSolicitada: horarioElegido,
        motivoConsulta,
        datosContacto: paciente
          ? undefined
          : {
              nombres: datos.nombres.trim(),
              apellidos: datos.apellidos.trim(),
              telefono: datos.telefono.replace(/\D/g, ''),
              tipoDocumento: datos.tipoDocumento,
              numeroDocumento: datos.numeroDocumento.replace(/\D/g, ''),
              acudiente:
                datos.tipoDocumento === 'TI'
                  ? {
                      nombre: datos.acudienteNombre.trim(),
                      telefono: datos.acudienteTelefono.replace(/\D/g, ''),
                      parentesco: datos.acudienteParentesco,
                    }
                  : undefined,
            },
      });
      setResultado(respuesta);
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    } catch (causa) {
      const mensaje =
        causa instanceof Error ? causa.message : 'No pudimos enviar la solicitud. Intenta de nuevo.';
      setErrorEnvio(mensaje);
      // Si la franja se ocupó mientras tanto, se devuelve al paso de horarios.
      if (causa instanceof api.ErrorApi && causa.codigo === 'franja_ocupada') {
        setHorarioElegido(undefined);
        setPaso(2);
      }
    } finally {
      setEnviando(false);
    }
  }

  /* ------------------------------------------------------------------ éxito -- */

  if (resultado) {
    const telefonoAviso = paciente
      ? (paciente.acudiente?.telefono ?? paciente.telefono)
      : datos.tipoDocumento === 'TI'
        ? datos.acudienteTelefono
        : datos.telefono;

    return (
      <PantallaExito
        solicitud={resultado.solicitud}
        cita={resultado.cita}
        nombreProfesional={
          estado.profesionales.find((p) => p.id === resultado.cita?.profesionalId)?.nombre
        }
        telefonoAviso={telefonoAviso}
        conSesion={Boolean(paciente)}
      />
    );
  }

  /* --------------------------------------------------------------- asistente -- */

  // Con sesión abierta el paso 3 solo confirma datos, pero no se elimina: el
  // paciente debe poder revisar a nombre de quién queda la cita.
  const nombrePaciente = paciente
    ? nombreCompleto(paciente)
    : `${datos.nombres.trim()} ${datos.apellidos.trim()}`.trim();
  const documento = paciente
    ? formatoDocumentoCompleto(paciente.tipoDocumento, paciente.numeroDocumento)
    : formatoDocumentoCompleto(datos.tipoDocumento, datos.numeroDocumento);
  const acudiente = paciente?.acudiente
    ? paciente.acudiente
    : !paciente && datos.tipoDocumento === 'TI'
      ? { nombre: datos.acudienteNombre, telefono: datos.acudienteTelefono }
      : undefined;

  return (
    <div className="mx-auto max-w-2xl px-6 py-8 pb-seguro sm:py-12">
      <BarraPasos pasoActual={paso} pasos={PASOS} />

      <div className="mt-10">
        {paso === 1 && (
          <PasoTipo
            tipoElegido={tipo}
            motivoConsulta={motivoConsulta}
            esInmediato={esInmediato}
            sinSesion={!paciente}
            alElegirTipo={(elegido) => {
              setTipo(elegido);
              // Cambiar de tipo cambia la duración, así que la selección de
              // horario deja de ser válida.
              setDiaElegido(undefined);
              setHorarioElegido(undefined);
            }}
            alCambiarMotivo={setMotivoConsulta}
          />
        )}

        {paso === 2 && tipo && (
          <PasoFecha
            tipo={tipo}
            mes={mes}
            diaElegido={diaElegido}
            horarioElegido={horarioElegido}
            diasDisponibles={diasDisponibles}
            franjas={franjas}
            cargandoDias={cargandoDias}
            cargandoFranjas={cargandoFranjas}
            alCambiarMes={(nuevo) => {
              setMes(nuevo);
              setDiaElegido(undefined);
              setHorarioElegido(undefined);
            }}
            alElegirDia={(clave) => {
              setDiaElegido(clave);
              setHorarioElegido(undefined);
            }}
            alElegirHorario={setHorarioElegido}
          />
        )}

        {paso === 3 && (
          <PasoDatos
            paciente={paciente}
            datos={datos}
            errores={errores}
            alCambiar={(cambio) => {
              setDatos((actual) => ({ ...actual, ...cambio }));
              setErrores((actuales) => {
                const siguiente = { ...actuales };
                for (const clave of Object.keys(cambio)) {
                  delete siguiente[clave as keyof ErroresFormulario];
                }
                return siguiente;
              });
            }}
          />
        )}

        {paso === 4 && tipo && horarioElegido && (
          <PasoResumen
            tipo={tipo}
            fechaHora={horarioElegido}
            motivoConsulta={motivoConsulta}
            requiereAprobacion={requiereAprobacion}
            nombrePaciente={nombrePaciente}
            documento={documento}
            telefonoAviso={acudiente?.telefono ?? (paciente?.telefono || datos.telefono)}
            avisaAlAcudiente={Boolean(acudiente)}
            nombreAcudiente={acudiente?.nombre}
          />
        )}
      </div>

      {errorEnvio && (
        <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3.5 text-sm text-red-800 ring-1 ring-inset ring-red-600/15">
          {errorEnvio}
        </p>
      )}

      {/* Barra de acciones pegada abajo: en celular el pulgar la alcanza sin subir. */}
      <div className="sticky bottom-0 z-10 -mx-6 mt-10 border-t border-slate-200/70 bg-white/90 px-6 pt-4 pb-seguro backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Boton
            variante="secundario"
            tamano="lg"
            alPulsar={retroceder}
            icono={<ArrowLeft className="h-5 w-5" aria-hidden />}
            aria-label={paso === 1 ? 'Volver al inicio' : 'Paso anterior'}
          >
            <span className="hidden sm:inline">{paso === 1 ? 'Salir' : 'Atrás'}</span>
          </Boton>

          {paso < PASOS.length ? (
            <Boton
              tamano="lg"
              anchoCompleto
              deshabilitado={!pasoValido}
              alPulsar={avanzar}
              iconoDerecha={<ArrowRight className="h-5 w-5" aria-hidden />}
            >
              Continuar
            </Boton>
          ) : (
            <Boton
              tamano="lg"
              anchoCompleto
              cargando={enviando}
              alPulsar={enviar}
              icono={<Send className="h-5 w-5" aria-hidden />}
            >
              {enviando
                ? 'Enviando…'
                : requiereAprobacion
                  ? 'Enviar solicitud'
                  : 'Confirmar mi cita'}
            </Boton>
          )}
        </div>

        {paso === 2 && !horarioElegido && (
          <p className="mt-3 text-center text-xs text-slate-500">
            {diaElegido ? 'Elige una hora para continuar.' : 'Elige un día para ver los horarios.'}
          </p>
        )}
      </div>
    </div>
  );
}
