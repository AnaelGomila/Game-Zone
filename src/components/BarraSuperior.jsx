import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { obtenerJuegos } from '../servicios/servicioRawg';
import AvatarMenu from './AvatarMenu';
import './BarraSuperior.css';

/*
  BarraSuperior — nuevo en la Parte 7.
  ------------------------------------------
  Reemplaza la parte "de arriba" de la vieja Navegacion.jsx: nombre de la
  página + buscador global, tal como se ve en la referencia de RAWG. La
  navegación entre pantallas (Inicio, Catálogo, Favoritos, etc.) se movió
  a <Sidebar>; Perfil y los links de admin se movieron a <AvatarMenu>.

  El buscador es GLOBAL y único: no hay más un buscador aparte dentro de
  Catalogo.jsx (Parte 5) — al escribir acá y confirmar, siempre navega a
  /catalogo?busqueda=<texto>, sin importar en qué pantalla estés. Catalogo
  lee ese parámetro de la URL (ver Catalogo.jsx, Parte 7) en vez de tener
  su propio estado de búsqueda desconectado de la URL.

  Parte 10: se agrega el botón "🎲 Sorpréndeme". La barra quedaba con
  bastante espacio libre entre el logo y la cuenta, así que en vez de
  agrandar el buscador de forma artificial se sumó una utilidad real:
  pide la primera página de juegos populares (la misma que ya trae el
  Catálogo por defecto) y navega a uno elegido al azar entre esos 20.
  No hace falta un endpoint especial de RAWG para "juego aleatorio" —
  alcanza con reusar obtenerJuegos(), que ya se pedía en otras pantallas.
*/
function BarraSuperior() {
  const { estaLogueado } = useAuth();
  const { mostrarAlerta } = useAlerta();
  const navegar = useNavigate();
  const [texto, setTexto] = useState('');
  const [buscandoAlAzar, setBuscandoAlAzar] = useState(false);

  function manejarEnvio(evento) {
    evento.preventDefault();
    const limpio = texto.trim();
    navegar(limpio ? `/catalogo?busqueda=${encodeURIComponent(limpio)}` : '/catalogo');
  }

  async function manejarJuegoAlAzar() {
    setBuscandoAlAzar(true);

    try {
      const { juegos } = await obtenerJuegos({ pagina: 1 });
      if (juegos.length === 0) {
        mostrarAlerta('No se encontró ningún juego para sortear.', 'info');
        return;
      }

      const elegido = juegos[Math.floor(Math.random() * juegos.length)];
      navegar(`/juego/${elegido.id}`);
    } catch (error) {
      console.error('Error al buscar un juego al azar:', error.message);
      mostrarAlerta('No se pudo elegir un juego al azar. Probá de nuevo.', 'error');
    } finally {
      setBuscandoAlAzar(false);
    }
  }

  return (
    <header className="barra-superior">
      <Link to="/" className="barra-superior-logo">
        Game Zone
      </Link>

      <form className="barra-superior-buscador" onSubmit={manejarEnvio}>
        <input
          type="text"
          placeholder="Buscar juegos..."
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          aria-label="Buscar juegos"
        />
        <button type="submit" aria-label="Buscar">
          🔍
        </button>
      </form>

      <button
        type="button"
        className="barra-superior-al-azar"
        onClick={manejarJuegoAlAzar}
        disabled={buscandoAlAzar}
      >
        🎲 {buscandoAlAzar ? 'Eligiendo...' : 'Sorpréndeme'}
      </button>

      <div className="barra-superior-cuenta">
        {estaLogueado ? (
          <AvatarMenu />
        ) : (
          <>
            <Link to="/login" className="barra-superior-link">
              Login
            </Link>
            <Link to="/registro" className="barra-superior-link">
              Registro
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default BarraSuperior;
