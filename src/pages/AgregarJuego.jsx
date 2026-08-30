import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido } from '../hooks/useValidacion';
import { obtenerGeneros } from '../servicios/servicioRawg';
import { subirImagenJuego } from '../servicios/servicioImagenes';
import { crearJuegoComoAdmin } from '../servicios/servicioSugerencias';
import SelectorImagen from '../components/SelectorImagen';
import '../styles/formularioSimple.css';

/*
  AgregarJuego — nuevo en la Parte 11.
  --------------------------------------
  Formulario propio del admin (distinto al SugerirJuego que usan los
  usuarios comunes) para agregar un juego directamente al catálogo de
  sugerencias, sin pasar por el flujo de revisión. Técnicamente sigue
  insertando en la misma tabla `sugerencias` — es el trigger de la base
  (ver sql/parte-11-agregar-juegos-admin.sql) el que, al detectar que
  quien inserta es admin, deja el registro en estado 'aprobado' de una,
  en vez de 'pendiente'. Por eso este formulario nunca manda un `estado`:
  no le serviría de nada, la base decide sola.

  Se pensó "lo más parecido a los juegos que trae RAWG": nombre,
  plataforma, género (usando el mismo obtenerGeneros() que ya usa el
  filtro del Catálogo, en vez de inventar una lista de géneros aparte),
  año de lanzamiento y requisitos de PC. Como estos juegos no vienen de
  RAWG, no hay datos que "ya estén cargados" — todo lo escribe el admin
  a mano.

  Obligatorios: nombre y descripción (mismo criterio que SugerirJuego) y,
  a diferencia de ese formulario, la imagen — porque este juego se
  aprueba en el momento (el trigger de la base directamente rechaza
  cualquier fila en estado 'aprobado' sin imagen cargada).
*/
function AgregarJuego() {
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
  const [requisitosMinimos, setRequisitosMinimos] = useState('');
  const [requisitosRecomendados, setRequisitosRecomendados] = useState('');

  const [archivoImagen, setArchivoImagen] = useState(null);
  const [errorImagen, setErrorImagen] = useState('');

  const [enviando, setEnviando] = useState(false);

  // Mismo endpoint de RAWG que ya usa el filtro "Categoría" del Catálogo
  // (Parte 7) — así el género que elige el admin es uno real de RAWG, no
  // un texto libre que podría no coincidir con nada.
  useEffect(() => {
    obtenerGeneros()
      .then((resultado) => setGeneros(resultado))
      .catch((error) => console.error('Error al traer géneros de RAWG:', error.message));
  }, []);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      nombreJuego: { valor: nombreJuego, reglas: [requerido('Ingresá el nombre del juego')] },
      descripcion: { valor: descripcion, reglas: [requerido('La descripción es obligatoria')] },
    });

    // La imagen no es un campo de texto, así que se valida aparte del
    // hook (useValidacion trabaja sobre valores tipo string).
    if (!archivoImagen) {
      setErrorImagen('Tenés que cargar una imagen del juego.');
    } else {
      setErrorImagen('');
    }

    if (!esValido || !archivoImagen) return;

    setEnviando(true);
    try {
      const imagenUrl = await subirImagenJuego(archivoImagen);

      const generoSeleccionado = generos.find(
        (genero) => String(genero.id) === String(generoId)
      );

      await crearJuegoComoAdmin(usuario.id, {
        nombreJuego,
        plataforma,
        genero: generoSeleccionado?.nombre,
        anioLanzamiento: anioLanzamiento ? Number(anioLanzamiento) : null,
        descripcion,
        requisitosMinimos,
        requisitosRecomendados,
        imagenUrl,
      });

      mostrarAlerta('Juego agregado y aprobado.', 'exito');
      navegar('/admin/sugerencias');
    } catch (error) {
      console.error('Error al agregar el juego:', error.message);
      mostrarAlerta('No se pudo agregar el juego. Probá de nuevo.', 'error');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="formulario-simple">
      <h1>Agregar juego</h1>
      <p className="formulario-simple-ayuda">
        Se agrega directamente aprobado, sin pasar por revisión — a diferencia
        de las sugerencias de los usuarios.
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

        <label htmlFor="genero">Género (opcional)</label>
        <select
          id="genero"
          value={generoId}
          onChange={(evento) => setGeneroId(evento.target.value)}
        >
          <option value="">Sin especificar</option>
          {generos.map((genero) => (
            <option key={genero.id} value={genero.id}>
              {genero.nombre}
            </option>
          ))}
        </select>

        <label htmlFor="anioLanzamiento">Año de lanzamiento (opcional)</label>
        <input
          id="anioLanzamiento"
          type="number"
          min="1970"
          max={new Date().getFullYear() + 1}
          value={anioLanzamiento}
          onChange={(evento) => setAnioLanzamiento(evento.target.value)}
        />

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

        <label htmlFor="requisitosMinimos">Requisitos mínimos de PC (opcional)</label>
        <textarea
          id="requisitosMinimos"
          rows={3}
          value={requisitosMinimos}
          onChange={(evento) => setRequisitosMinimos(evento.target.value)}
        />

        <label htmlFor="requisitosRecomendados">Requisitos recomendados de PC (opcional)</label>
        <textarea
          id="requisitosRecomendados"
          rows={3}
          value={requisitosRecomendados}
          onChange={(evento) => setRequisitosRecomendados(evento.target.value)}
        />

        <label>Imagen del juego</label>
        <SelectorImagen onCambio={setArchivoImagen} />
        {errorImagen && <p className="formulario-simple-error">{errorImagen}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Agregando...' : 'Agregar juego'}
        </button>
      </form>
    </div>
  );
}

export default AgregarJuego;
