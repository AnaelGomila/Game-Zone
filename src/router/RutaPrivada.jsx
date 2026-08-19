import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import '../styles/cargando.css';

/*
  RutaPrivada — sin cambios respecto a la Parte 3. Se incluye tal cual
  para que el ZIP de la Parte 6 quede completo.
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
