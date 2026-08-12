import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Encabezado from './Encabezado';
import PieDePagina from './PieDePagina';

/** Sube la vista al cambiar de ruta: sin esto se navega y se queda a media página. */
function DesplazarArriba() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [pathname]);
  return null;
}

export default function LayoutPublico() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <DesplazarArriba />
      <Encabezado />
      <main className="flex-1">
        <Outlet />
      </main>
      <PieDePagina />
    </div>
  );
}
