import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  obtenerComentariosDeJuego,
  crearComentario,
  eliminarComentario,
} from '../servicios/servicioComentarios';
import './ComentariosJuego.css';

const LARGO_MAXIMO_COMENTARIO = 500;

function ComentariosJuego({ juegoId }) {
  const { usuario, esAdmin } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [comentarios, setComentarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerComentariosDeJuego(juegoId)
      .then((resultado) => setComentarios(resultado))
      .catch((error) => console.error('Error al traer comentarios:', error.message))
      .finally(() => setCargando(false));
  }, [juegoId]);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;

    setEnviando(true);
    try {
      await crearComentario(usuario.id, juegoId, contenido);
      setTexto('');

      const actualizados = await obtenerComentariosDeJuego(juegoId);
      setComentarios(actualizados);
    } catch (error) {
      console.error('Error al publicar comentario:', error.message);
      mostrarAlerta('No se pudo publicar el comentario. Probá de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function manejarEliminar(id) {
    try {
      await eliminarComentario(id);
      setComentarios((actuales) => actuales.filter((comentario) => comentario.id !== id));
    } catch (error) {
      console.error('Error al eliminar comentario:', error.message);
      mostrarAlerta('No se pudo eliminar el comentario.', 'error');
    }
  }

  return (
    <div className="comentarios-juego">
      <h2>Comentarios</h2>

      <form className="comentarios-juego-form" onSubmit={manejarEnvio}>
        <textarea
          rows={3}
          maxLength={LARGO_MAXIMO_COMENTARIO}
          placeholder="Escribí un comentario..."
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <button type="submit" disabled={enviando || !texto.trim()}>
          {enviando ? 'Publicando...' : 'Publicar'}
        </button>
      </form>

      {cargando && <p className="comentarios-juego-cargando">Cargando comentarios...</p>}

      {!cargando && comentarios.length === 0 && (
        <p className="comentarios-juego-vacio">Todavía no hay comentarios. ¡Sé el primero!</p>
      )}

      {!cargando &&
        comentarios.map((comentario) => (
          <div key={comentario.id} className="comentario">
            <div className="comentario-encabezado">
              <Link to={`/usuario/${comentario.usuario_id}`} className="comentario-autor">
                {comentario.nombre_autor || 'Usuario'}
              </Link>
              <span className="comentario-fecha">
                {new Date(comentario.creado_en).toLocaleDateString('es-AR')}
              </span>
            </div>
            <p className="comentario-contenido">{comentario.contenido}</p>
            {(comentario.usuario_id === usuario?.id || esAdmin) && (
              <button
                type="button"
                className="comentario-eliminar"
                onClick={() => manejarEliminar(comentario.id)}
              >
                Eliminar
              </button>
            )}
          </div>
        ))}
    </div>
  );
}

export default ComentariosJuego;
