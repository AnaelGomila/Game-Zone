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

/*
  AppRouter
  ---------
  Define todas las rutas de la aplicación en un solo lugar. Las rutas
  privadas están envueltas en <RutaPrivada>, que hoy no bloquea nada
  pero en la Parte 3 va a chequear la sesión de Supabase Auth.
*/
function AppRouter() {
  return (
    <Routes>
      {/* --- Rutas públicas --- */}
      <Route path="/" element={<Inicio />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/catalogo" element={<Catalogo />} />

      {/* --- Rutas privadas --- */}
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
      <Route
        path="/admin/usuarios"
        element={
          <RutaPrivada>
            <AdminUsuarios />
          </RutaPrivada>
        }
      />
      <Route
        path="/admin/sugerencias"
        element={
          <RutaPrivada>
            <AdminSugerencias />
          </RutaPrivada>
        }
      />

      {/* --- Cualquier otra ruta --- */}
      <Route path="*" element={<NoEncontrada />} />
    </Routes>
  );
}

export default AppRouter;
