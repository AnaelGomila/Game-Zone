import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  obtenerMensajesDePerfil,
  crearMensajePerfil,
  eliminarMensajePerfil,
} from '../servicios/servicioMensajesPerfil';
import './MuroPerfil.css';

const LARGO_MAXIMO_MENSAJE = 500;
const MAXIMO_VISIBLE = 5;

/*
  MuroPerfil — nuevo en la Parte 18.
  --------------------------------------
  La "Parte B" que había quedado pendiente desde la Parte 14: en vez de
  un muro general de cualquier tema, terminó siendo un muro POR PERFIL
  — mismo patrón de tabla que ComentariosJuego (nombre_autor completado
  por un trigger, sin edición, 500 caracteres tope reforzados en la
  base), pero "atado" a un usuario en vez de a un juego.

  Moderación: quién puede borrar un mensaje se decide en la base
  (sql/parte-18-muro-perfil.sql) — acá `puedeEliminar` solo repite la
  misma regla para no mostrar un botón que la RLS igual iba a rechazar:
    - el propio autor siempre puede borrar lo suyo.
    - cualquier admin puede borrar cualquier mensaje.
    - el dueño del perfil puede borrar mensajes de su pared, salvo los
      que dejó un admin (a menos que el dueño sea admin también, ya
      cubierto por la condición anterior).

  "Desplegable" si hay muchos: se piden todos de una (no vale la pena
  paginar un muro de perfil), pero solo se muestran los primeros 5 hasta
  que se aprieta "Ver más mensajes" — no hace falta ningún pedido nuevo
  al expandir, ya están todos en memoria.
*/
function MuroPerfil({ perfilId }) {
  const { usuario, esAdmin } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [mensajes, setMensajes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [texto, setTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [expandido, setExpandido] = useState(false);

  useEffect(() => {
    setCargando(true);
    setExpandido(false);

    obtenerMensajesDePerfil(perfilId)
      .then((resultado) => setMensajes(resultado))
      .catch((error) => console.error('Error al traer mensajes:', error.message))
      .finally(() => setCargando(false));
  }, [perfilId]);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    const contenido = texto.trim();
    if (!contenido) return;

    setEnviando(true);
    try {
      await crearMensajePerfil(usuario.id, perfilId, contenido);
      setTexto('');

      const actualizados = await obtenerMensajesDePerfil(perfilId);
      setMensajes(actualizados);
    } catch (error) {
      console.error('Error al publicar mensaje:', error.message);
      mostrarAlerta('No se pudo publicar el mensaje. Probá de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  async function manejarEliminar(id) {
    try {
      await eliminarMensajePerfil(id);
      setMensajes((actuales) => actuales.filter((mensaje) => mensaje.id !== id));
    } catch (error) {
      console.error('Error al eliminar mensaje:', error.message);
      mostrarAlerta('No se pudo eliminar el mensaje.', 'error');
    }
  }

  const esDuenoDelPerfil = perfilId === usuario?.id;
  const hayMasMensajes = mensajes.length > MAXIMO_VISIBLE;
  const mensajesVisibles = expandido ? mensajes : mensajes.slice(0, MAXIMO_VISIBLE);

  return (
    <div className="muro-perfil">
      <form className="muro-perfil-form" onSubmit={manejarEnvio}>
        <textarea
          rows={3}
          maxLength={LARGO_MAXIMO_MENSAJE}
          placeholder="Escribí un mensaje..."
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
        />
        <button type="submit" disabled={enviando || !texto.trim()}>
          {enviando ? 'Publicando...' : 'Publicar'}
        </button>
      </form>

      {cargando && <p className="muro-perfil-cargando">Cargando mensajes...</p>}

      {!cargando && mensajes.length === 0 && (
        <p className="muro-perfil-vacio">Todavía no hay mensajes. ¡Sé el primero!</p>
      )}

      {!cargando &&
        mensajesVisibles.map((mensaje) => {
          const puedeEliminar =
            mensaje.usuario_id === usuario?.id ||
            esAdmin ||
            (esDuenoDelPerfil && !mensaje.autor_es_admin);

          return (
            <div key={mensaje.id} className="mensaje-perfil">
              <div className="mensaje-perfil-encabezado">
                <Link to={`/usuario/${mensaje.usuario_id}`} className="mensaje-perfil-autor">
                  {mensaje.nombre_autor || 'Usuario'}
                  {mensaje.autor_es_admin && (
                    <span className="mensaje-perfil-badge-admin">Admin</span>
                  )}
                </Link>
                <span className="mensaje-perfil-fecha">
                  {new Date(mensaje.creado_en).toLocaleDateString('es-AR')}
                </span>
              </div>

              <p className="mensaje-perfil-contenido">{mensaje.contenido}</p>

              {puedeEliminar && (
                <button
                  type="button"
                  className="mensaje-perfil-eliminar"
                  onClick={() => manejarEliminar(mensaje.id)}
                >
                  Eliminar
                </button>
              )}
            </div>
          );
        })}

      {!cargando && hayMasMensajes && (
        <button
          type="button"
          className="muro-perfil-ver-mas"
          onClick={() => setExpandido((actual) => !actual)}
        >
          {expandido ? 'Ver menos' : `Ver más mensajes (${mensajes.length - MAXIMO_VISIBLE})`}
        </button>
      )}
    </div>
  );
}

export default MuroPerfil;
