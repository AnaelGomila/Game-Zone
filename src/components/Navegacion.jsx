import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import './Navegacion.css';

/*
  Navegacion — Parte 6: fix de seguridad.
  ----------------------------------------
  Bug encontrado: los links "Admin: Usuarios" y "Admin: Sugerencias" se
  mostraban a CUALQUIER usuario logueado, porque la condición era
  `{estaLogueado && ...}` en vez de chequear el rol. Ahora esos dos links
  están adentro de su propio `{esAdmin && ...}`, separados del resto de
  los links privados (que siguen mostrándose a cualquier usuario logueado,
  admin o no).

  Importante: esto sólo esconde los links en la UI. La protección real
  de las rutas /admin/usuarios y /admin/sugerencias vive en RutaAdmin.jsx
  (Parte 6) — sin eso, un usuario no-admin podría entrar igual escribiendo
  la URL a mano, aunque no viera el link acá.
*/
function Navegacion() {
  const { estaLogueado, perfil, esAdmin, cerrarSesion } = useAuth();
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

          {esAdmin && (
            <>
              <Link to="/admin/usuarios" className="navegacion-link-admin">
                Admin: Usuarios
              </Link>
              <Link to="/admin/sugerencias" className="navegacion-link-admin">
                Admin: Sugerencias
              </Link>
            </>
          )}

          <button className="navegacion-boton-salir" onClick={manejarLogout}>
            Cerrar sesión
          </button>
        </>
      )}
    </nav>
  );
}

export default Navegacion;
