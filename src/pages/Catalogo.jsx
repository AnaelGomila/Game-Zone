import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { obtenerJuegos, obtenerGeneros } from '../servicios/servicioRawg';
import TarjetaJuego from '../components/TarjetaJuego';
import '../styles/catalogo.css';
import '../styles/cargando.css';

/*
  Catalogo — Parte 7: filtros nuevos (orden + categoría) y búsqueda movida
  a la URL.
  ---------------------------------------------------------------------------
  Cambio de fondo respecto a la Parte 5: el buscador propio de esta
  pantalla desapareció (ahora es global, vive en <BarraSuperior>). Todo el
  estado de "qué se está mostrando" pasó a vivir en los query params de la
  URL (?busqueda=&orden=&genero=&pagina=) en vez de en useState local. Dos
  ventajas: la barra superior y esta pantalla quedan sincronizadas sin
  tener que pasarse props ni usar otro Context, y la URL queda
  compartible/recargable con los mismos filtros aplicados.

  orden: 'popular' (default) | 'rating' — desplegable "Ordenar por".
  genero: id de género de RAWG, o '' para "Todas" — desplegable
  "Categoría", con las opciones pedidas a obtenerGeneros() (Parte 7).
*/
function Catalogo() {
  const [searchParams, setSearchParams] = useSearchParams();

  const busqueda = searchParams.get('busqueda') || '';
  const orden = searchParams.get('orden') || 'popular';
  const generoId = searchParams.get('genero') || '';
  const pagina = Number(searchParams.get('pagina')) || 1;

  const [juegos, setJuegos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [hayPaginaSiguiente, setHayPaginaSiguiente] = useState(false);
  const [hayPaginaAnterior, setHayPaginaAnterior] = useState(false);

  const [generos, setGeneros] = useState([]);

  useEffect(() => {
    obtenerGeneros()
      .then((resultado) => setGeneros(resultado))
      .catch((error) => console.error('Error al traer géneros:', error.message));
  }, []);

  useEffect(() => {
    setCargando(true);
    setError('');

    obtenerJuegos({ pagina, busqueda, orden, generoId })
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pagina, busqueda, orden, generoId]);

  function actualizarParametro(clave, valor) {
    const nuevos = new URLSearchParams(searchParams);
    if (valor) {
      nuevos.set(clave, valor);
    } else {
      nuevos.delete(clave);
    }
    // Cualquier cambio de filtro vuelve a la página 1 (si estabas en la
    // página 4 del catálogo general y cambiás a "Mejor calificados", tiene
    // que arrancar desde la 1 de esos resultados, no seguir en la 4).
    if (clave !== 'pagina') {
      nuevos.delete('pagina');
    }
    setSearchParams(nuevos);
  }

  function limpiarBusqueda() {
    actualizarParametro('busqueda', '');
  }

  function irAPagina(nuevaPagina) {
    const nuevos = new URLSearchParams(searchParams);
    nuevos.set('pagina', String(nuevaPagina));
    setSearchParams(nuevos);
  }

  return (
    <div className="catalogo">
      <h1>Catálogo de juegos</h1>

      <div className="catalogo-filtros">
        <label>
          Ordenar por
          <select value={orden} onChange={(evento) => actualizarParametro('orden', evento.target.value)}>
            <option value="popular">Más popular</option>
            <option value="rating">Mejor calificados</option>
          </select>
        </label>

        <label>
          Categoría
          <select
            value={generoId}
            onChange={(evento) => actualizarParametro('genero', evento.target.value)}
          >
            <option value="">Todas</option>
            {generos.map((genero) => (
              <option key={genero.id} value={genero.id}>
                {genero.nombre}
              </option>
            ))}
          </select>
        </label>
      </div>

      {busqueda && !cargando && !error && (
        <p className="catalogo-resultado-busqueda">
          Resultados para "{busqueda}"{' '}
          <button type="button" className="catalogo-limpiar-busqueda" onClick={limpiarBusqueda}>
            Ver todos
          </button>
        </p>
      )}

      {cargando && <p className="cargando">Cargando juegos...</p>}
      {error && <p className="catalogo-error">{error}</p>}

      {!cargando && !error && (
        <>
          {juegos.length === 0 ? (
            <p className="catalogo-sin-resultados">
              No se encontraron juegos con estos filtros.
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
                onClick={() => irAPagina(pagina - 1)}
              >
                ← Anterior
              </button>
              <span>Página {pagina}</span>
              <button
                type="button"
                disabled={!hayPaginaSiguiente || cargando}
                onClick={() => irAPagina(pagina + 1)}
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
