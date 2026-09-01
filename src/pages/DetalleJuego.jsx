import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { obtenerJuegoPorId, obtenerCapturas } from '../servicios/servicioRawg';
import { obtenerJuegoLocalPublicoPorId } from '../servicios/servicioSugerencias';
import { esIdLocal, extraerIdReal } from '../servicios/adaptadorJuegoLocal';
import { traducirAlEspanol } from '../servicios/servicioTraduccion';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  esFavorito,
  agregarFavorito,
  quitarFavorito,
} from '../servicios/servicioFavoritos';
import CarruselCapturas from '../components/CarruselCapturas';
import ComentariosJuego from '../components/ComentariosJuego';
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
  DetalleJuego — Parte 9 (mejoras) + Parte 12 (soporta juegos locales).
  ------------------------------------------------------------------------
  El id que llega por la URL puede ser de dos tipos:
  - Un número: es un id de RAWG, se pide con obtenerJuegoPorId (como
    siempre desde la Parte 4).
  - "local-<uuid>": es una fila de la tabla `sugerencias` (un juego
    agregado por un admin, o una sugerencia de usuario ya aprobada — ver
    la sección "Agregados por la comunidad" en Catalogo.jsx), se pide con
    obtenerJuegoLocalPublicoPorId. esIdLocal()/extraerIdReal() son las
    mismas funciones de adaptadorJuegoLocal.js que arma esa sección para
    construir la URL de cada tarjeta.

  Diferencias cuando el juego es local (esLocal):
  - No hay traducción: el texto ya está en español (lo escribió un
    usuario o un admin), así que se salta directo ese paso sin llamar a
    MyMemory.
  - No hay botón de favoritos: la tabla `favoritos` guarda juego_id como
    el número de RAWG; mezclar ahí un id de otro esquema (uuid de
    `sugerencias`) complicaría esa tabla para un caso de uso chico. Se
    documenta como limitación conocida en vez de reformar favoritos.
  - No hay carrusel de capturas, ni desglose de opinión de la comunidad,
    ni tiempo de juego — son datos que solo existen en RAWG. Como esas
    secciones ya estaban armadas para no mostrarse si falta el dato, no
    hizo falta cambiar nada ahí: alcanza con no pedir capturas y con que
    juego.ratings/juego.playtime queden undefined para un juego local.
  - Los requisitos de PC salen directo de la fila (requisitos_minimos/
    requisitos_recomendados), en vez de buscarlos adentro de "platforms"
    como se hace con RAWG (los juegos locales no tienen esa estructura).
  - Se agrega un dato nuevo a la meta, "Agregado por" (nombre_autor,
    completado solo por un trigger de la base al crear la fila — ver
    sql/parte-12-catalogo-comunidad.sql), porque RAWG no tiene ese
    concepto y solo tiene sentido para estos juegos. Desde la Parte 13
    se respeta además la preferencia de anonimato del usuario
    (mostrar_autor): si pidió no mostrar su nombre al sugerir el juego,
    esta sección directamente no aparece en la vista pública — aunque
    nombre_autor siga guardado en la base para que el admin pueda verlo
    en AdminSugerencias con fines de moderación.

  La ruta /juego/:id sigue protegida con RutaPrivada (ver AppRouter.jsx),
  igual para juegos locales que para los de RAWG — no se hizo pública
  aunque el Catálogo sí lo sea, para mantener el mismo comportamiento que
  ya tenían los juegos de RAWG desde la Parte 3 (Catálogo público, Detalle
  privado).

  Parte 14: se agrega <ComentariosJuego> al final, debajo de todo lo
  demás. Funciona igual para juegos de RAWG y locales sin ninguna
  distinción — recibe juegoId={id} tal cual viene de la URL (numérico o
  con prefijo "local-"), porque comentarios_juego.juego_id es una columna
  de texto, no una referencia a ninguna tabla puntual.

  Parte 15: la traducción de la descripción deja de ser automática. Antes
  se pedía a MyMemory apenas cargaba el juego, gastando cuota diaria
  (5000 caracteres/día por IP) aunque nadie llegara a leer la
  descripción. Ahora se muestra siempre el texto original primero, y
  aparece un botón "Traducir al español" — recién ahí se pide la
  traducción, y una vez que llega, el mismo botón permite alternar entre
  ver el original o la traducción sin volver a pedir nada (el texto
  traducido queda guardado en descripcionTraducida). Este botón no
  aparece para juegos locales, que ya están en español.
