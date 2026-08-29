import { useState } from 'react';
import './CarruselCapturas.css';

/*
  CarruselCapturas — nuevo.
  -------------------------
  Muestra de a una las capturas de pantalla que devuelve RAWG para un
  juego (endpoint GET /games/{id}/screenshots, servicioRawg.obtenerCapturas).
  Solo lo usa DetalleJuego, así que vive como componente separado nada
  más que para no ensuciar ese archivo con la lógica del carrusel — no
  se reutiliza en ninguna otra pantalla.

  Es intencionalmente simple: un solo useState con el índice de la
  captura actual, dos botones que suman/restan 1 (con wraparound: desde
  la última vuelve a la primera y viceversa), y un contador de texto
  ("3 / 8"). No se armó con librerías de carrusel ni con swipe táctil,
  para mantenerlo fácil de explicar.
*/
function CarruselCapturas({ capturas, nombreJuego }) {
  const [indice, setIndice] = useState(0);

  if (!capturas || capturas.length === 0) {
    return null;
  }

  function irAnterior() {
    setIndice((actual) => (actual === 0 ? capturas.length - 1 : actual - 1));
  }

  function irSiguiente() {
    setIndice((actual) => (actual === capturas.length - 1 ? 0 : actual + 1));
  }

  return (
    <div className="carrusel-capturas">
      <h2>Capturas de pantalla</h2>

      <div className="carrusel-capturas-visor">
        <button
          type="button"
          className="carrusel-capturas-boton"
          onClick={irAnterior}
          aria-label="Captura anterior"
        >
          ‹
        </button>

        <img
          src={capturas[indice].image}
          alt={`Captura de pantalla ${indice + 1} de ${capturas.length} de ${nombreJuego}`}
        />

        <button
          type="button"
          className="carrusel-capturas-boton"
          onClick={irSiguiente}
          aria-label="Captura siguiente"
        >
          ›
        </button>
      </div>

      <p className="carrusel-capturas-contador">
        {indice + 1} / {capturas.length}
      </p>
    </div>
  );
}

export default CarruselCapturas;
