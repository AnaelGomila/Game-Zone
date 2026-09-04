import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { obtenerJuegos } from '../servicios/servicioRawg';
import { obtenerJuegosLocalesPublicos } from '../servicios/servicioSugerencias';
import { adaptarJuegoLocal } from '../servicios/adaptadorJuegoLocal';
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

  orden: 'popular' (default) | 'rating' — desplegable "Ordenar por", el
  único filtro que sigue viviendo acá adentro.

  genero: id de género de RAWG, o '' para "Todas" — este filtro se sacó
  del desplegable local (que existía desde la Parte 7) y ahora vive en
  la Sidebar (aparece solo en /catalogo y /favoritos, ver Sidebar.jsx).
  Catalogo.jsx sigue leyendo el mismo query param "genero" de la URL, sin
  ningún cambio en la lógica de pedido a RAWG — lo único que cambió es
  quién escribe ese valor.

  Parte 12: se agrega una sección "Agregados por la comunidad" debajo de
  la grilla de RAWG, con los juegos aprobados que viven en la tabla
  `sugerencias` (agregados por un admin, o sugerencias de usuario ya
  aprobadas). Es intencionalmente independiente de la paginación/orden/
  categoría de RAWG — se pide una sola vez, aparte, y no se mezcla con
  esos resultados. Los filtros "Ordenar por" y "Categoría" son conceptos
  específicos de la API de RAWG (ordering, id de género de RAWG) y no se
  aplican acá; el único filtro que si se comparte es la búsqueda global
  de la barra superior, comparando el texto contra el nombre del juego.
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

  const [juegosComunidad, setJuegosComunidad] = useState([]);
  const [cargandoComunidad, setCargandoComunidad] = useState(true);

  // Se pide una sola vez (no depende de pagina/orden/genero, esos son
  // conceptos de RAWG); si hay una búsqueda activa, se filtra en el
  // cliente por nombre — no vale la pena un pedido aparte a Supabase por
  // cada letra tipeada, dado que en la práctica va a ser una lista corta.
  useEffect(() => {
    obtenerJuegosLocalesPublicos()
      .then((resultado) => setJuegosComunidad(resultado))
      .catch((error) =>
        console.error('Error al traer juegos de la comunidad:', error.message)
      )
      .finally(() => setCargandoComunidad(false));
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

  const juegosComunidadFiltrados = busqueda
    ? juegosComunidad.filter((sugerencia) =>
        sugerencia.nombre_juego.toLowerCase().includes(busqueda.toLowerCase())
      )
    : juegosComunidad;

  const juegosComunidadAdaptados = juegosComunidadFiltrados.map(adaptarJuegoLocal);

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

      {!cargandoComunidad && juegosComunidadAdaptados.length > 0 && (
        <div className="catalogo-comunidad" id="comunidad">
          <h2>Agregados por la comunidad</h2>
          <div className="catalogo-grid">
            {juegosComunidadAdaptados.map((juego) => (
              <TarjetaJuego key={juego.id} juego={juego} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Catalogo;
