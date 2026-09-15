import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { obtenerJuegos } from '../servicios/servicioRawg';
import AvatarMenu from './AvatarMenu';
import BuscadorUsuarios from './BuscadorUsuarios';
import './BarraSuperior.css';

function BarraSuperior({ onAbrirMenu }) {
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
      <button
        type="button"
        className="barra-superior-menu"
        onClick={onAbrirMenu}
        aria-label="Abrir menú de navegación"
      >
        ☰
      </button>

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
      </form>

      <button
        type="button"
        className="barra-superior-al-azar"
        onClick={manejarJuegoAlAzar}
        disabled={buscandoAlAzar}
      >
        {buscandoAlAzar ? 'Eligiendo...' : 'Sorpresa'}
      </button>

      <div className="barra-superior-cuenta">
        {estaLogueado ? (
          <>
            <BuscadorUsuarios />
            <AvatarMenu />
          </>
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
