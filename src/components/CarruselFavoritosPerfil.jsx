import { useEffect, useState } from 'react';
import TarjetaJuego from './TarjetaJuego';
import './CarruselFavoritosPerfil.css';

const INTERVALO_MS = 6000;
const POR_PAGINA = 2;

function CarruselFavoritosPerfil({ favoritos }) {
  const totalPaginas = Math.ceil((favoritos?.length || 0) / POR_PAGINA);
  const [pagina, setPagina] = useState(0);
  const [pausado, setPausado] = useState(false);

  useEffect(() => {
    if (totalPaginas <= 1 || pausado) return;

    const temporizador = setTimeout(() => {
      setPagina((actual) => (actual === totalPaginas - 1 ? 0 : actual + 1));
    }, INTERVALO_MS);

    return () => clearTimeout(temporizador);
  }, [pagina, totalPaginas, pausado]);

  if (!favoritos || favoritos.length === 0) {
    return (
      <p className="carrusel-favoritos-perfil-vacio">
        Todavía no tiene juegos favoritos.
      </p>
    );
  }

  const inicio = pagina * POR_PAGINA;
  const visibles = favoritos.slice(inicio, inicio + POR_PAGINA);

  function irAnterior() {
    setPagina((actual) => (actual === 0 ? totalPaginas - 1 : actual - 1));
  }

  function irSiguiente() {
    setPagina((actual) => (actual === totalPaginas - 1 ? 0 : actual + 1));
  }

  return (
    <div
      className="carrusel-favoritos-perfil"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div className="carrusel-favoritos-perfil-visor">
        {totalPaginas > 1 && (
          <button
            type="button"
            className="carrusel-favoritos-perfil-boton"
            onClick={irAnterior}
            aria-label="Favoritos anteriores"
          >
            ‹
          </button>
        )}

        <div className="carrusel-favoritos-perfil-grilla">
          {visibles.map((juego) => (
            <TarjetaJuego key={juego.id} juego={juego} />
          ))}
        </div>

        {totalPaginas > 1 && (
          <button
            type="button"
            className="carrusel-favoritos-perfil-boton"
            onClick={irSiguiente}
            aria-label="Favoritos siguientes"
          >
            ›
          </button>
        )}
      </div>

      {totalPaginas > 1 && (
        <p className="carrusel-favoritos-perfil-contador">
          {pagina + 1} / {totalPaginas}
        </p>
      )}
    </div>
  );
}

export default CarruselFavoritosPerfil;
