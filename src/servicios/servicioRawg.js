// Funciones que se comunican con la API de RAWG (https://rawg.io/apidocs).
// La clave se lee desde la variable de entorno VITE_RAWG_API_KEY (definida
// en la Parte 1), nunca se escribe a mano en el código.
//
// Sin cambios respecto a la Parte 5. Se incluye tal cual para que el ZIP
// de la Parte 6 quede completo.

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

export async function obtenerJuegos({ pagina = 1, busqueda = '' } = {}) {
  const parametros = new URLSearchParams({
    key: CLAVE_RAWG,
    page_size: '20',
    page: String(pagina),
  });

  const terminoLimpio = busqueda.trim();
  if (terminoLimpio) {
    parametros.set('search', terminoLimpio);
  } else {
    parametros.set('ordering', '-added');
  }

  const url = `${URL_BASE_RAWG}/games?${parametros.toString()}`;
  const respuesta = await fetch(url);
  const datos = await manejarRespuesta(respuesta);

  return {
    juegos: datos.results,
    hayPaginaSiguiente: Boolean(datos.next),
    hayPaginaAnterior: Boolean(datos.previous),
  };
}

export async function obtenerJuegoPorId(id) {
  const url = `${URL_BASE_RAWG}/games/${id}?key=${CLAVE_RAWG}`;
  const respuesta = await fetch(url);
  return manejarRespuesta(respuesta);
}
