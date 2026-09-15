import { useState } from 'react';
import './CarruselCapturas.css';

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
