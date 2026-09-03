import { useEffect, useState } from 'react';
import { obtenerJuegos } from '../servicios/servicioRawg';
import JuegoAdivinanza from '../components/JuegoAdivinanza';
import '../styles/minijuegos.css';
import '../styles/cargando.css';

const MODOS = [
  { id: 'portada', etiqueta: 'Trivia con portadas' },
  { id: 'captura', etiqueta: 'Adiviná con la captura' },
];

/*
  Minijuegos — nuevo.
  ----------------------
  Dos modos de un mismo juego de adivinanza (ver JuegoAdivinanza.jsx):
  mostrar la carátula o una captura borrosa de un juego, y elegir el
  nombre correcto entre 4 opciones. Pantalla pública (no pide login),
  mismo criterio que el Catálogo — es contenido para divertirse, no
  datos de ningún usuario.

  El "mazo" de juegos candidatos se arma acá, UNA sola vez al entrar,
  combinando la primera página de populares y la primera de mejor
  valorados (mismos dos criterios de orden que ya usa el Catálogo desde
  la Parte 7) — sin duplicados, y filtrando los que no tienen carátula
  (hace falta sí o sí para el modo "portada", y sirve de respaldo en el
  modo "captura" si un juego no tiene screenshots). Se pasa como prop a
  <JuegoAdivinanza>, así cambiar de pestaña entre los dos modos no
  dispara ningún pedido nuevo a RAWG — se resetea el juego (puntaje,
  pregunta actual) gracias al key={modo}, un truco simple de React: al
  cambiar el key, el componente se trata como uno nuevo en vez de
  reusarse, así no hace falta un efecto aparte para reiniciar todo el
  estado a mano.
*/
function Minijuegos() {
  const [pool, setPool] = useState([]);
  const [cargandoPool, setCargandoPool] = useState(true);
  const [modo, setModo] = useState('portada');

  useEffect(() => {
    Promise.all([
      obtenerJuegos({ pagina: 1, orden: 'popular' }),
      obtenerJuegos({ pagina: 1, orden: 'rating' }),
    ])
      .then(([populares, mejorValorados]) => {
        const combinados = [...populares.juegos, ...mejorValorados.juegos];
        const sinDuplicados = Array.from(
          new Map(combinados.map((juego) => [juego.id, juego])).values()
        ).filter((juego) => juego.background_image);

        setPool(sinDuplicados);
      })
      .catch((error) => console.error('Error al armar el mazo de juegos:', error.message))
      .finally(() => setCargandoPool(false));
  }, []);

  return (
    <div className="minijuegos">
      <h1>Minijuegos</h1>
      <p className="minijuegos-ayuda">
        Juegos populares y mejor valorados de RAWG — elegí un modo y probá
        cuánto sabés.
      </p>

      <div className="minijuegos-tabs">
        {MODOS.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className={modo === opcion.id ? 'activo' : ''}
            onClick={() => setModo(opcion.id)}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </div>

      {cargandoPool ? (
        <p className="cargando">Preparando el mazo de juegos...</p>
      ) : (
        <JuegoAdivinanza key={modo} modo={modo} pool={pool} />
      )}
    </div>
  );
}

export default Minijuegos;
