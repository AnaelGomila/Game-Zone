import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerJuegoPorId, obtenerCapturas } from '../servicios/servicioRawg';
import { traducirAlEspanol } from '../servicios/servicioTraduccion';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  esFavorito,
  agregarFavorito,
  quitarFavorito,
} from '../servicios/servicioFavoritos';
import CarruselCapturas from '../components/CarruselCapturas';
import '../styles/detalleJuego.css';
import '../styles/cargando.css';

// A partir de cuántos caracteres la descripción se recorta y aparece el
// botón "Ver más". Es una constante simple (no una regla de negocio
// compleja), así que vive acá arriba en vez de en un archivo aparte.
const LARGO_MAXIMO_DESCRIPCION = 400;

// RAWG devuelve el desglose de opinión de la comunidad con estos cuatro
// títulos en inglés y en minúscula ("exceptional", "recommended", "meh",
// "skip"). Se traducen acá con un mapa simple en vez de una librería de
// i18n — es la misma idea que ya se usa para traducir la descripción,
// pero al ser 4 valores fijos no hace falta llamar a ningún servicio.
const ETIQUETAS_RATING = {
  exceptional: 'Excelente',
  recommended: 'Recomendado',
  meh: 'Regular',
  skip: 'Para evitar',
};

function traducirTituloRating(titulo) {
  return ETIQUETAS_RATING[titulo] || titulo;
}

