import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  obtenerTodasLasSugerencias,
  actualizarEstadoSugerencia,
  eliminarSugerencia,
} from '../servicios/servicioSugerencias';
import BadgeEstado from '../components/BadgeEstado';
import ModalEditarSugerencia from '../components/ModalEditarSugerencia';
import '../styles/listaSugerencias.css';
import '../styles/cargando.css';

const FILTROS_ESTADO = ['todas', 'pendiente', 'aprobado', 'rechazado'];
const FILTROS_ORIGEN = ['todos', 'usuarios', 'admins'];

/*
  AdminSugerencias — deja de ser placeholder en la Parte 6, extendido en
  la Parte 11.
  ----------------------------------------------------------------------
  Panel de administración para la entidad ABM principal del proyecto:
  aprobar, rechazar, editar o eliminar sugerencias de juegos. Página
  separada de AdminUsuarios (no tabs), como quedó decidido desde la
  Parte 1.

  `sugerencias` trae la columna nombre_autor (una "foto" del nombre de
  quien la creó, tomada por un trigger de la base al insertar — ver
  sql/parte-12-catalogo-comunidad.sql) para poder mostrar quién la
  propuso sin necesitar un join a `usuarios` en cada consulta. Esto
  sirve igual para mostrar el nombre de un admin que agregó un juego
  (Parte 11): no hace falta ninguna columna aparte para "quién lo
  agregó", nombre_autor ya apunta al admin cuando el que creó la fila
  fue un admin.

  Parte 11: se agrega un segundo filtro (Origen: Todos/Usuarios/Admins),
  independiente del filtro por estado — un admin puede querer ver, por
  ejemplo, "todo lo aprobado, sea de usuarios o de admins" o "solo lo que
  agregaron los admins". Se filtra por la columna creado_por_admin.
*/
function AdminSugerencias() {
  const { mostrarAlerta } = useAlerta();

  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('pendiente');
  const [filtroOrigen, setFiltroOrigen] = useState('todos');
  const [sugerenciaEditando, setSugerenciaEditando] = useState(null);

  useEffect(() => {
    obtenerTodasLasSugerencias()
      .then((resultado) => setSugerencias(resultado))
      .catch((error) => {
        console.error('Error al traer sugerencias:', error.message);
        setError('No se pudieron cargar las sugerencias.');
      })
      .finally(() => setCargando(false));
  }, []);

  const sugerenciasFiltradas = useMemo(() => {
    return sugerencias.filter((sugerencia) => {
      const pasaEstado = filtroEstado === 'todas' || sugerencia.estado === filtroEstado;
      const pasaOrigen =
        filtroOrigen === 'todos' ||
        (filtroOrigen === 'admins' && sugerencia.creado_por_admin) ||
        (filtroOrigen === 'usuarios' && !sugerencia.creado_por_admin);
      return pasaEstado && pasaOrigen;
    });
  }, [sugerencias, filtroEstado, filtroOrigen]);

  function actualizarEnEstado(id, cambios) {
    setSugerencias((actuales) =>
      actuales.map((sugerencia) =>
        sugerencia.id === id ? { ...sugerencia, ...cambios } : sugerencia
      )
    );
  }

  async function manejarCambiarEstado(sugerencia, nuevoEstado) {
    try {
      await actualizarEstadoSugerencia(sugerencia.id, nuevoEstado);
      actualizarEnEstado(sugerencia.id, { estado: nuevoEstado });
      mostrarAlerta(
        nuevoEstado === 'aprobado' ? 'Sugerencia aprobada.' : 'Sugerencia rechazada.',
        nuevoEstado === 'aprobado' ? 'exito' : 'info'
      );
    } catch (error) {
      console.error('Error al cambiar estado:', error.message);
      // Parte 11: si falta la imagen, el trigger de la base
      // (exigir_imagen_si_aprobado) rechaza el UPDATE con un mensaje
      // propio en español — se muestra tal cual en vez del genérico,
      // porque le dice al admin exactamente qué hacer ("cargá una
      // imagen primero") en lugar de un error sin acción posible.
      mostrarAlerta(
        error.message.includes('imagen cargada')
          ? 'Esta sugerencia todavía no tiene una imagen cargada — completala con "Editar" antes de aprobar.'
          : 'No se pudo actualizar el estado.',
        'error'
      );
    }
  }

  async function manejarEliminar(id) {
    try {
      await eliminarSugerencia(id);
      setSugerencias((actuales) => actuales.filter((sugerencia) => sugerencia.id !== id));
      mostrarAlerta('Sugerencia eliminada.', 'info');
    } catch (error) {
      console.error('Error al eliminar sugerencia:', error.message);
      mostrarAlerta('No se pudo eliminar la sugerencia.', 'error');
    }
  }

  return (
    <div className="lista-sugerencias">
      <h1>Admin: Sugerencias</h1>

      <div className="filtros-estado">
        {FILTROS_ESTADO.map((opcion) => (
          <button
            key={opcion}
            type="button"
            className={filtroEstado === opcion ? 'activo' : ''}
            onClick={() => setFiltroEstado(opcion)}
          >
            {opcion === 'todas' ? 'Todas' : opcion[0].toUpperCase() + opcion.slice(1)}
          </button>
        ))}
      </div>

      <div className="filtros-estado">
        {FILTROS_ORIGEN.map((opcion) => (
          <button
            key={opcion}
            type="button"
            className={filtroOrigen === opcion ? 'activo' : ''}
            onClick={() => setFiltroOrigen(opcion)}
          >
            Origen: {opcion[0].toUpperCase() + opcion.slice(1)}
          </button>
        ))}
      </div>

      {cargando && <p className="cargando">Cargando sugerencias...</p>}
      {error && <p className="formulario-simple-error">{error}</p>}

      {!cargando && !error && sugerenciasFiltradas.length === 0 && (
        <p className="lista-sugerencias-vacio">No hay sugerencias en este filtro.</p>
      )}

      {!cargando &&
        !error &&
        sugerenciasFiltradas.map((sugerencia) => (
          <div key={sugerencia.id} className="tarjeta-sugerencia">
            <div className="tarjeta-sugerencia-cuerpo">
              {sugerencia.imagen_url && (
                <img
                  src={sugerencia.imagen_url}
                  alt={sugerencia.nombre_juego}
                  className="tarjeta-sugerencia-miniatura"
                />
              )}

              <div className="tarjeta-sugerencia-texto">
                <div className="tarjeta-sugerencia-encabezado">
                  <h2>{sugerencia.nombre_juego}</h2>
                  <BadgeEstado estado={sugerencia.estado} />
                </div>

                <p className="tarjeta-sugerencia-meta">
                  {sugerencia.creado_por_admin ? 'Agregado por admin: ' : 'Propuesta por: '}
                  <Link to={`/usuario/${sugerencia.usuario_id}`}>
                    {sugerencia.nombre_autor || 'Usuario desconocido'}
                  </Link>
                  {!sugerencia.creado_por_admin && sugerencia.mostrar_autor === false && (
                    <> (pidió no mostrar su nombre públicamente)</>
                  )}
                  {sugerencia.plataforma && ` · Plataforma: ${sugerencia.plataforma}`}
                  {sugerencia.genero && ` · Género: ${sugerencia.genero}`}
                  {sugerencia.anio_lanzamiento && ` · Año: ${sugerencia.anio_lanzamiento}`}
                </p>

                {sugerencia.descripcion && (
                  <p className="tarjeta-sugerencia-descripcion">{sugerencia.descripcion}</p>
                )}
              </div>
            </div>

            <div className="tarjeta-sugerencia-acciones">
              {sugerencia.estado !== 'aprobado' && (
                <button
                  type="button"
                  className="boton-aprobar"
                  onClick={() => manejarCambiarEstado(sugerencia, 'aprobado')}
                >
                  Aprobar
                </button>
              )}
              {sugerencia.estado !== 'rechazado' && (
                <button
                  type="button"
                  className="boton-rechazar"
                  onClick={() => manejarCambiarEstado(sugerencia, 'rechazado')}
                >
                  Rechazar
                </button>
              )}
              <button type="button" onClick={() => setSugerenciaEditando(sugerencia)}>
                Editar
              </button>
              <button
                type="button"
                className="boton-eliminar"
                onClick={() => manejarEliminar(sugerencia.id)}
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}

      {sugerenciaEditando && (
        <ModalEditarSugerencia
          sugerencia={sugerenciaEditando}
          onCerrar={() => setSugerenciaEditando(null)}
          onGuardado={(sugerenciaActualizada) =>
            actualizarEnEstado(sugerenciaActualizada.id, sugerenciaActualizada)
          }
        />
      )}
    </div>
  );
}

export default AdminSugerencias;
