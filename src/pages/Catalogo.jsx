import { useEffect, useState } from 'react';
import { obtenerJuegos } from '../servicios/servicioRawg';
import TarjetaJuego from '../components/TarjetaJuego';
import '../styles/catalogo.css';
import '../styles/cargando.css';

/*
  Catalogo — sin cambios funcionales respecto a la Parte 5. Se incluye tal
  cual para que el ZIP de la Parte 6 quede completo (TarjetaJuego sigue
  funcionando igual acá: al no pasarle el prop `pie`, se renderiza como
  siempre).
*/
function Catalogo() {
  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const [busqueda, setBusqueda] = useState('');
  const [textoBuscador, setTextoBuscador] = useState('');

  const [pagina, setPagina] = useState(1);
  const [hayPaginaSiguiente, setHayPaginaSiguiente] = useState(false);
  const [hayPaginaAnterior, setHayPaginaAnterior] = useState(false);

  useEffect(() => {
    setCargando(true);
    setError('');

    obtenerJuegos({ pagina, busqueda })
      .then((resultado) => {
        setJuegos(resultado.juegos);
        setHayPaginaSiguiente(resultado.hayPaginaSiguiente);
        setHayPaginaAnterior(resultado.hayPaginaAnterior);
      })
      .catch((error) => {
        console.error('Error al traer juegos de RAWG:', error.message);

        const pareceLimiteDePedidos = error instanceof TypeError;
        setError(
          pareceLimiteDePedidos
            ? 'RAWG no respondió el pedido (puede ser el límite de pedidos por segundo). Esperá unos segundos y probá de nuevo.'
            : 'No se pudieron cargar los juegos. Probá de nuevo más tarde.'
        );
      })
      .finally(() => setCargando(false));
  }, [pagina, busqueda]);

  function manejarEnvioBusqueda(evento) {
    evento.preventDefault();
    setPagina(1);
    setBusqueda(textoBuscador);
  }

  function limpiarBusqueda() {
    setTextoBuscador('');
    setPagina(1);
    setBusqueda('');
  }

  return (
    <div className="catalogo">
      <h1>Catálogo de juegos</h1>

      <form className="catalogo-buscador" onSubmit={manejarEnvioBusqueda}>
        <input
          type="text"
          placeholder="Buscar juego por nombre..."
          value={textoBuscador}
          onChange={(evento) => setTextoBuscador(evento.target.value)}
        />
        <button type="submit">Buscar</button>
        {busqueda && (
          <button type="button" onClick={limpiarBusqueda}>
            Limpiar
          </button>
        )}
      </form>

      {busqueda && !cargando && !error && (
        <p className="catalogo-resultado-busqueda">
          Resultados para "{busqueda}"
        </p>
      )}

      {cargando && <p className="cargando">Cargando juegos...</p>}
      {error && <p className="catalogo-error">{error}</p>}

      {!cargando && !error && (
        <>
          {juegos.length === 0 ? (
            <p className="catalogo-sin-resultados">
              No se encontraron juegos para esa búsqueda.
            </p>
          ) : (
            <div className="catalogo-grid">
              {juegos.map((juego) => (
                <TarjetaJuego key={juego.id} juego={juego} />
              ))}
            </div>
          )}

          {(hayPaginaAnterior || hayPaginaSiguiente) && (
            <div className="catalogo-paginacion">
              <button
                type="button"
                disabled={!hayPaginaAnterior || cargando}
                onClick={() => setPagina((actual) => actual - 1)}
              >
                ← Anterior
              </button>
              <span>Página {pagina}</span>
              <button
                type="button"
                disabled={!hayPaginaSiguiente || cargando}
                onClick={() => setPagina((actual) => actual + 1)}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default Catalogo;
