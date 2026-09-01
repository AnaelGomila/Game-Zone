import { useEffect, useState } from 'react';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { obtenerTodosLosUsuarios, cambiarRolUsuario, actualizarTituloAdmin } from '../servicios/servicioUsuarios';
import '../styles/adminTabla.css';
import '../styles/cargando.css';

/*
  AdminUsuarios — deja de ser placeholder en la Parte 6, extendido en la
  Parte 17.
  -----------------------------------------------------------
  Lista todos los usuarios (nombre + rol) y permite promover a admin o
  degradar a usuario con un botón por fila. Ver servicioUsuarios.js sobre
  por qué no se muestra el email.

  Protección contra "sacarse el propio admin sin querer": el botón de
  cambiar rol se deshabilita en la propia fila del admin que está
  logueado, para no dejarlo sin acceso al panel sin querer (si de verdad
  hace falta bajar a un admin, que lo haga otro admin).

  Parte 17: se agrega una columna "Título" — un texto cosmético (ej:
  "Moderador", "Beta Tester") que un admin le puede poner a cualquier
  usuario, distinto de `rol` (que sí controla permisos). Se ve en el
  perfil de esa persona. Solo se puede editar desde acá — está reforzado
  por el trigger evitar_cambio_titulo_admin_no_admin (Parte 17), que
  revierte cualquier intento de cambiarlo desde una cuenta que no sea
  admin.
*/
function AdminUsuarios() {
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [actualizandoId, setActualizandoId] = useState(null);

  const [titulosEditados, setTitulosEditados] = useState({});
  const [guardandoTituloId, setGuardandoTituloId] = useState(null);

  useEffect(() => {
    obtenerTodosLosUsuarios()
      .then((resultado) => setUsuarios(resultado))
      .catch((error) => {
        console.error('Error al traer usuarios:', error.message);
        setError('No se pudieron cargar los usuarios.');
      })
      .finally(() => setCargando(false));
  }, []);

  async function manejarCambiarRol(usuarioFila) {
    const nuevoRol = usuarioFila.rol === 'admin' ? 'usuario' : 'admin';
    setActualizandoId(usuarioFila.id);

    try {
      await cambiarRolUsuario(usuarioFila.id, nuevoRol);
      setUsuarios((actuales) =>
        actuales.map((fila) =>
          fila.id === usuarioFila.id ? { ...fila, rol: nuevoRol } : fila
        )
      );
      mostrarAlerta(
        `${usuarioFila.nombre} ahora es ${nuevoRol === 'admin' ? 'admin' : 'usuario'}.`,
        'exito'
      );
    } catch (error) {
      console.error('Error al cambiar rol:', error.message);
      mostrarAlerta('No se pudo cambiar el rol.', 'error');
    } finally {
      setActualizandoId(null);
    }
  }

  async function manejarGuardarTitulo(fila) {
    const nuevoTitulo = (titulosEditados[fila.id] ?? fila.titulo_admin ?? '').trim();
    setGuardandoTituloId(fila.id);

    try {
      await actualizarTituloAdmin(fila.id, nuevoTitulo);
      setUsuarios((actuales) =>
        actuales.map((f) => (f.id === fila.id ? { ...f, titulo_admin: nuevoTitulo || null } : f))
      );
      mostrarAlerta('Título actualizado.', 'exito');
    } catch (error) {
      console.error('Error al actualizar título:', error.message);
      mostrarAlerta('No se pudo actualizar el título.', 'error');
    } finally {
      setGuardandoTituloId(null);
    }
  }

  return (
    <div className="admin-panel">
      <h1>Admin: Usuarios</h1>
      <p className="admin-panel-ayuda">
        Promové o degradá usuarios entre los roles "usuario" y "admin". No se
        muestra el email: solo vive en la sesión de Supabase Auth, no en la
        tabla `usuarios` que puede leer el panel.
      </p>

      {cargando && <p className="cargando">Cargando usuarios...</p>}
      {error && <p className="formulario-simple-error">{error}</p>}

      {!cargando && !error && (
        <table className="admin-tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Rol</th>
              <th>Título</th>
              <th>Acción</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((fila) => {
              const esUsuarioActual = fila.id === usuario?.id;
              const valorTitulo = titulosEditados[fila.id] ?? fila.titulo_admin ?? '';
              return (
                <tr key={fila.id}>
                  <td>
                    {fila.nombre || '—'}
                    {esUsuarioActual && ' (vos)'}
                  </td>
                  <td>{fila.rol}</td>
                  <td>
                    <div className="admin-tabla-titulo">
                      <input
                        type="text"
                        value={valorTitulo}
                        placeholder="Sin título"
                        onChange={(evento) =>
                          setTitulosEditados((actuales) => ({
                            ...actuales,
                            [fila.id]: evento.target.value,
                          }))
                        }
                      />
                      <button
                        type="button"
                        disabled={guardandoTituloId === fila.id}
                        onClick={() => manejarGuardarTitulo(fila)}
                      >
                        {guardandoTituloId === fila.id ? 'Guardando...' : 'Guardar'}
                      </button>
                    </div>
                  </td>
                  <td>
                    <button
                      type="button"
                      disabled={esUsuarioActual || actualizandoId === fila.id}
                      onClick={() => manejarCambiarRol(fila)}
                      title={
                        esUsuarioActual
                          ? 'No podés cambiar tu propio rol'
                          : undefined
                      }
                    >
                      {fila.rol === 'admin' ? 'Bajar a usuario' : 'Subir a admin'}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default AdminUsuarios;
