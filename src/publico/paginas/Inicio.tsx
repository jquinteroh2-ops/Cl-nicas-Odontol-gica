/**
 * Portada pública. El orden de las secciones es el del recorrido que hace quien
 * llega buscando dentista: quiénes son, qué hacen, cuánto llevan, qué dicen
 * sobre lo que me preocupa, cómo pido cita y dónde quedan.
 */

import Portada from '@publico/inicio/Portada';
import SobreNosotros from '@publico/inicio/SobreNosotros';
import RejillaServicios from '@publico/inicio/RejillaServicios';
import BandaCifras from '@publico/inicio/BandaCifras';
import Actualidad from '@publico/inicio/Actualidad';
import LlamadaCita from '@publico/inicio/LlamadaCita';
import BloqueContacto from '@publico/inicio/BloqueContacto';

export default function Inicio() {
  return (
    <>
      <Portada />
      <SobreNosotros />
      <RejillaServicios />
      <BandaCifras />
      <Actualidad />
      <LlamadaCita />
      <BloqueContacto />
    </>
  );
}
