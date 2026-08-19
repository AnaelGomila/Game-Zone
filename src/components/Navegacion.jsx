import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import './Navegacion.css';

/*
  Navegacion
  ----------
  Sigue siendo temporal (se reemplaza por el Header/Footer definitivos
  más adelante), pero ahora muestra links distintos según haya sesión
  iniciada o no, usando el ContextoAuth.
*/
function Navegacion() {
  const { estaLogueado, perfil, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  async function manejarLogout() {
    await cerrarSesion();
    navegar('/login');
  }

  return (
    <nav className="navegacion-temporal">
      <Link to="/">Inicio</Link>
      <Link to="/catalogo">Catálogo</Link>

      {!estaLogueado && (
        <>
          <Link to="/login">Login</Link>
          <Link to="/registro">Registro</Link>
        </>
      )}

      {estaLogueado && (
        <>
          <Link to="/perfil">Perfil{perfil?.nombre ? ` (${perfil.nombre})` : ''}</Link>
          <Link to="/favoritos">Favoritos</Link>
          <Link to="/sugerir">Sugerir juego</Link>
          <Link to="/mis-sugerencias">Mis sugerencias</Link>
          <Link to="/admin/usuarios">Admin: Usuarios</Link>
          <Link to="/admin/sugerencias">Admin: Sugerencias</Link>
          <button className="navegacion-boton-salir" onClick={manejarLogout}>
            Cerrar sesión
          </button>
        </>
      )}
    </nav>
  );
}

export default Navegacion;
