import { useEffect, useState } from 'react';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido } from '../hooks/useValidacion';
import { obtenerGeneros } from '../servicios/servicioRawg';
import { subirImagenJuego } from '../servicios/servicioImagenes';
import { editarSugerencia } from '../servicios/servicioSugerencias';
import SelectorImagen from './SelectorImagen';
import Modal from './Modal';
import '../components/modalFormulario.css';

/*
  ModalEditarSugerencia — nuevo en la Parte 6, extendido en la Parte 11.
  ------------------------------------------------------------------------
  Permite corregir nombre/plataforma/descripción antes de aprobar (por si
  el usuario escribió algo con errores de tipeo), sin tener que rechazar
  la sugerencia y pedirle que la mande de nuevo.

  Parte 11 (Caso B: completar una sugerencia de usuario antes de
  aprobarla): se agregan género, año, requisitos de PC e imagen — los
  mismos campos que tiene AgregarJuego (Caso A), porque una sugerencia
  aprobada termina siendo el mismo tipo de dato la haya originado un
  usuario o un admin. La imagen es el único obligatorio de los nuevos:
  el trigger de la base (exigir_imagen_si_aprobado, ver
  sql/parte-11-agregar-juegos-admin.sql) rechaza el intento de aprobar
  si no hay una cargada — este modal no duplica esa validación a mano,
  simplemente deja que el error de la base llegue tal cual al toast
  cuando el admin apriete "Aprobar" después de guardar acá.

  Ojo: editar acá NO aprueba la sugerencia. Aprobar sigue siendo el botón
  aparte que ya existía en AdminSugerencias — este modal solo guarda los
  datos completados.
*/
function ModalEditarSugerencia({ sugerencia, onCerrar, onGuardado }) {
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();

  const [nombreJuego, setNombreJuego] = useState(sugerencia.nombre_juego);
  const [plataforma, setPlataforma] = useState(sugerencia.plataforma || '');
  const [descripcion, setDescripcion] = useState(sugerencia.descripcion || '');

  const [generos, setGeneros] = useState([]);
  const [genero, setGenero] = useState(sugerencia.genero || '');
  const [anioLanzamiento, setAnioLanzamiento] = useState(sugerencia.anio_lanzamiento || '');
  const [requisitosMinimos, setRequisitosMinimos] = useState(sugerencia.requisitos_minimos || '');
  const [requisitosRecomendados, setRequisitosRecomendados] = useState(
    sugerencia.requisitos_recomendados || ''
  );

  // El archivo nuevo (si el admin elige uno) queda acá; si se deja en
  // null, al guardar se mantiene la imagen_url que ya tenía la fila —
  // no hace falta volver a subir nada si no se tocó este campo.
  const [archivoImagenNuevo, setArchivoImagenNuevo] = useState(null);

  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    obtenerGeneros()
      .then((resultado) => setGeneros(resultado))
      .catch((error) => console.error('Error al traer géneros de RAWG:', error.message));
  }, []);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      nombreJuego: { valor: nombreJuego, reglas: [requerido('El nombre no puede quedar vacío')] },
    });

    if (!esValido) return;

    setGuardando(true);
    try {
      // Si el admin no eligió una imagen nueva, se mantiene la que ya
      // tenía la fila (sugerencia.imagen_url, puede ser null si todavía
      // no se cargó ninguna).
      const imagenUrl = archivoImagenNuevo
        ? await subirImagenJuego(archivoImagenNuevo)
        : sugerencia.imagen_url;

      const cambios = {
        nombre_juego: nombreJuego,
        plataforma,
        descripcion,
        genero: genero || null,
        anio_lanzamiento: anioLanzamiento ? Number(anioLanzamiento) : null,
        requisitos_minimos: requisitosMinimos || null,
        requisitos_recomendados: requisitosRecomendados || null,
        imagen_url: imagenUrl,
      };

      await editarSugerencia(sugerencia.id, cambios);
      mostrarAlerta('Sugerencia actualizada.', 'exito');
      onGuardado({ ...sugerencia, ...cambios });
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

        <label htmlFor="editarGenero">Género</label>
        <select
          id="editarGenero"
          value={genero}
          onChange={(evento) => setGenero(evento.target.value)}
        >
          <option value="">Sin especificar</option>
          {generos.map((opcion) => (
            <option key={opcion.id} value={opcion.nombre}>
              {opcion.nombre}
            </option>
          ))}
        </select>

        <label htmlFor="editarAnio">Año de lanzamiento</label>
        <input
          id="editarAnio"
          type="number"
          min="1970"
          max={new Date().getFullYear() + 1}
          value={anioLanzamiento}
          onChange={(evento) => setAnioLanzamiento(evento.target.value)}
        />

        <label htmlFor="editarDescripcion">Descripción</label>
        <textarea
          id="editarDescripcion"
          rows={3}
          value={descripcion}
          onChange={(evento) => setDescripcion(evento.target.value)}
        />

        <label htmlFor="editarRequisitosMinimos">Requisitos mínimos de PC</label>
        <textarea
          id="editarRequisitosMinimos"
          rows={2}
          value={requisitosMinimos}
          onChange={(evento) => setRequisitosMinimos(evento.target.value)}
        />

        <label htmlFor="editarRequisitosRecomendados">Requisitos recomendados de PC</label>
        <textarea
          id="editarRequisitosRecomendados"
          rows={2}
          value={requisitosRecomendados}
          onChange={(evento) => setRequisitosRecomendados(evento.target.value)}
        />

        <label>Imagen del juego</label>
        <SelectorImagen valorActual={sugerencia.imagen_url} onCambio={setArchivoImagenNuevo} />
        <p className="formulario-auth-modal-ayuda">
          Hace falta una imagen cargada antes de poder aprobar esta sugerencia.
        </p>

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </Modal>
  );
}

export default ModalEditarSugerencia;
