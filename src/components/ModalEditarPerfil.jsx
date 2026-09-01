import { useState } from 'react';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { actualizarPerfilPropio } from '../servicios/servicioUsuarios';
import { subirAvatar, subirPortada } from '../servicios/servicioImagenes';
import SelectorImagen from './SelectorImagen';
import Modal from './Modal';
import './modalFormulario.css';

// Mismo valor que --color-texto en variables.css — si el usuario nunca
// tocó el selector de color, arranca mostrando el color por defecto del
// tema en vez de un negro/blanco arbitrario del navegador.
const COLOR_TEXTO_POR_DEFECTO = '#f5f5f7';

/*
  ModalEditarPerfil — nuevo en la Parte 17.
  ---------------------------------------------
  Reemplaza las dos tarjetas "Personalizar perfil" sueltas de la Parte 16
  (una para avatar, otra para portada, cada una con su propio botón
  "Guardar") por un único modal con todos los campos editables del perfil
  y un solo botón "Guardar cambios" — se abre desde el botón "Modificar
  perfil" en el encabezado, y solo se le ofrece a quien es dueño del
  perfil (Perfil.jsx no lo renderiza en absoluto al ver el perfil de otro
  usuario).

  avatar/portada solo se suben a Storage (subirAvatar/subirPortada) si el
  usuario efectivamente eligió un archivo nuevo — si no tocó esos campos,
  `cambios` ni siquiera incluye avatar_url/portada_url, así que
  actualizarPerfilPropio no los toca.

  Al guardar, se llama a onGuardado() (que en Perfil.jsx dispara
  refrescarPerfil() del ContextoAuth) para que el encabezado y el círculo
  de AvatarMenu se actualicen sin recargar la página.
*/
function ModalEditarPerfil({ onCerrar, onGuardado }) {
  const { usuario, perfil } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [nickname, setNickname] = useState(perfil?.nickname || '');
  const [nacionalidad, setNacionalidad] = useState(perfil?.nacionalidad || '');
  const [redesSociales, setRedesSociales] = useState(perfil?.redes_sociales || '');
  const [colorTexto, setColorTexto] = useState(perfil?.color_texto || COLOR_TEXTO_POR_DEFECTO);

  const [archivoAvatar, setArchivoAvatar] = useState(null);
  const [archivoPortada, setArchivoPortada] = useState(null);
  const [guardando, setGuardando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setGuardando(true);

    try {
      const cambios = {
        nickname: nickname.trim() || null,
        nacionalidad: nacionalidad.trim() || null,
        redes_sociales: redesSociales.trim() || null,
        color_texto: colorTexto,
      };

      if (archivoAvatar) {
        cambios.avatar_url = await subirAvatar(usuario.id, archivoAvatar);
      }
      if (archivoPortada) {
        cambios.portada_url = await subirPortada(usuario.id, archivoPortada);
      }

      await actualizarPerfilPropio(usuario.id, cambios);
      await onGuardado();
      mostrarAlerta('Perfil actualizado.', 'exito');
      onCerrar();
    } catch (error) {
      console.error('Error al actualizar el perfil:', error.message);
      mostrarAlerta('No se pudo actualizar el perfil.', 'error');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <Modal titulo="Modificar perfil" onCerrar={onCerrar}>
      <form className="formulario-auth-modal" onSubmit={manejarEnvio} noValidate>
        <label>Foto de perfil</label>
        <SelectorImagen
          variante="circular"
          valorActual={perfil?.avatar_url}
          onCambio={setArchivoAvatar}
        />

        <label>Fondo de perfil</label>
        <SelectorImagen valorActual={perfil?.portada_url} onCambio={setArchivoPortada} />

        <label htmlFor="nickname">Nickname</label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(evento) => setNickname(evento.target.value)}
        />

        <label htmlFor="nacionalidad">Nacionalidad</label>
        <input
          id="nacionalidad"
          type="text"
          value={nacionalidad}
          onChange={(evento) => setNacionalidad(evento.target.value)}
        />

        <label htmlFor="redesSociales">Links de redes sociales</label>
        <textarea
          id="redesSociales"
          rows={3}
          placeholder={'Un link por línea (Discord, Steam, X...)'}
          value={redesSociales}
          onChange={(evento) => setRedesSociales(evento.target.value)}
        />

        <label htmlFor="colorTexto">Color de tu nombre</label>
        <input
          id="colorTexto"
          type="color"
          value={colorTexto}
          onChange={(evento) => setColorTexto(evento.target.value)}
        />

        <button type="submit" disabled={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </Modal>
  );
}

export default ModalEditarPerfil;
