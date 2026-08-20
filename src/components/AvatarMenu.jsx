import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { obtenerIniciales } from '../utils/iniciales';
import './AvatarMenu.css';

/*
  AvatarMenu — nuevo en la Parte 7.
  -------------------------------------
  Reemplaza los links sueltos "Perfil", "Admin: Usuarios" y
  "Admin: Sugerencias" que antes vivían en la navbar (Parte 3/6): ahora
  están agrupados atrás de un círculo con las iniciales del usuario, en la
  barra superior — el mismo patrón que el avatar "AG" de la esquina
  superior derecha en la referencia de RAWG.

  Cierra el desplegable al hacer clic afuera (listener en `document`) o al
  apretar Escape. No usa ningún componente de terceros para esto, es un
  patrón manual simple: la referencia `contenedorRef` delimita "adentro"
  del menú, cualquier clic fuera de ese nodo lo cierra.
*/
function AvatarMenu() {
  const { perfil, usuario, esAdmin, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  const [abierto, setAbierto] = useState(false);
  const contenedorRef = useRef(null);

  useEffect(() => {
    function manejarClicAfuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    }

    function manejarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false);
    }

    document.addEventListener('mousedown', manejarClicAfuera);
    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.removeEventListener('mousedown', manejarClicAfuera);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, []);

  async function manejarLogout() {
    setAbierto(false);
    await cerrarSesion();
    navegar('/login');
  }

  return (
    <div className="avatar-menu" ref={contenedorRef}>
      <button
        type="button"
        className="avatar-circulo"
        onClick={() => setAbierto((actual) => !actual)}
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-label="Menú de cuenta"
      >
        {obtenerIniciales(perfil?.nombre, usuario?.email)}
      </button>

      {abierto && (
        <div className="avatar-desplegable">
          <Link to="/perfil" onClick={() => setAbierto(false)}>
            Perfil{perfil?.nombre ? ` (${perfil.nombre})` : ''}
          </Link>

          {esAdmin && (
            <>
              <div className="avatar-desplegable-separador" />
              <Link
                to="/admin/usuarios"
                className="avatar-desplegable-admin"
                onClick={() => setAbierto(false)}
              >
                Admin: Usuarios
              </Link>
              <Link
                to="/admin/sugerencias"
                className="avatar-desplegable-admin"
                onClick={() => setAbierto(false)}
              >
                Admin: Sugerencias
              </Link>
            </>
          )}

          <div className="avatar-desplegable-separador" />
          <button type="button" className="avatar-desplegable-salir" onClick={manejarLogout}>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}

export default AvatarMenu;
