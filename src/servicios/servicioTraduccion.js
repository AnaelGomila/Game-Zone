// Traduce texto del inglés al español usando la API gratuita de MyMemory
// (https://mymemory.translated.net/doc/spec.php). Sin cambios respecto a
// la Parte 4. Se incluye tal cual para que el ZIP de la Parte 6 quede
// completo.

const URL_MYMEMORY = 'https://api.mymemory.translated.net/get';
const LIMITE_CARACTERES_POR_FRAGMENTO = 450;

function dividirEnFragmentos(texto) {
  const fragmentos = [];
  let restante = texto.trim();

  while (restante.length > 0) {
    if (restante.length <= LIMITE_CARACTERES_POR_FRAGMENTO) {
      fragmentos.push(restante);
      break;
    }

    let corte = restante.lastIndexOf('. ', LIMITE_CARACTERES_POR_FRAGMENTO);
    corte = corte === -1 ? LIMITE_CARACTERES_POR_FRAGMENTO : corte + 1;

    fragmentos.push(restante.slice(0, corte).trim());
    restante = restante.slice(corte).trim();
  }

  return fragmentos;
}

async function traducirFragmento(fragmento) {
  const url = `${URL_MYMEMORY}?q=${encodeURIComponent(fragmento)}&langpair=en|es`;
  const respuesta = await fetch(url);

  if (!respuesta.ok) {
    throw new Error(`Error al traducir (código ${respuesta.status})`);
  }

  const datos = await respuesta.json();
  return datos.responseData?.translatedText || fragmento;
}

export async function traducirAlEspanol(texto) {
  if (!texto) return texto;

  const fragmentos = dividirEnFragmentos(texto);
  const traducidos = [];

  for (const fragmento of fragmentos) {
    const traduccion = await traducirFragmento(fragmento);
    traducidos.push(traduccion);
  }

  return traducidos.join(' ');
}