/*
  DetalleJuego — Parte 9: mejoras varias sobre la versión de la Parte 7.

  1. La fila de meta (Lanzamiento/Rating/Géneros/Plataformas) pasa de una
     sola línea con flex-wrap a una grilla de "ítems" con etiqueta +
     valor. Antes, con juegos que tienen muchas plataformas, todo quedaba
     apretado en una sola fila difícil de leer. Ahora "Plataformas" ocupa
     su propia fila completa (grid-column: 1 / -1 en el CSS) en vez de
     competir por espacio con el resto. De paso se suma "Tiempo promedio"
     (juego.playtime), que ya venía en la respuesta de RAWG y no se
     mostraba.

  2. La descripción se recorta a una altura máxima con un botón
     "Ver más"/"Ver menos" cuando supera los LARGO_MAXIMO_DESCRIPCION
     caracteres. descripcionExpandida se reinicia a false cada vez que
     cambia el id (juego nuevo), para no arrancar ya expandido si se
     navega de un juego a otro.

  3. Se agrega el carrusel de capturas de pantalla (<CarruselCapturas>),
     pedido con un endpoint aparte (obtenerCapturas) en su propio
     useEffect — no viene en el mismo pedido que el detalle del juego.

  4. Se agrega el desglose de opinión de la comunidad (juego.ratings:
     Exceptional/Recommended/Meh/Skip con porcentaje), como barras.

  5. Se agregan los requisitos de PC (mínimos y recomendados), leyendo
     platforms[].requirements de la entrada cuyo platform.slug es 'pc'.
     RAWG no siempre carga este dato para todas las plataformas —
     generalmente solo para PC, así que si no hay entrada de PC o no
     tiene requirements, la sección directamente no se muestra.
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
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);

  const [capturas, setCapturas] = useState([]);

  const [favoritoId, setFavoritoId] = useState(null);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError('');
    setDescripcionExpandida(false);

    obtenerJuegoPorId(id)
      .then((resultado) => setJuego(resultado))
      .catch((error) => {
        console.error('Error al traer el juego de RAWG:', error.message);
        setError('No se pudo cargar este juego. Probá de nuevo más tarde.');
      })
      .finally(() => setCargando(false));
  }, [id]);

  // Pedido aparte del detalle principal: GET /games/{id}/screenshots.
  // Si falla, se deja el carrusel vacío (no se muestra) en vez de romper
  // el resto de la pantalla — el resto del Detalle no depende de esto.
  useEffect(() => {
    obtenerCapturas(id)
      .then((resultado) => setCapturas(resultado))
      .catch((error) => {
        console.error('Error al traer las capturas de RAWG:', error.message);
        setCapturas([]);
      });
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
    ?.map((entrada) => entrada.platform?.name)
    .filter(Boolean)
    .join(', ');

  // Requisitos de sistema: solo RAWG suele cargarlos para la entrada de
  // PC (slug 'pc'); en consolas normalmente no existen, así que no hay
  // nada raro en que esta sección no aparezca para muchos juegos.
  const entradaPC = juego.platforms?.find((entrada) => entrada.platform?.slug === 'pc');
  const requisitos = entradaPC?.requirements;
  const hayRequisitos = requisitos && (requisitos.minimum || requisitos.recommended);

  const descripcionLarga = descripcion.length > LARGO_MAXIMO_DESCRIPCION;

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
            {juego.released && (
              <div className="detalle-juego-meta-item">
                <span className="detalle-juego-meta-etiqueta">Lanzamiento</span>
                <span className="detalle-juego-meta-valor">{juego.released}</span>
              </div>
            )}
            {juego.rating > 0 && (
              <div className="detalle-juego-meta-item">
                <span className="detalle-juego-meta-etiqueta">Rating</span>
                <span className="detalle-juego-meta-valor">★ {juego.rating}</span>
              </div>
            )}
            {juego.playtime > 0 && (
              <div className="detalle-juego-meta-item">
                <span className="detalle-juego-meta-etiqueta">Tiempo promedio</span>
                <span className="detalle-juego-meta-valor">{juego.playtime} hs</span>
              </div>
            )}
            {generos && (
              <div className="detalle-juego-meta-item">
                <span className="detalle-juego-meta-etiqueta">Géneros</span>
                <span className="detalle-juego-meta-valor">{generos}</span>
              </div>
            )}
            {plataformas && (
              <div className="detalle-juego-meta-item detalle-juego-meta-item-ancho">
                <span className="detalle-juego-meta-etiqueta">Plataformas</span>
                <span className="detalle-juego-meta-valor">{plataformas}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="detalle-juego-cuerpo">
        <div
          className={
            !descripcionExpandida && descripcionLarga
              ? 'detalle-juego-descripcion recortada'
              : 'detalle-juego-descripcion'
          }
        >
          <p>{descripcion || 'Este juego todavía no tiene descripción.'}</p>
        </div>

        {descripcionLarga && (
          <button
            type="button"
            className="detalle-juego-ver-mas"
            onClick={() => setDescripcionExpandida((actual) => !actual)}
          >
            {descripcionExpandida ? 'Ver menos' : 'Ver más'}
          </button>
        )}

        {traduciendo && (
          <p className="detalle-juego-traduciendo">Traduciendo descripción...</p>
        )}

        <CarruselCapturas capturas={capturas} nombreJuego={juego.name} />

        {juego.ratings?.length > 0 && (
          <div className="detalle-juego-ratings">
            <h2>Opinión de la comunidad</h2>
            {juego.ratings.map((valoracion) => (
              <div key={valoracion.id} className="detalle-juego-ratings-fila">
                <span className="detalle-juego-ratings-etiqueta">
                  {traducirTituloRating(valoracion.title)}
                </span>
                <div className="detalle-juego-ratings-barra">
                  <div
                    className="detalle-juego-ratings-barra-relleno"
                    style={{ width: `${valoracion.percent}%` }}
                  />
                </div>
                <span className="detalle-juego-ratings-porcentaje">
                  {valoracion.percent}%
                </span>
              </div>
            ))}
          </div>
        )}

        {hayRequisitos && (
          <div className="detalle-juego-requisitos">
            <h2>Requisitos de PC</h2>
            <div className="detalle-juego-requisitos-grid">
              {requisitos.minimum && (
                <div>
                  <h3>Mínimos</h3>
                  <p>{requisitos.minimum}</p>
                </div>
              )}
              {requisitos.recommended && (
                <div>
                  <h3>Recomendados</h3>
                  <p>{requisitos.recommended}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DetalleJuego;
