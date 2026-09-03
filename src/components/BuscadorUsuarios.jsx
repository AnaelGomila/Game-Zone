import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buscarUsuarios } from '../servicios/servicioUsuarios';
import './BuscadorUsuarios.css';

// Milisegundos de espera después de la última tecla antes de buscar —
// evita mandar un pedido por cada letra tipeada.
const DEMORA_MS = 300;

/*
  BuscadorUsuarios — nuevo, en la barra superior.
  ----------------------------------------------------
  Botón de texto ("Buscar usuarios"), ubicado junto al avatar, que abre
  un desplegable de búsqueda por nombre o nickname — no navega a
  ninguna pantalla de resultados nueva (no existe una para usuarios, a
  diferencia del Catálogo para juegos); los resultados aparecen ahí
  mismo y clickear uno lleva directo a su perfil público (/usuario/:id,
  Parte 17).

  Mismo patrón de "cerrar al clickear afuera o con Escape" que ya usa
  AvatarMenu (contenedorRef delimita qué es "adentro" del desplegable).
*/
function BuscadorUsuarios() {
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  const contenedorRef = useRef(null);
  const inputRef = useRef(null);
  const navegar = useNavigate();

  useEffect(() => {
    function manejarClicAfuera(evento) {
      if (contenedorRef.current && !contenedorRef.current.contains(evento.target)) {
        setAbierto(false);
      }
    }

    function manejarTecla(evento) {
      if (evento.key === 'Escape') setAbierto(false);
    }

    document.addEventListener('mousedown', manejarClicAfuera);
    document.addEventListener('keydown', manejarTecla);
    return () => {
      document.removeEventListener('mousedown', manejarClicAfuera);
      document.removeEventListener('keydown', manejarTecla);
    };
  }, []);

  // Al abrir, foco directo al input; al cerrar, se limpia todo — así la
  // próxima vez que se abre no aparece la búsqueda anterior por un
  // instante.
  useEffect(() => {
    if (abierto) {
      inputRef.current?.focus();
    } else {
      setConsulta('');
      setResultados([]);
    }
  }, [abierto]);

  useEffect(() => {
    const texto = consulta.trim();
    if (!texto) {
      setResultados([]);
      return;
    }

    setBuscando(true);
    const temporizador = setTimeout(() => {
      buscarUsuarios(texto)
        .then((resultado) => setResultados(resultado))
        .catch((error) => console.error('Error al buscar usuarios:', error.message))
        .finally(() => setBuscando(false));
    }, DEMORA_MS);

    return () => clearTimeout(temporizador);
  }, [consulta]);

  function manejarClicResultado(id) {
    setAbierto(false);
    navegar(`/usuario/${id}`);
  }

  return (
    <div className="buscador-usuarios" ref={contenedorRef}>
      <button
        type="button"
        className="buscador-usuarios-boton"
        onClick={() => setAbierto((actual) => !actual)}
        aria-haspopup="true"
        aria-expanded={abierto}
      >
        Buscar usuarios
      </button>

      {abierto && (
        <div className="buscador-usuarios-desplegable">
          <input
            ref={inputRef}
            type="text"
            placeholder="Buscar usuario..."
            value={consulta}
            onChange={(evento) => setConsulta(evento.target.value)}
          />

          {buscando && <p className="buscador-usuarios-estado">Buscando...</p>}

          {!buscando && consulta.trim() && resultados.length === 0 && (
            <p className="buscador-usuarios-estado">No se encontraron usuarios.</p>
          )}

          {!buscando && resultados.length > 0 && (
            <ul className="buscador-usuarios-lista">
              {resultados.map((resultado) => (
                <li key={resultado.id}>
                  <button type="button" onClick={() => manejarClicResultado(resultado.id)}>
                    {resultado.avatar_url ? (
                      <img src={resultado.avatar_url} alt="" />
                    ) : (
                      <span className="buscador-usuarios-avatar-vacio">
                        {(resultado.nickname || resultado.nombre || '?').charAt(0).toUpperCase()}
                      </span>
                    )}
                    <span>{resultado.nickname || resultado.nombre}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default BuscadorUsuarios;
