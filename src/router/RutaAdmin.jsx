import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import '../styles/cargando.css';

/*
  RutaAdmin — nuevo en la Parte 6.
  ---------------------------------
  Hasta la Parte 5, las rutas /admin/usuarios y /admin/sugerencias estaban
  envueltas en <RutaPrivada>, que solo chequea "¿hay sesión?". Eso permitía
  que CUALQUIER usuario logueado (no solo admins) entrara escribiendo la
  URL a mano, aunque ya no viera el link en la navbar (fix de Navegacion.jsx).

  RutaAdmin hace el mismo chequeo de sesión que RutaPrivada, y además exige
  esAdmin. Se usa en vez de RutaPrivada, no además de ella, en AppRouter.

  - Mientras cargando: mensaje de carga (igual que RutaPrivada), para no
    decidir apurado antes de saber si hay sesión y cuál es el rol.
  - Sin sesión: redirige a /login.
  - Con sesión pero sin rol admin: redirige a "/" (no tiene sentido
    mandarlo a /login si ya está logueado, solo no tiene permiso).
  - Admin: deja pasar el contenido.
*/
function RutaAdmin({ children }) {
  const { estaLogueado, esAdmin, cargando } = useAuth();

  if (cargando) {
    return <p className="cargando">Cargando...</p>;
  }

  if (!estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  if (!esAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RutaAdmin;
