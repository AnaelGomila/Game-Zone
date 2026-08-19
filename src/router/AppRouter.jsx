import { Routes, Route } from 'react-router-dom';

import Inicio from '../pages/Inicio';
import Login from '../pages/Login';
import Registro from '../pages/Registro';
import Catalogo from '../pages/Catalogo';
import DetalleJuego from '../pages/DetalleJuego';
import Perfil from '../pages/Perfil';
import Favoritos from '../pages/Favoritos';
import SugerirJuego from '../pages/SugerirJuego';
import MisSugerencias from '../pages/MisSugerencias';
import AdminUsuarios from '../pages/AdminUsuarios';
import AdminSugerencias from '../pages/AdminSugerencias';
import NoEncontrada from '../pages/NoEncontrada';

import RutaPrivada from './RutaPrivada';
import RutaAdmin from './RutaAdmin';

/*
  AppRouter
  ---------
  Parte 6: único cambio respecto a la Parte 3 es que /admin/usuarios y
  /admin/sugerencias ahora usan <RutaAdmin> en vez de <RutaPrivada>, para
  que de verdad estén restringidas a usuarios con rol 'admin' (ver
  RutaAdmin.jsx para el detalle del bug que esto corrige).
*/
function AppRouter() {
  return (
    <Routes>
      {/* --- Rutas públicas --- */}
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/catalogo" element={<Catalogo />} />

      {/* --- Rutas privadas (cualquier usuario logueado) --- */}
      <Route
        path="/juego/:id"
        element={
          <RutaPrivada>
            <DetalleJuego />
          </RutaPrivada>
        }
      />
      <Route
        path="/perfil"
        element={
          <RutaPrivada>
            <Perfil />
          </RutaPrivada>
        }
      />
      <Route
        path="/favoritos"
        element={
          <RutaPrivada>
            <Favoritos />
          </RutaPrivada>
        }
      />
      <Route
        path="/sugerir"
        element={
          <RutaPrivada>
            <SugerirJuego />
          </RutaPrivada>
        }
      />
      <Route
        path="/mis-sugerencias"
        element={
          <RutaPrivada>
            <MisSugerencias />
          </RutaPrivada>
        }
      />

      {/* --- Rutas de admin (solo esAdmin) --- */}
      <Route
        path="/admin/usuarios"
        element={
          <RutaAdmin>
            <AdminUsuarios />
          </RutaAdmin>
        }
      />
      <Route
        path="/admin/sugerencias"
        element={
          <RutaAdmin>
            <AdminSugerencias />
          </RutaAdmin>
        }
      />

      {/* --- Cualquier otra ruta --- */}
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  );
}

export default AppRouter;
