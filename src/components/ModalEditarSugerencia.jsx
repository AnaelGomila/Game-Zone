import { useState } from 'react';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido } from '../hooks/useValidacion';
import { editarSugerencia } from '../servicios/servicioSugerencias';
import Modal from './Modal';
import '../components/modalFormulario.css';

/*
  ModalEditarSugerencia — nuevo en la Parte 6, usado desde AdminSugerencias.
  Permite corregir nombre/plataforma/descripción antes de aprobar (por si
  el usuario escribió algo con errores de tipeo, por ejemplo), sin tener
  que rechazar la sugerencia y pedirle que la mande de nuevo.
*/
function ModalEditarSugerencia({ sugerencia, onCerrar, onGuardado }) {
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();

  const [nombreJuego, setNombreJuego] = useState(sugerencia.nombre_juego);
  const [plataforma, setPlataforma] = useState(sugerencia.plataforma || '');
  const [descripcion, setDescripcion] = useState(sugerencia.descripcion || '');
  const [guardando, setGuardando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      nombreJuego: { valor: nombreJuego, reglas: [requerido('El nombre no puede quedar vacío')] },
    });

    if (!esValido) return;

    setGuardando(true);
    try {
      await editarSugerencia(sugerencia.id, {
        nombre_juego: nombreJuego,
        plataforma,
        descripcion,
      });
      mostrarAlerta('Sugerencia actualizada.', 'exito');
      onGuardado({ ...sugerencia, nombre_juego: nombreJuego, plataforma, descripcion });
      onCerrar();
    } catch (error) {
      console.error('Error al editar sugerencia:', error.message);
      mostrarAlerta('No se pudo guardar la edición.', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Editar sugerencia" onCerrar={onCerrar}>
      <form className="formulario-auth-modal" onSubmit={manejarEnvio} noValidate>
        <label htmlFor="editarNombre">Nombre del juego</label>
        <input
          id="editarNombre"
          type="text"
          value={nombreJuego}
          onChange={(evento) => setNombreJuego(evento.target.value)}
        />
        {errores.nombreJuego && (
          <p className="formulario-auth-error">{errores.nombreJuego}</p>
        )}

        <label htmlFor="editarPlataforma">Plataforma</label>
        <input
          id="editarPlataforma"
          type="text"
          value={plataforma}
          onChange={(evento) => setPlataforma(evento.target.value)}
        />

        <label htmlFor="editarDescripcion">Descripción</label>
        <textarea
          id="editarDescripcion"
          rows={3}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </Modal>
  );
}

export default ModalEditarSugerencia;
