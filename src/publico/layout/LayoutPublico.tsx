import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Encabezado from './Encabezado';
import PieDePagina from './PieDePagina';
import BotonesFlotantes from './BotonesFlotantes';

/**
 * Coloca la vista al cambiar de ruta. Con ancla —el menú navega a `/#servicios`
 * desde cualquier pantalla— baja hasta la sección; sin ancla, sube al principio,
 * que si no se navega y se queda a media página.
 */
function ColocarVista() {
  const { pathname, hash, key } = useLocation();

  useEffect(() => {
    if (hash) {
      // La sección puede tardar un cuadro en existir si se acaba de montar la ruta.
      const destino = requestAnimationFrame(() => {
        document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'start' });
      });
      return () => cancelAnimationFrame(destino);
    }

    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname, hash, key]);

  return null;
}

export default function LayoutPublico() {
  const { pathname } = useLocation();
  // La portada pasa por debajo del encabezado transparente; el resto de
  // pantallas empiezan justo debajo de la barra.
  const enInicio = pathname === '/';

  // En el agendamiento no van los botones flotantes: la barra de "Continuar"
  // vive pegada abajo y el círculo de WhatsApp le caía justo encima.
  const enAgendar = pathname.startsWith('/agendar');

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <ColocarVista />
      <Encabezado />
      <main className={`flex-1 ${enInicio ? '' : 'pt-20'}`}>
        <Outlet />
      </main>
      <PieDePagina />
      {!enAgendar && <BotonesFlotantes />}
    </div>
  );
}
