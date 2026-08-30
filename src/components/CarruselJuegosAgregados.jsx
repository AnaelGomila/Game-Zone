import { useState } from 'react';
import './CarruselJuegosAgregados.css';

/*
  CarruselJuegosAgregados — nuevo en la Parte 11.
  --------------------------------------------------
  Mismo patrón de navegación que <CarruselCapturas> (Parte 9): un solo
  useState con el índice actual, dos botones ‹ › con wraparound, y un
  contador de texto. La diferencia es qué se muestra en cada "slide": acá
  no son fotos a pantalla completa, sino una tarjeta compacta con
  miniatura + nombre + género/año/plataforma — porque esto vive dentro
  de la tarjeta angosta del Perfil (perfil.css, max-width: 480px), no en
  una pantalla completa como el Detalle de juego.
*/
function CarruselJuegosAgregados({ juegos }) {
  const [indice, setIndice] = useState(0);

  if (!juegos || juegos.length === 0) {
    return (
      <p className="carrusel-juegos-agregados-vacio">
        Todavía no agregaste ningún juego.
      </p>
    );
  }

  const juego = juegos[indice];

  function irAnterior() {
    setIndice((actual) => (actual === 0 ? juegos.length - 1 : actual - 1));
  }

  function irSiguiente() {
    setIndice((actual) => (actual === juegos.length - 1 ? 0 : actual + 1));
  }

  return (
    <div className="carrusel-juegos-agregados">
      <div className="carrusel-juegos-agregados-visor">
        {juegos.length > 1 && (
          <button
            type="button"
            className="carrusel-juegos-agregados-boton"
            onClick={irAnterior}
            aria-label="Juego anterior"
          >
            ‹
          </button>
        )}

        <div className="carrusel-juegos-agregados-tarjeta">
          {juego.imagen_url && (
            <img src={juego.imagen_url} alt={juego.nombre_juego} />
          )}
          <div className="carrusel-juegos-agregados-texto">
            <h3>{juego.nombre_juego}</h3>
            <p>
              {[juego.genero, juego.anio_lanzamiento, juego.plataforma]
                .filter(Boolean)
                .join(' · ')}
            </p>
          </div>
        </div>

        {juegos.length > 1 && (
          <button
            type="button"
            className="carrusel-juegos-agregados-boton"
            onClick={irSiguiente}
            aria-label="Juego siguiente"
          >
            ›
          </button>
        )}
      </div>

      {juegos.length > 1 && (
        <p className="carrusel-juegos-agregados-contador">
          {indice + 1} / {juegos.length}
        </p>
      )}
    </div>
  );
}

export default CarruselJuegosAgregados;