*/
function DetalleJuego() {
  const { id } = useParams();
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const esLocal = esIdLocal(id);

  const [juego, setJuego] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [descripcionOriginal, setDescripcionOriginal] = useState('');
  const [descripcionTraducida, setDescripcionTraducida] = useState(null);
  const [mostrarTraduccion, setMostrarTraduccion] = useState(false);
  const [traduciendo, setTraduciendo] = useState(false);
  const [descripcionExpandida, setDescripcionExpandida] = useState(false);

  const [capturas, setCapturas] = useState([]);

  const [favoritoId, setFavoritoId] = useState(null);
  const [guardandoFavorito, setGuardandoFavorito] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError('');
    setDescripcionExpandida(false);

    const pedido = esLocal
      ? obtenerJuegoLocalPublicoPorId(extraerIdReal(id))
      : obtenerJuegoPorId(id);

    pedido
      .then((resultado) => setJuego(resultado))
      .catch((error) => {
        console.error('Error al traer el juego:', error.message);
        setError('No se pudo cargar este juego. Probá de nuevo más tarde.');
      })
      .finally(() => setCargando(false));
  }, [id, esLocal]);

  // Capturas de pantalla: solo existen para juegos de RAWG (endpoint
  // GET /games/{id}/screenshots). Para uno local, ni se pide.
  useEffect(() => {
    if (esLocal) {
      setCapturas([]);
      return;
    }

    obtenerCapturas(id)
      .then((resultado) => setCapturas(resultado))
      .catch((error) => {
        console.error('Error al traer las capturas de RAWG:', error.message);
        setCapturas([]);
      });
  }, [id, esLocal]);

  // Favoritos: no soportado para juegos locales (ver comentario de
  // cabecera) — directamente no se chequea nada.
  useEffect(() => {
    if (esLocal || !usuario) {
      setFavoritoId(null);
      return;
    }

    esFavorito(usuario.id, Number(id))
      .then((idExistente) => setFavoritoId(idExistente))
      .catch((error) => console.error('Error al chequear favorito:', error.message));
  }, [id, usuario, esLocal]);

  // Parte 15: la traducción dejó de ser automática. Acá solo se guarda el
  // texto original (en inglés para RAWG, ya en español para un juego
  // local) — traducir es una acción aparte que dispara el usuario con un
  // botón (manejarTraducir), para no gastar la cuota diaria de MyMemory
  // (5000 caracteres/día por IP, Parte 4) en juegos que nadie llega a leer
  // en detalle.
  useEffect(() => {
    const textoOriginal = esLocal ? juego?.descripcion : juego?.description_raw;
    setDescripcionOriginal(textoOriginal || '');
    setDescripcionTraducida(null);
    setMostrarTraduccion(false);
  }, [juego, esLocal]);

  async function manejarTraducir() {
    // Si ya se tradujo una vez para este juego, alternar entre las dos
    // versiones no vuelve a pedirle nada a MyMemory — el texto traducido
    // ya está guardado en descripcionTraducida.
    if (descripcionTraducida) {
      setMostrarTraduccion((actual) => !actual);
      return;
    }

    setTraduciendo(true);
    try {
      const texto = await traducirAlEspanol(descripcionOriginal);
      setDescripcionTraducida(texto);
      setMostrarTraduccion(true);
    } catch (error) {
      console.error('Error al traducir la descripción:', error.message);
      mostrarAlerta('No se pudo traducir la descripción. Probá de nuevo.', 'error');
    } finally {
      setTraduciendo(false);
    }
  }

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

  // A partir de acá, todo lo que varía según el origen del juego se
  // resuelve en estas pocas variables — el resto del JSX no vuelve a
  // preguntar "esLocal" salvo en los dos bloques que no existen para
  // nada (favorito y "Agregado por").
  const nombre = esLocal ? juego.nombre_juego : juego.name;
  const imagenFondo = esLocal ? juego.imagen_url : juego.background_image;
  const lanzamiento = esLocal ? juego.anio_lanzamiento : juego.released;

  const generos = esLocal
    ? juego.genero
    : juego.genres?.map((genero) => genero.name).join(', ');

  const plataformas = esLocal
    ? juego.plataforma
    : juego.platforms?.map((entrada) => entrada.platform?.name).filter(Boolean).join(', ');

  // Requisitos de sistema: en RAWG hay que buscarlos adentro de
  // "platforms" (solo la entrada de PC suele traerlos); en un juego
  // local ya están sueltos en la fila, no hace falta buscar nada.
  const requisitos = esLocal
    ? { minimum: juego.requisitos_minimos, recommended: juego.requisitos_recomendados }
    : juego.platforms?.find((entrada) => entrada.platform?.slug === 'pc')?.requirements;
  const hayRequisitos = requisitos && (requisitos.minimum || requisitos.recommended);

  // El texto a mostrar depende de si el usuario pidió la traducción y
  // ya está disponible — si no, se muestra siempre el original (nunca
  // se traduce sola).
  const textoDescripcion =
    !esLocal && mostrarTraduccion && descripcionTraducida
      ? descripcionTraducida
      : descripcionOriginal;

  const descripcionLarga = textoDescripcion.length > LARGO_MAXIMO_DESCRIPCION;

  // La imagen es distinta para cada juego, así que no puede vivir en un
  // archivo .css estático como el resto de los colores/estilos del
  // proyecto — por eso, y solo por eso, va como estilo inline acá. El
  // degradado que la oscurece y la funde con el fondo SÍ está en
  // detalleJuego.css, con las variables de color de siempre.
  const estiloHero = imagenFondo ? { backgroundImage: `url(${imagenFondo})` } : undefined;

  return (
    <div className="detalle-juego">
      <div className="detalle-juego-hero" style={estiloHero}>
        <div className="detalle-juego-hero-contenido">
          <Link to="/catalogo" className="detalle-juego-volver">
            ← Volver al catálogo
          </Link>

          <div className="detalle-juego-titulo">
            <h1>{nombre}</h1>

            {/* Favoritos no está disponible para juegos locales (ver
                comentario de cabecera). RutaPrivada ya garantiza que solo
                se llega acá logueado cuando SÍ aplica, así que usuario
                siempre existe en ese caso. */}
            {!esLocal && (
              <button
                type="button"
                className={
                  favoritoId ? 'detalle-juego-favorito activo' : 'detalle-juego-favorito'
                }
                onClick={manejarFavorito}
                disabled={guardandoFavorito}
              >
                {favoritoId ? '★ En favoritos' : '☆ Agregar a favoritos'}
              </button>
            )}
          </div>

          <div className="detalle-juego-meta">
            {lanzamiento && (
              <div className="detalle-juego-meta-item">
                <span className="detalle-juego-meta-etiqueta">Lanzamiento</span>
                <span className="detalle-juego-meta-valor">{lanzamiento}</span>
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
            {esLocal && juego.nombre_autor && juego.mostrar_autor && (
              <div className="detalle-juego-meta-item">
                <span className="detalle-juego-meta-etiqueta">Agregado por</span>
                <span className="detalle-juego-meta-valor">
                  <Link to={`/usuario/${juego.usuario_id}`}>{juego.nombre_autor}</Link>
                </span>
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
          <p>{textoDescripcion || 'Este juego todavía no tiene descripción.'}</p>
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

        {/* Parte 15: traducción bajo demanda, no automática — el botón
            no aparece para juegos locales (ya están en español) ni si no
            hay ninguna descripción cargada. */}
        {!esLocal && descripcionOriginal && (
          <button
            type="button"
            className="detalle-juego-traducir"
            onClick={manejarTraducir}
            disabled={traduciendo}
          >
            {traduciendo
              ? 'Traduciendo...'
              : mostrarTraduccion
                ? 'Ver original (inglés)'
                : 'Traducir al español'}
          </button>
        )}

        <CarruselCapturas capturas={capturas} nombreJuego={nombre} />

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

        <ComentariosJuego juegoId={id} />
      </div>
    </div>
  );
}

export default DetalleJuego;
