import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './MiniCarruselFavoritos.css';

// Cada cuántos milisegundos avanza solo. Se implementa con un solo
// setTimeout que se vuelve a armar cada vez que cambia el índice (en vez
// de setInterval) — así, tanto un avance automático como un clic manual
// en ‹ › reinician el conteo por igual, sin tener dos mecanismos de
// tiempo corriendo en paralelo.
const INTERVALO_MS = 6000;

/*
  MiniCarruselFavoritos — nuevo en la Parte 16.
  -------------------------------------------------
  Muestra los juegos favoritos del usuario, de a uno, avanzando solo cada
  6 segundos — a diferencia de los otros carruseles del proyecto
  (CarruselCapturas, Parte 9; el que fue CarruselJuegosAgregados, Parte
  11), que solo avanzan con clic manual. Se pausa mientras el cursor está
  encima (pausado), para no hacer desaparecer un juego mientras se lo
  está leyendo.

  `favoritos` ya viene con la forma que espera este componente (id, name,
  background_image, genres) porque servicioFavoritos.obtenerFavoritos
  reconstruye ese formato desde el snapshot guardado en juego_data — no
  hace falta ningún adaptador acá.
*/
function MiniCarruselFavoritos({ favoritos }) {
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (favoritos.length <= 1 || pausado) return;

    const temporizador = setTimeout(() => {
      setIndice((actual) => (actual === favoritos.length - 1 ? 0 : actual + 1));
    }, INTERVALO_MS);

    return () => clearTimeout(temporizador);
  }, [indice, favoritos.length, pausado]);

  if (!favoritos || favoritos.length === 0) {
    return (
      <p className="mini-carrusel-favoritos-vacio">
        Todavía no tenés juegos favoritos. Marcá alguno desde el Catálogo.
      </p>
    );
  }

  const juego = favoritos[indice];
  const generos = juego.genres?.map((genero) => genero.name).join(', ');

  function irAnterior() {
    setIndice((actual) => (actual === 0 ? favoritos.length - 1 : actual - 1));
  }

  function irSiguiente() {
    setIndice((actual) => (actual === favoritos.length - 1 ? 0 : actual + 1));
  }

  return (
    <div
      className="mini-carrusel-favoritos"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="mini-carrusel-favoritos-visor">
        {favoritos.length > 1 && (
          <button
            type="button"
            className="mini-carrusel-favoritos-boton"
            onClick={irAnterior}
            aria-label="Favorito anterior"
          >
            ‹
          </button>
        )}

        <Link to={`/juego/${juego.id}`} className="mini-carrusel-favoritos-tarjeta">
          {juego.background_image ? (
            <img src={juego.background_image} alt={juego.name} />
          ) : (
            <div className="mini-carrusel-favoritos-sin-imagen">Sin imagen</div>
          )}
          <div className="mini-carrusel-favoritos-texto">
            <h3>{juego.name}</h3>
            {generos && <p>{generos}</p>}
          </div>
        </Link>

        {favoritos.length > 1 && (
          <button
            type="button"
            className="mini-carrusel-favoritos-boton"
            onClick={irSiguiente}
            aria-label="Favorito siguiente"
          >
            ›
          </button>
        )}
      </div>

      {favoritos.length > 1 && (
        <p className="mini-carrusel-favoritos-contador">
          {indice + 1} / {favoritos.length}
        </p>
      )}
    </div>
  );
}

export default MiniCarruselFavoritos;
