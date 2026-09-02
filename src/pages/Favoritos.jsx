import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { obtenerFavoritos, quitarFavorito } from '../servicios/servicioFavoritos';
import TarjetaJuego from '../components/TarjetaJuego';
import '../styles/catalogo.css';
import '../styles/cargando.css';

/*
  Favoritos — deja de ser placeholder en la Parte 6.
  -------------------------------------------------------
  Reutiliza exactamente el mismo maquetado que Catalogo (catalogo.css:
  la grilla auto-fill) y el componente <TarjetaJuego>, pasándole el prop
  `pie` con el botón "Quitar de favoritos" (ver TarjetaJuego.jsx).

  Al quitar un favorito, se actualiza el estado local filtrando el array
  en vez de volver a pedir la lista completa a Supabase — es una sola
  fila la que cambió, no hace falta un round-trip extra.

  Filtro por género (ajuste posterior): el género activo viene del mismo
  query param "genero" que usa Catalogo, pero acá guarda el NOMBRE del
  género en texto (no un id de RAWG) — los favoritos son una "foto"
  (snapshot) de cada juego, guardada con juego_data.genres como
  [{name: "Action"}, ...], sin el id de RAWG. El filtrado es 100% en el
  navegador (favoritos ya están todos cargados de una), sin ningún
  pedido nuevo. El botón que arma la URL con el nombre del género vive
  en la Sidebar (ver Sidebar.jsx).
*/
function Favoritos() {
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();
  const [searchParams] = useSearchParams();

  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const generoActivo = searchParams.get('genero') || '';

  useEffect(() => {
    if (!usuario) return;

    obtenerFavoritos(usuario.id)
      .then((resultado) => setFavoritos(resultado))
      .catch((error) => {
        console.error('Error al traer favoritos:', error.message);
        setError('No se pudieron cargar tus favoritos. Probá de nuevo más tarde.');
      })
      .finally(() => setCargando(false));
  }, [usuario]);

  async function manejarQuitar(favoritoId) {
    try {
      await quitarFavorito(favoritoId);
      setFavoritos((actuales) => actuales.filter((juego) => juego.favoritoId !== favoritoId));
      mostrarAlerta('Juego quitado de favoritos.', 'info');
    } catch (error) {
      console.error('Error al quitar favorito:', error.message);
      mostrarAlerta('No se pudo quitar el favorito. Probá de nuevo.', 'error');
    }
  }

  const favoritosFiltrados = generoActivo
    ? favoritos.filter((juego) => juego.genres?.some((genero) => genero.name === generoActivo))
    : favoritos;

  return (
    <div className="catalogo">
      <h1>Mis favoritos</h1>

      {generoActivo && !cargando && !error && (
        <p className="catalogo-resultado-busqueda">Categoría: "{generoActivo}"</p>
      )}

      {cargando && <p className="cargando">Cargando favoritos...</p>}
      {error && <p className="catalogo-error">{error}</p>}

      {!cargando && !error && favoritos.length === 0 && (
        <p className="catalogo-sin-resultados">
          Todavía no marcaste ningún juego como favorito. Andá al Catálogo o
          abrí la ficha de un juego para agregarlo.
        </p>
      )}

      {!cargando && !error && favoritos.length > 0 && favoritosFiltrados.length === 0 && (
        <p className="catalogo-sin-resultados">
          No tenés favoritos en esta categoría.
        </p>
      )}

      {!cargando && !error && favoritosFiltrados.length > 0 && (
        <div className="catalogo-grid">
          {favoritosFiltrados.map((juego) => (
            <TarjetaJuego
              key={juego.favoritoId}
              juego={juego}
              pie={
                <button type="button" onClick={() => manejarQuitar(juego.favoritoId)}>
                  Quitar de favoritos
                </button>
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default Favoritos;
