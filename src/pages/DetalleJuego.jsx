import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerJuegoPorId } from '../servicios/servicioRawg';
import { traducirAlEspanol } from '../servicios/servicioTraduccion';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  esFavorito,
  agregarFavorito,
  quitarFavorito,
} from '../servicios/servicioFavoritos';
import '../styles/detalleJuego.css';
import '../styles/cargando.css';

/*
  DetalleJuego — Parte 6: agrega el botón de favorito, pendiente desde la
  Parte 4 ("depende de la tabla favoritos... conviene resolver junto con
  la pantalla Favoritos completa").

  favoritoId guarda el id de la fila en `favoritos` si el juego ya está
  marcado (null si no). Se resuelve con un pedido aparte (esFavorito) en
  un useEffect que depende de [id, usuario], separado del useEffect que
  trae el juego — así, si cambia el usuario (login/logout) sin cambiar de
  juego, se revisa igual si hay que actualizar el estado del botón.

  Parte 7: el bloque de arriba (título + meta + botón de favorito) pasa a
  ser un "hero" con la imagen del juego de fondo, ocupando más o menos el
  primer tercio de la pantalla y oscureciéndose con un degradado hacia
  abajo hasta fundirse con el fondo sólido normal — el efecto de la
  referencia que se pasó. Antes la imagen era un bloque rectangular
  arriba del título; ahora es el fondo detrás de todo ese bloque.
*/
function DetalleJuego() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [juego, setJuego] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [descripcion, setDescripcion] = useState('');
  const [traduciendo, setTraduciendo] = useState(false);

  const [favoritoId, setFavoritoId] = useState(null);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError('');

    obtenerJuegoPorId(id)
      .then((resultado) => setJuego(resultado))
      .catch((error) => {
        console.error('Error al traer el juego de RAWG:', error.message);
        setError('No se pudo cargar este juego. Probá de nuevo más tarde.');
      })
      .finally(() => setCargando(false));
  }, [id]);

  useEffect(() => {
    if (!usuario) {
      setFavoritoId(null);
      return;
    }

    esFavorito(usuario.id, Number(id))
      .then((idExistente) => setFavoritoId(idExistente))
      .catch((error) => console.error('Error al chequear favorito:', error.message));
  }, [id, usuario]);

  // RAWG devuelve la descripción en inglés (así está cargada en su base).
  // Se muestra primero el texto original para no dejar la pantalla en
  // blanco, y en paralelo se pide la traducción a MyMemory; cuando llega,
  // reemplaza el texto. Si la traducción falla (sin conexión, cuota diaria
  // agotada, etc.) se deja el texto en inglés en vez de romper la pantalla.
  useEffect(() => {
    if (!juego?.description_raw) {
      setDescripcion('');
      return;
    }

    setDescripcion(juego.description_raw);
    setTraduciendo(true);

    traducirAlEspanol(juego.description_raw)
      .then((texto) => setDescripcion(texto))
      .catch((error) => {
        console.error('Error al traducir la descripción:', error.message);
      })
      .finally(() => setTraduciendo(false));
  }, [juego]);

  async function manejarFavorito() {
    if (!juego) return;
    setGuardandoFavorito(true);

    try {
      if (favoritoId) {
        await quitarFavorito(favoritoId);
        setFavoritoId(null);
        mostrarAlerta('Juego quitado de favoritos.', 'info');
      } else {
        const nuevoId = await agregarFavorito(usuario.id, juego);
        setFavoritoId(nuevoId);
        mostrarAlerta('Juego agregado a favoritos.', 'exito');
      }
    } catch (error) {
      console.error('Error al actualizar favorito:', error.message);
      mostrarAlerta('No se pudo actualizar favoritos. Probá de nuevo.', 'error');
    } finally {
      setGuardandoFavorito(false);
    }
  }

  if (cargando) {
    return <p className="cargando">Cargando juego...</p>;
  }

  if (error) {
    return <p className="detalle-juego-error">{error}</p>;
  }

  if (!juego) {
    return null;
  }

  const generos = juego.genres?.map((genero) => genero.name).join(', ');
  const plataformas = juego.platforms
    ?.map((entrada) => entrada.platform.name)
    .join(', ');

  // La imagen es distinta para cada juego, así que no puede vivir en un
  // archivo .css estático como el resto de los colores/estilos del
  // proyecto — por eso, y solo por eso, va como estilo inline acá. El
  // degradado que la oscurece y la funde con el fondo SÍ está en
  // detalleJuego.css, con las variables de color de siempre.
  const estiloHero = juego.background_image
    ? { backgroundImage: `url(${juego.background_image})` }
    : undefined;

  return (
    <div className="detalle-juego">
      <div className="detalle-juego-hero" style={estiloHero}>
        <div className="detalle-juego-hero-contenido">
          <Link to="/catalogo" className="detalle-juego-volver">
            ← Volver al catálogo
          </Link>

          <div className="detalle-juego-titulo">
            <h1>{juego.name}</h1>

            {/* RutaPrivada ya garantiza que solo se llega acá logueado, así
                que usuario siempre existe cuando esto se renderiza. */}
            <button
              type="button"
              className={favoritoId ? 'detalle-juego-favorito activo' : 'detalle-juego-favorito'}
              onClick={manejarFavorito}
              disabled={guardandoFavorito}
            >
              {favoritoId ? '★ En favoritos' : '☆ Agregar a favoritos'}
            </button>
          </div>

          <div className="detalle-juego-meta">
            {juego.released && <span>Lanzamiento: {juego.released}</span>}
            {juego.rating > 0 && <span>Rating: ★ {juego.rating}</span>}
            {generos && <span>Géneros: {generos}</span>}
            {plataformas && <span>Plataformas: {plataformas}</span>}
          </div>
        </div>
      </div>

      <div className="detalle-juego-cuerpo">
        <p>{descripcion || 'Este juego todavía no tiene descripción.'}</p>
        {traduciendo && (
          <p className="detalle-juego-traduciendo">Traduciendo descripción...</p>
        )}
      </div>
    </div>
  );
}

export default DetalleJuego;
