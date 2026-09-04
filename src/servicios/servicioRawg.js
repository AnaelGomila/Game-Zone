// Funciones que se comunican con la API de RAWG (https://rawg.io/apidocs).
// La clave se lee desde la variable de entorno VITE_RAWG_API_KEY (definida
// en la Parte 1), nunca se escribe a mano en el código.

const URL_BASE_RAWG = 'https://api.rawg.io/api';
const CLAVE_RAWG = import.meta.env.VITE_RAWG_API_KEY;

if (!CLAVE_RAWG) {
  console.error(
    'Falta la variable de entorno VITE_RAWG_API_KEY. Revisá tu archivo .env'
  );
}

async function manejarRespuesta(respuesta) {
  if (!respuesta.ok) {
    throw new Error(
      `Error al consultar la API de RAWG (código ${respuesta.status})`
    );
  }
  return respuesta.json();
}

/*
  obtenerJuegos — Parte 7: se agregan `orden` y `generoId` a las opciones
  (antes solo tenía `pagina` y `busqueda`, de la Parte 5).

  - `orden`: 'popular' (default, ordering=-added) o 'rating'
    (ordering=-rating). A diferencia de la Parte 5, ahora el orden elegido
    se aplica SIEMPRE, incluso con una búsqueda activa — antes, al buscar,
    se dejaba que RAWG ordenara por relevancia y se ignoraba cualquier
    orden. Se cambia a propósito: el desplegable "Ordenar por" de la
    Parte 7 no tendría sentido si dejara de funcionar apenas escribís algo
    en el buscador.
  - `generoId`: id de género de RAWG (ver obtenerGeneros más abajo) para
    filtrar el catálogo por categoría. Se manda como parámetro `genres`.
*/
export async function obtenerJuegos({ pagina = 1, busqueda = '', orden = 'popular', generoId = '' } = {}) {
  const parametros = new URLSearchParams({
    key: CLAVE_RAWG,
    page_size: '20',
    page: String(pagina),
    ordering: orden === 'rating' ? '-rating' : '-added',
  });

  const terminoLimpio = busqueda.trim();
  if (terminoLimpio) {
    parametros.set('search', terminoLimpio);
  }

  if (generoId) {
    parametros.set('genres', String(generoId));
  }

  const url = `${URL_BASE_RAWG}/games?${parametros.toString()}`;
  const respuesta = await fetch(url);
  const datos = await manejarRespuesta(respuesta);

  return {
    juegos: datos.results,
    hayPaginaSiguiente: Boolean(datos.next),
    hayPaginaAnterior: Boolean(datos.previous),
    // Cuántos juegos hay en total para este pedido (no solo esta
    // página) — RAWG lo trae de una en cada respuesta, así que no hace
    // falta ningún pedido extra. La usa Inicio.jsx para mostrar
    // "X juegos disponibles" en los números del proyecto.
    total: datos.count,
  };
}

export async function obtenerJuegoPorId(id) {
  const url = `${URL_BASE_RAWG}/games/${id}?key=${CLAVE_RAWG}`;
  const respuesta = await fetch(url);
  return manejarRespuesta(respuesta);
}

// Nuevo: capturas de pantalla de un juego puntual, para el carrusel del
// Detalle. Es un endpoint aparte del detalle normal (GET /games/{id}),
// documentado desde la Parte 7 pero nunca usado hasta ahora. Devuelve
// solo el array de capturas (cada una con "image", entre otros campos),
// que es lo único que necesita <CarruselCapturas>.
export async function obtenerCapturas(id) {
  const url = `${URL_BASE_RAWG}/games/${id}/screenshots?key=${CLAVE_RAWG}`;
  const respuesta = await fetch(url);
  const datos = await manejarRespuesta(respuesta);
  return datos.results;
}

// Nuevo en la Parte 7: lista de géneros reales de RAWG (Acción, RPG,
// Shooter, Estrategia, etc.), usada para armar las opciones del
// desplegable "Categoría" del Catálogo — en vez de inventar una lista
// fija a mano, que podría no coincidir con los géneros que los juegos
// tienen cargados de verdad en RAWG.
export async function obtenerGeneros() {
  const url = `${URL_BASE_RAWG}/genres?key=${CLAVE_RAWG}`;
  const respuesta = await fetch(url);
  const datos = await manejarRespuesta(respuesta);
  return datos.results.map((genero) => ({ id: genero.id, nombre: genero.name }));
}
