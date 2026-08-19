import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido } from '../hooks/useValidacion';
import { crearSugerencia } from '../servicios/servicioSugerencias';
import '../styles/formularioSimple.css';

/*
  SugerirJuego — deja de ser placeholder en la Parte 6.
  -----------------------------------------------------------
  Formulario simple para proponer un juego que no está en la API de RAWG
  (la entidad ABM principal del proyecto, según la Parte 1). Inserta en
  `sugerencias` con estado 'pendiente'; el admin la revisa después desde
  AdminSugerencias. Tras enviar, redirige a Mis sugerencias para que el
  usuario vea de inmediato que quedó cargada.
*/
function SugerirJuego() {
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();
  const navegar = useNavigate();

  const [nombreJuego, setNombreJuego] = useState('');
  const [plataforma, setPlataforma] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      nombreJuego: { valor: nombreJuego, reglas: [requerido('Ingresá el nombre del juego')] },
    });

    if (!esValido) return;

    setEnviando(true);
    try {
      await crearSugerencia(usuario.id, { nombreJuego, plataforma, descripcion });
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

        <label htmlFor="descripcion">Descripción (opcional)</label>
        <textarea
          id="descripcion"
          rows={4}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />

        <button type="submit" disabled={enviando}>
          {enviando ? 'Enviando...' : 'Enviar sugerencia'}
        </button>
      </form>
    </div>
  );
}

export default SugerirJuego;
