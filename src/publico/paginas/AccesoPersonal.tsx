/**
 * Acceso del personal de la clínica.
 *
 * Ruta discreta y con credenciales de otra forma —usuario y contraseña— porque
 * quien entra por aquí no es un paciente. No se mezcla con /ingresar: son dos
 * puertas distintas del mismo sistema.
 */

import { useEffect, useState, type FormEvent } from 'react';
import { Lock, LogIn } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useUsuario } from '@compartido/auth';
import { useDatos } from '@compartido/contexto';
import * as api from '@compartido/mockApi';
import { ETIQUETA_ROL, rutaInicio } from '@compartido/permisos';
import { useAvisoDeRuta } from '@componentes/RutaProtegida';
import Boton from '@componentes/ui/Boton';
import CampoTexto from '@componentes/ui/CampoTexto';

export default function AccesoPersonal() {
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const usuarioEnSesion = useUsuario();
  const { estado } = useDatos();
  const aviso = useAvisoDeRuta();

  const [usuario, setUsuario] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuarioEnSesion) navegar(rutaInicio(usuarioEnSesion), { replace: true });
  }, [usuarioEnSesion, navegar]);

  async function enviar(evento: FormEvent) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const autenticado = await api.iniciarSesionPersonal({ usuario, clave });
      const destino = (ubicacion.state as { desde?: string } | null)?.desde;
      navegar(destino?.startsWith('/clinica') ? destino : rutaInicio(autenticado), { replace: true });
    } catch (causa) {
      setError(causa instanceof Error ? causa.message : 'No pudimos verificar el acceso.');
    } finally {
      setEnviando(false);
    }
  }

  const personal = estado.usuarios.filter((u) => u.rol !== 'paciente' && u.activo);

  return (
    <div className="mx-auto max-w-md px-6 py-12 pb-seguro sm:py-20">
      {aviso && (
        <p className="mb-8 rounded-2xl bg-amber-50 px-4 py-3.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          {aviso}
        </p>
      )}

      <span className="grid h-14 w-14 place-items-center rounded-3xl bg-slate-800 text-white shadow-suave">
        <Lock className="h-6 w-6" aria-hidden strokeWidth={1.5} />
      </span>

      <h1 className="mt-7 text-3xl font-semibold tracking-tight text-slate-900">
        Acceso del personal
      </h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-600">
        Ingrese con su usuario para entrar al panel de la clínica.
      </p>

      <form onSubmit={enviar} className="mt-10 space-y-5">
        <CampoTexto
          etiqueta="Usuario"
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          value={usuario}
          onChange={(evento) => setUsuario(evento.target.value)}
        />

        <CampoTexto
          etiqueta="Contraseña"
          type="password"
          autoComplete="current-password"
          value={clave}
          onChange={(evento) => setClave(evento.target.value)}
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
          deshabilitado={!usuario || !clave}
          icono={<LogIn className="h-5 w-5" aria-hidden />}
        >
          {enviando ? 'Verificando…' : 'Ingresar'}
        </Boton>
      </form>

      <div className="mt-10 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200/70">
        <p className="rotulo">Credenciales de prueba</p>
        <ul className="mt-4 space-y-4">
          {personal.map((persona) => (
            <li key={persona.id} className="text-sm">
              <p className="font-medium text-slate-800">
                {ETIQUETA_ROL[persona.rol]} · {persona.nombre}
              </p>
              <p className="mt-0.5 font-mono text-xs text-slate-600">
                {persona.usuario} / {persona.clave}
              </p>
              <button
                type="button"
                onClick={() => {
                  setUsuario(persona.usuario ?? '');
                  setClave(persona.clave ?? '');
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
        ¿Es paciente?{' '}
        <Link to="/ingresar" className="font-medium text-petroleo-700 underline underline-offset-4">
          Entre por aquí
        </Link>
      </p>
    </div>
  );
}
