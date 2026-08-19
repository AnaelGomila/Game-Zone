import { useEffect, useMemo, useState } from 'react';
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

const FILTROS = ['todas', 'pendiente', 'aprobado', 'rechazado'];

/*
  AdminSugerencias — deja de ser placeholder en la Parte 6.
  ----------------------------------------------------------------
  Panel de administración para la entidad ABM principal del proyecto:
  aprobar, rechazar, editar o eliminar sugerencias de juegos. Página
  separada de AdminUsuarios (no tabs), como quedó decidido desde la
  Parte 1.

  `sugerencias` viene con un join a `usuarios(nombre)` (ver
  servicioSugerencias.obtenerTodasLasSugerencias) para poder mostrar quién
  la propuso, sin necesitar un segundo pedido por cada fila.
*/
function AdminSugerencias() {
  const { mostrarAlerta } = useAlerta();

  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('pendiente');
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
    if (filtro === 'todas') return sugerencias;
    return sugerencias.filter((sugerencia) => sugerencia.estado === filtro);
  }, [sugerencias, filtro]);

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
      mostrarAlerta('No se pudo actualizar el estado.', 'error');
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
        {FILTROS.map((opcion) => (
          <button
            key={opcion}
            type="button"
            className={filtro === opcion ? 'activo' : ''}
            onClick={() => setFiltro(opcion)}
          >
            {opcion === 'todas' ? 'Todas' : opcion[0].toUpperCase() + opcion.slice(1)}
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
            <div className="tarjeta-sugerencia-encabezado">
              <h2>{sugerencia.nombre_juego}</h2>
              <BadgeEstado estado={sugerencia.estado} />
            </div>

            <p className="tarjeta-sugerencia-meta">
              Propuesta por: {sugerencia.usuarios?.nombre || 'Usuario desconocido'}
              {sugerencia.plataforma && ` · Plataforma: ${sugerencia.plataforma}`}
            </p>

            {sugerencia.descripcion && (
              <p className="tarjeta-sugerencia-descripcion">{sugerencia.descripcion}</p>
            )}

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
