import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import '../styles/cargando.css';

/*
  RutaPrivada
  -----------
  Ahora sí protege: si todavía no se sabe si hay sesión (cargando=true),
  muestra un mensaje de carga para no "parpadear" a /login antes de tiempo.
  Si ya se sabe y no hay usuario logueado, redirige a /login.
  Si hay usuario, deja pasar lo que venga adentro.
*/
function RutaPrivada({ children }) {
  const { estaLogueado, cargando } = useAuth();

  if (cargando) {
    return <p className="cargando">Cargando...</p>;
  }

  if (!estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RutaPrivada;
