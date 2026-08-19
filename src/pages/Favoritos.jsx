import { useEffect, useState } from 'react';
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
*/
function Favoritos() {
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

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

  return (
    <div className="catalogo">
      <h1>Mis favoritos</h1>

      {cargando && <p className="cargando">Cargando favoritos...</p>}
      {error && <p className="catalogo-error">{error}</p>}

      {!cargando && !error && favoritos.length === 0 && (
        <p className="catalogo-sin-resultados">
          Todavía no marcaste ningún juego como favorito. Andá al Catálogo o
          abrí la ficha de un juego para agregarlo.
        </p>
      )}

      {!cargando && !error && favoritos.length > 0 && (
        <div className="catalogo-grid">
          {favoritos.map((juego) => (
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
