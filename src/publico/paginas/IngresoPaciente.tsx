/**
 * Ingreso de pacientes.
 *
 * Documento + código de 4 dígitos. Sin correo y sin contraseña: los pacientes de
 * esta clínica no usan correo, y una contraseña más que recordar es una barrera
 * que no aporta nada en una clínica de barrio.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { KeyRound, LogIn, Stethoscope } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import type { TipoDocumento } from '@compartido/tipos';
import { useUsuario } from '@compartido/auth';
import { useDatos } from '@compartido/contexto';
import * as api from '@compartido/mockApi';
import { NOMBRE_TIPO_DOCUMENTO, formatoDocumento, nombreCompleto } from '@compartido/formato';
import { rutaInicio } from '@compartido/permisos';
import { useAvisoDeRuta } from '@componentes/RutaProtegida';
import Boton from '@componentes/ui/Boton';
import CampoTexto from '@componentes/ui/CampoTexto';
import Selector from '@componentes/ui/Selector';

export default function IngresoPaciente() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const usuario = useUsuario();
  const { estado } = useDatos();
  const aviso = useAvisoDeRuta();

  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumento>('CC');
  const [numeroDocumento, setNumeroDocumento] = useState('');
  const [codigoAcceso, setCodigoAcceso] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Si ya hay sesión en esta pestaña, no tiene sentido quedarse en el formulario.
  useEffect(() => {
    if (usuario) navegar(rutaInicio(usuario), { replace: true });
  }, [usuario, navegar]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const autenticado = await api.iniciarSesionPaciente({
        tipoDocumento,
        numeroDocumento,
        codigoAcceso,
      });
      const destino = (ubicacion.state as { desde?: string } | null)?.desde;
      navegar(destino?.startsWith('/portal') ? destino : rutaInicio(autenticado), { replace: true });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos verificar tus datos.');
    } finally {
      setEnviando(false);
    }
  }

  // Los dos pacientes de prueba, para poder entrar en la reunión sin memorizar.
  const demostracion = estado.pacientes
    .filter((p) => p.codigoAcceso === '1234' || p.codigoAcceso === '5678')
    .slice(0, 2);

  return (
    <div className="mx-auto max-w-md px-6 py-12 pb-seguro sm:py-20">
      {aviso && (
        <p className="mb-8 rounded-2xl bg-amber-50 px-4 py-3.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          {aviso}
        </p>
      )}

      <span className="grid h-14 w-14 place-items-center rounded-3xl bg-petroleo-50 text-petroleo-700 ring-1 ring-petroleo-200/60">
        <KeyRound className="h-6 w-6" aria-hidden strokeWidth={1.5} />
      </span>

      <h1 className="mt-7 text-3xl font-semibold tracking-tight text-slate-900">
        Entra a tu portal
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-600">
        Consulta tu tratamiento, tus citas y tu estado de cuenta.
      </p>

      <form onSubmit={enviar} className="mt-10 space-y-5">
        <Selector
          etiqueta="Tipo de documento"
          value={tipoDocumento}
          onChange={(evento) => setTipoDocumento(evento.target.value as TipoDocumento)}
          opciones={(['CC', 'TI', 'CE'] as TipoDocumento[]).map((tipo) => ({
            valor: tipo,
            etiqueta: `${tipo} · ${NOMBRE_TIPO_DOCUMENTO[tipo]}`,
          }))}
        />

        <CampoTexto
          etiqueta="Número de documento"
          inputMode="numeric"
          autoComplete="username"
          value={numeroDocumento}
          onChange={(evento) => setNumeroDocumento(evento.target.value)}
        />

        <CampoTexto
          etiqueta="Código de acceso"
          inputMode="numeric"
          maxLength={4}
          placeholder="••••"
          ayuda="Son los 4 dígitos que te dimos en la clínica."
          value={codigoAcceso}
          onChange={(evento) => setCodigoAcceso(evento.target.value.replace(/\D/g, ''))}
        />

        {error && (
          <p className="rounded-2xl bg-red-50 px-4 py-3.5 text-sm text-red-800 ring-1 ring-inset ring-red-600/15">
            {error}
          </p>
        )}

        <Boton
          tipo="submit"
          tamano="lg"
          anchoCompleto
          cargando={enviando}
          deshabilitado={!numeroDocumento || codigoAcceso.length !== 4}
          icono={<LogIn className="h-5 w-5" aria-hidden />}
        >
          {enviando ? 'Verificando…' : 'Entrar'}
        </Boton>
      </form>

      {/* Recuadro de credenciales: sin esto no se puede hacer la demostración. */}
      <div className="mt-10 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200/70">
        <p className="rotulo">Credenciales de prueba</p>
        <ul className="mt-4 space-y-4">
          {demostracion.map((paciente) => (
            <li key={paciente.id} className="text-sm">
              <p className="font-medium text-slate-800">{nombreCompleto(paciente)}</p>
              <p className="mt-0.5 font-mono text-xs text-slate-600">
                {paciente.tipoDocumento} {formatoDocumento(paciente.numeroDocumento)} · código{' '}
                {paciente.codigoAcceso}
              </p>
              <button
                type="button"
                onClick={() => {
                  setTipoDocumento(paciente.tipoDocumento);
                  setNumeroDocumento(paciente.numeroDocumento);
                  setCodigoAcceso(paciente.codigoAcceso);
                  setError(null);
                }}
                className="text-xs font-medium text-petroleo-700 underline underline-offset-4"
              >
                Usar estos datos
              </button>
            </li>
          ))}
        </ul>
      </div>

      <p className="mt-10 text-center text-sm text-slate-500">
        ¿Todavía no eres paciente?{' '}
        <Link to="/agendar" className="font-medium text-petroleo-700 underline underline-offset-4">
          Pide tu valoración
        </Link>
      </p>

      {/*
        Era un enlace gris de 13 px y se perdía. Como botón separado por un
        filete, quien trabaja en la clínica lo encuentra sin leer el formulario
        de pacientes entero.
      */}
      <div className="mt-10 border-t border-slate-200/70 pt-8">
        <Boton
          a="/acceso"
          variante="secundario"
          anchoCompleto
          icono={<Stethoscope className="h-5 w-5" aria-hidden />}
        >
          Soy del personal de la clínica
        </Boton>
      </div>
    </div>
  );
}
