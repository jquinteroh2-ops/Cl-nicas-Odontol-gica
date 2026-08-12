import { useUsuario } from '@compartido/auth';
import { rutaInicio } from '@compartido/permisos';
import Boton from '@componentes/ui/Boton';

export default function NoEncontrado() {
  const usuario = useUsuario();

  return (
    <div className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="rotulo">Error 404</p>
      <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">
        No encontramos esta página
      </h1>
      <p className="mx-auto mt-4 max-w-md text-lg leading-relaxed text-slate-600">
        Puede que el enlace esté mal escrito o que la página se haya movido.
      </p>
      <div className="mt-10 flex justify-center">
        <Boton a={rutaInicio(usuario)} tamano="lg">
          {usuario ? 'Volver a mi inicio' : 'Volver al inicio'}
        </Boton>
      </div>
    </div>
  );
}
