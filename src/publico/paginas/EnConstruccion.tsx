/**
 * Marcador de posición de las pantallas que llegan en fases posteriores.
 *
 * Existe para que la navegación y las guardas de ruta se puedan probar completas
 * desde la fase 1: al entrar a una ruta protegida se ve quién está en sesión en
 * esta pestaña, que es justo lo que hay que verificar.
 */

import { Construction } from 'lucide-react';
import { useUsuario } from '@compartido/auth';
import { ETIQUETA_ROL, rutaInicio } from '@compartido/permisos';
import { useAvisoDeRuta } from '@componentes/RutaProtegida';
import Boton from '@componentes/ui/Boton';

interface Props {
  titulo: string;
  fase: number;
  descripcion?: string;
}

export default function EnConstruccion({ titulo, fase, descripcion }: Props) {
  const usuario = useUsuario();
  const aviso = useAvisoDeRuta();

  return (
    <div className="mx-auto max-w-3xl px-6 py-20">
      {aviso && (
        <p className="mb-8 rounded-2xl bg-amber-50 px-4 py-3.5 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          {aviso}
        </p>
      )}

      <span className="grid h-14 w-14 place-items-center rounded-3xl bg-slate-100 text-slate-500">
        <Construction className="h-6 w-6" aria-hidden strokeWidth={1.5} />
      </span>

      <h1 className="mt-7 text-3xl font-semibold tracking-tight text-slate-900">{titulo}</h1>
      <p className="mt-3 text-lg leading-relaxed text-slate-600">
        {descripcion ?? 'Esta pantalla se construye en la fase siguiente.'} Corresponde a la fase{' '}
        {fase} del plan.
      </p>

      {usuario && (
        <dl className="mt-10 divide-y divide-slate-100 rounded-3xl bg-white px-6 shadow-suave ring-1 ring-slate-200/70">
          <div className="flex items-baseline justify-between gap-4 py-4">
            <dt className="text-sm text-slate-500">Sesión de esta pestaña</dt>
            <dd className="text-right font-medium text-slate-900">{usuario.nombre}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4 py-4">
            <dt className="text-sm text-slate-500">Rol</dt>
            <dd className="text-right font-medium text-slate-900">{ETIQUETA_ROL[usuario.rol]}</dd>
          </div>
        </dl>
      )}

      {/*
        "Inicio" es el de cada quien: desde una ruta de la clínica este botón
        devuelve al panel, no a la portada pública. Antes sacaba al personal de
        su área de un clic.
      */}
      <div className="mt-10 flex flex-wrap gap-3">
        <Boton a={rutaInicio(usuario)} variante="secundario">
          Volver al inicio
        </Boton>
        <Boton a="/diagnostico" variante="fantasma">
          Ir al diagnóstico
        </Boton>
      </div>
    </div>
  );
}
