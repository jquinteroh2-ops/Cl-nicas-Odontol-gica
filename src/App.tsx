import { Route, Routes } from 'react-router-dom';
import RutaProtegida from '@componentes/RutaProtegida';
import LayoutPublico from '@publico/layout/LayoutPublico';
import Inicio from '@publico/paginas/Inicio';
import Agendar from '@publico/paginas/Agendar';
import IngresoPaciente from '@publico/paginas/IngresoPaciente';
import AccesoPersonal from '@publico/paginas/AccesoPersonal';
import EnConstruccion from '@publico/paginas/EnConstruccion';
import NoEncontrado from '@publico/paginas/NoEncontrado';
import Diagnostico from '@publico/paginas/Diagnostico';
import LayoutPaciente from '@paciente/layout/LayoutPaciente';
import PortalPaciente from '@paciente/paginas/PortalPaciente';
import EstadoCuenta from '@paciente/paginas/EstadoCuenta';
import LayoutClinica from '@clinica/layout/LayoutClinica';
import PanelClinica from '@clinica/paginas/PanelClinica';
import AgendaSemanal from '@clinica/paginas/AgendaSemanal';

/**
 * Mapa completo de rutas. Las pantallas que aún no existen usan EnConstruccion,
 * pero ya van envueltas en su guarda definitiva: así el sistema de permisos se
 * prueba entero desde la fase 1, entrando por URL directa.
 *
 * Las tres áreas tienen marco propio y guarda en la ruta de layout, de modo que
 * ninguna pantalla interior tenga que repetir la comprobación de rol. Las que
 * además exigen una capacidad concreta llevan su propia guarda anidada.
 */
export default function App() {
  return (
    <Routes>
      <Route element={<LayoutPublico />}>
        {/* Área pública */}
        <Route path="/" element={<Inicio />} />
        <Route path="/agendar" element={<Agendar />} />
        <Route path="/ingresar" element={<IngresoPaciente />} />
        <Route path="/acceso" element={<AccesoPersonal />} />

        <Route path="*" element={<NoEncontrado />} />
      </Route>

      {/*
        Área del paciente. Tiene su propio marco —saludo con nombre y dos
        pestañas— y una sola guarda para todo el bloque, en la ruta de layout.
      */}
      <Route
        element={
          <RutaProtegida area="paciente">
            <LayoutPaciente />
          </RutaProtegida>
        }
      >
        <Route path="/portal" element={<PortalPaciente />} />
        <Route path="/portal/cuenta" element={<EstadoCuenta />} />
      </Route>

      {/*
        Área de la clínica. El menú lateral se construye con las capacidades del
        rol, así que la secretaria ni siquiera ve Cartera; las guardas anidadas
        cubren la entrada por URL directa.
      */}
      <Route
        element={
          <RutaProtegida area="clinica">
            <LayoutClinica />
          </RutaProtegida>
        }
      >
        <Route path="/clinica" element={<PanelClinica />} />
        <Route path="/clinica/agenda" element={<AgendaSemanal />} />
        <Route
          path="/clinica/pacientes"
          element={
            <RutaProtegida area="clinica" capacidad="gestionar_pacientes">
              <EnConstruccion titulo="Pacientes" fase={5} />
            </RutaProtegida>
          }
        />
        <Route
          path="/clinica/cartera"
          element={
            <RutaProtegida area="clinica" capacidad="ver_cartera">
              <EnConstruccion
                titulo="Cartera"
                fase={5}
                descripcion="Solo el administrador puede verla."
              />
            </RutaProtegida>
          }
        />
        <Route
          path="/clinica/bitacora"
          element={
            <RutaProtegida area="clinica" capacidad="ver_bitacora">
              <EnConstruccion
                titulo="Bitácora de actividad"
                fase={5}
                descripcion="Solo el administrador puede verla."
              />
            </RutaProtegida>
          }
        />
      </Route>

      {/* Pantalla de verificación, sin enlazar desde ningún menú. */}
      <Route path="/diagnostico" element={<Diagnostico />} />
    </Routes>
  );
}
