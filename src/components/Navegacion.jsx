import { Link } from 'react-router-dom';
import './Navegacion.css';

/*
  Navegacion
  ----------
  Menú temporal con un link a cada ruta, solo para poder probar que la
  navegación funciona mientras no existe el layout definitivo. Se va a
  reemplazar por el Header/Footer reales en una próxima parte.
*/
function Navegacion() {
  return (
    <nav className="navegacion-temporal">
      <Link to="/">Inicio</Link>
      <Link to="/catalogo">Catálogo</Link>
      <Link to="/login">Login</Link>
      <Link to="/registro">Registro</Link>
      <Link to="/perfil">Perfil</Link>
      <Link to="/favoritos">Favoritos</Link>
      <Link to="/sugerir">Sugerir juego</Link>
      <Link to="/mis-sugerencias">Mis sugerencias</Link>
      <Link to="/admin/usuarios">Admin: Usuarios</Link>
      <Link to="/admin/sugerencias">Admin: Sugerencias</Link>
    </nav>
  );
}

export default Navegacion;
