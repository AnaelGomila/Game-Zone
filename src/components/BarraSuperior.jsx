import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
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
*/
function BarraSuperior() {
  const { estaLogueado } = useAuth();
  const navegar = useNavigate();
  const [texto, setTexto] = useState('');

  function manejarEnvio(evento) {
    evento.preventDefault();
    const limpio = texto.trim();
    navegar(limpio ? `/catalogo?busqueda=${encodeURIComponent(limpio)}` : '/catalogo');
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
