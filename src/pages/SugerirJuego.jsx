import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido, urlValida } from '../hooks/useValidacion';
import { obtenerGeneros } from '../servicios/servicioRawg';
import { crearSugerencia } from '../servicios/servicioSugerencias';
import '../styles/formularioSimple.css';

/*
  SugerirJuego — Parte 6 (placeholder → formulario simple) + Parte 13
  (género/año reales, link de referencia, anonimato funcional).
  ------------------------------------------------------------------------
  Formulario para proponer un juego que no está en la API de RAWG (la
  entidad ABM principal del proyecto, según la Parte 1). Inserta en
  `sugerencias`; el admin la revisa después desde AdminSugerencias.

  Género usa el mismo obtenerGeneros() (GET /genres de RAWG) que ya usan
  AgregarJuego y ModalEditarSugerencia (Parte 11) — mismo criterio en
  todo el proyecto: el género es siempre uno real de RAWG, nunca texto
  libre inventado por quien completa el formulario.

  Obligatorios: nombre, género, año y descripción. Plataforma y link de
  referencia quedan opcionales — el link ayuda a identificar el juego
  exacto al momento de revisarlo, pero no todos los tienen a mano.

  El checkbox "Mostrar mi nombre" viaja como una columna real
  (mostrar_autor, Parte 13) y tiene efecto de verdad: si se aprueba y el
  juego aparece en el Catálogo público, DetalleJuego respeta esta
  preferencia y no muestra el nombre si el usuario pidió que no se
  muestre. El admin sigue viendo el nombre real siempre en
  AdminSugerencias (lo necesita para poder moderar), con un aviso de que
  el usuario pidió mantenerlo oculto públicamente.
*/
function SugerirJuego() {
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();
  const navegar = useNavigate();

  const [nombreJuego, setNombreJuego] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [generoId, setGeneroId] = useState('');
  const [generos, setGeneros] = useState([]);
  const [anioLanzamiento, setAnioLanzamiento] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [linkReferencia, setLinkReferencia] = useState('');
  const [mostrarAutor, setMostrarAutor] = useState(true);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    obtenerGeneros()
      .then((resultado) => setGeneros(resultado))
      .catch((error) => console.error('Error al traer géneros de RAWG:', error.message));
  }, []);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      nombreJuego: { valor: nombreJuego, reglas: [requerido('Ingresá el nombre del juego')] },
      generoId: { valor: generoId, reglas: [requerido('Elegí un género')] },
      anioLanzamiento: {
        valor: anioLanzamiento,
        reglas: [requerido('Ingresá el año de lanzamiento')],
      },
      descripcion: { valor: descripcion, reglas: [requerido('La descripción es obligatoria')] },
      linkReferencia: { valor: linkReferencia, reglas: [urlValida()] },
    });

    if (!esValido) return;

    setEnviando(true);
    try {
      const generoSeleccionado = generos.find(
        (genero) => String(genero.id) === String(generoId)
      );

      await crearSugerencia(usuario.id, {
        nombreJuego,
        plataforma,
        genero: generoSeleccionado?.nombre,
        anioLanzamiento: Number(anioLanzamiento),
        descripcion,
        linkReferencia,
        mostrarAutor,
      });

      mostrarAlerta('Sugerencia enviada. Un admin la va a revisar.', 'exito');
      navegar('/mis-sugerencias');
    } catch (error) {
      console.error('Error al crear sugerencia:', error.message);
      mostrarAlerta('No se pudo enviar la sugerencia. Probá de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="formulario-simple">
      <h1>Sugerir un juego</h1>
      <p className="formulario-simple-ayuda">
        ¿No encontraste un juego en el catálogo? Proponelo acá — un admin lo
        va a revisar.
      </p>

      <form onSubmit={manejarEnvio} noValidate>
        <label htmlFor="nombreJuego">Nombre del juego</label>
        <input
          id="nombreJuego"
          type="text"
          value={nombreJuego}
          onChange={(evento) => setNombreJuego(evento.target.value)}
        />
        {errores.nombreJuego && (
          <p className="formulario-simple-error">{errores.nombreJuego}</p>
        )}

        <label htmlFor="plataforma">Plataforma (opcional)</label>
        <input
          id="plataforma"
          type="text"
          placeholder="Ej: PC, PS5, Switch..."
          value={plataforma}
          onChange={(evento) => setPlataforma(evento.target.value)}
        />

        <label htmlFor="genero">Género</label>
        <select
          id="genero"
          value={generoId}
          onChange={(evento) => setGeneroId(evento.target.value)}
        >
          <option value="">Elegí un género...</option>
          {generos.map((genero) => (
            <option key={genero.id} value={genero.id}>
              {genero.nombre}
            </option>
          ))}
        </select>
        {errores.generoId && <p className="formulario-simple-error">{errores.generoId}</p>}

        <label htmlFor="anioLanzamiento">Año de lanzamiento</label>
        <input
          id="anioLanzamiento"
          type="number"
          min="1970"
          max={new Date().getFullYear() + 2}
          value={anioLanzamiento}
          onChange={(evento) => setAnioLanzamiento(evento.target.value)}
        />
        {errores.anioLanzamiento && (
          <p className="formulario-simple-error">{errores.anioLanzamiento}</p>
        )}

        <label htmlFor="descripcion">Descripción</label>
        <textarea
          id="descripcion"
          rows={4}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />
        {errores.descripcion && (
          <p className="formulario-simple-error">{errores.descripcion}</p>
        )}

        <label htmlFor="linkReferencia">Link de referencia (opcional)</label>
        <input
          id="linkReferencia"
          type="url"
          placeholder="Ej: página de Steam, sitio oficial, RAWG..."
          value={linkReferencia}
          onChange={(evento) => setLinkReferencia(evento.target.value)}
        />
        {errores.linkReferencia && (
          <p className="formulario-simple-error">{errores.linkReferencia}</p>
        )}
        <p className="formulario-simple-ayuda">
          Ayuda a identificar exactamente de qué juego se trata al momento de revisarlo.
        </p>

        <label className="formulario-simple-checkbox" htmlFor="mostrarAutor">
          <input
            id="mostrarAutor"
            type="checkbox"
            checked={mostrarAutor}
            onChange={(evento) => setMostrarAutor(evento.target.checked)}
          />
          Mostrar mi nombre como quien sugirió este juego
        </label>

        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar sugerencia'}
        </button>
      </form>
    </div>
  );
}

export default SugerirJuego;
