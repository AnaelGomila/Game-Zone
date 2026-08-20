import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import './Sidebar.css';

/*
  Sidebar — nuevo en la Parte 7, reemplaza a Navegacion.jsx.
  ------------------------------------------------------------
  Fija, siempre visible (se eligió esa opción en vez de una colapsable con
  hamburguesa, para mantenerlo simple). Usa <NavLink> en vez de <Link>
  para poder marcar visualmente cuál es la pantalla activa (NavLink le
  agrega la clase "active" sola al link que coincide con la URL actual).

  Perfil y los links de admin YA NO están acá — se movieron a
  <AvatarMenu>, adentro de <BarraSuperior>.
*/
function Sidebar() {
  const { estaLogueado } = useAuth();

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'activo' : '')}>
          Inicio
        </NavLink>
        <NavLink to="/catalogo" className={({ isActive }) => (isActive ? 'activo' : '')}>
          Catálogo
        </NavLink>

        {estaLogueado && (
          <>
            <NavLink to="/favoritos" className={({ isActive }) => (isActive ? 'activo' : '')}>
              Favoritos
            </NavLink>
            <NavLink to="/sugerir" className={({ isActive }) => (isActive ? 'activo' : '')}>
              Sugerir juego
            </NavLink>
            <NavLink
              to="/mis-sugerencias"
              className={({ isActive }) => (isActive ? 'activo' : '')}
            >
              Mis sugerencias
            </NavLink>
          </>
        )}
      </nav>
    </aside>
  );
}

export default Sidebar;
