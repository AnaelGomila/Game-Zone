import { useState } from 'react';
import { Link } from 'react-router-dom';
import TarjetaJuego from './TarjetaJuego';
import './CarruselInicio.css';

const POR_PAGINA = 3;

/*
  CarruselInicio — nuevo.
  ---------------------------
  Carrusel reutilizable para las dos secciones de juegos del Inicio
  (destacados y agregados por la comunidad) — mismo componente para las
  dos, cambia solo qué datos y qué link "Ver más" recibe por prop. Igual
  que el resto de los carruseles del proyecto, reusa <TarjetaJuego> tal
  cual (mismo look que el Catálogo).

  Paginación manual con ‹ › (sin avance automático, a diferencia del
  carrusel de favoritos del Perfil) — acá alcanza con lo simple, es
  contenido de exploración, no algo que convenga que se mueva solo.
*/
function CarruselInicio({ titulo, juegos, cargando, enlace, textoEnlace }) {
  const [pagina, setPagina] = useState(0);
  const totalPaginas = Math.ceil((juegos?.length || 0) / POR_PAGINA);

  function irAnterior() {
    setPagina((actual) => (actual === 0 ? totalPaginas - 1 : actual - 1));
  }

  function irSiguiente() {
    setPagina((actual) => (actual === totalPaginas - 1 ? 0 : actual + 1));
  }

  const inicio = pagina * POR_PAGINA;
  const visibles = juegos?.slice(inicio, inicio + POR_PAGINA) || [];

  return (
    <div className="carrusel-inicio">
      <div className="carrusel-inicio-encabezado">
        <h2>{titulo}</h2>
        <Link to={enlace} className="carrusel-inicio-ver-mas">
          {textoEnlace} →
        </Link>
      </div>

      {cargando && <p className="cargando">Cargando...</p>}

      {!cargando && (!juegos || juegos.length === 0) && (
        <p className="carrusel-inicio-vacio">Todavía no hay nada acá.</p>
      )}

      {!cargando && juegos && juegos.length > 0 && (
        <div className="carrusel-inicio-visor">
          {totalPaginas > 1 && (
            <button
              type="button"
              className="carrusel-inicio-boton"
              onClick={irAnterior}
              aria-label="Anteriores"
            >
              ‹
            </button>
          )}

          <div className="carrusel-inicio-grilla">
            {visibles.map((juego) => (
              <TarjetaJuego key={juego.id} juego={juego} />
            ))}
          </div>

          {totalPaginas > 1 && (
            <button
              type="button"
              className="carrusel-inicio-boton"
              onClick={irSiguiente}
              aria-label="Siguientes"
            >
              ›
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default CarruselInicio;
