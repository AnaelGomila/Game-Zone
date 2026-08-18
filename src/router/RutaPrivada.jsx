/*
  RutaPrivada
  -----------
  Wrapper que envuelve a las rutas privadas de la aplicación.

  TODAVÍA NO verifica si hay un usuario logueado: eso se conecta en la
  Parte 3, cuando se arme el ContextoAuth con Supabase Auth. Por ahora
  simplemente deja pasar a cualquiera, para poder probar que las rutas
  y la navegación funcionan bien de punta a punta.

  En la Parte 3 va a quedar algo así:

    import { Navigate } from 'react-router-dom';
    import { useAuth } from '../contexto/ContextoAuth';

    function RutaPrivada({ children }) {
      const { usuario, cargando } = useAuth();
      if (cargando) return null; // o un spinner
      if (!usuario) return <Navigate to="/login" replace />;
      return children;
    }
*/
function RutaPrivada({ children }) {
  return children;
}

export default RutaPrivada;
