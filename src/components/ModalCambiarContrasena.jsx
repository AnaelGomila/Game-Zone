import { useState } from 'react';
import { supabase } from '../servicios/supabaseClient';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido, longitudMinima, coincideCon } from '../hooks/useValidacion';
import Modal from './Modal';
import '../styles/formularioAuth.css';
import './modalFormulario.css';

/*
  ModalCambiarContrasena — nuevo en la Parte 6, usado desde Perfil.jsx.
  ------------------------------------------------------------------------
  Supabase Auth no pide la contraseña actual para cambiarla (no hay un
  endpoint de "reautenticar con contraseña vieja" en supabase-js): alcanza
  con estar logueado y llamar a supabase.auth.updateUser({ password }).
  Por eso el formulario solo pide la contraseña nueva + confirmación, no
  la actual — es el comportamiento estándar de Supabase, no una omisión.
*/
function ModalCambiarContrasena({ onCerrar }) {
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();

  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      contrasenaNueva: {
        valor: contrasenaNueva,
        reglas: [requerido('Ingresá la contraseña nueva'), longitudMinima(6)],
      },
      confirmarContrasena: {
        valor: confirmarContrasena,
        reglas: [
          requerido('Confirmá la contraseña nueva'),
          coincideCon(contrasenaNueva, 'Las contraseñas no coinciden'),
        ],
      },
    });

    if (!esValido) return;

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: contrasenaNueva });
    setEnviando(false);

    if (error) {
      mostrarAlerta(`No se pudo cambiar la contraseña: ${error.message}`, 'error');
      return;
    }

    mostrarAlerta('Contraseña actualizada con éxito.', 'exito');
    onCerrar();
  }

  return (
    <Modal titulo="Cambiar contraseña" onCerrar={onCerrar}>
      <form className="formulario-auth-modal" onSubmit={manejarEnvio} noValidate>
        <label htmlFor="contrasenaNueva">Contraseña nueva</label>
        <input
          id="contrasenaNueva"
          type="password"
          value={contrasenaNueva}
          onChange={(evento) => setContrasenaNueva(evento.target.value)}
        />
        {errores.contrasenaNueva && (
          <p className="formulario-auth-error">{errores.contrasenaNueva}</p>
        )}

        <label htmlFor="confirmarContrasenaModal">Confirmar contraseña nueva</label>
        <input
          id="confirmarContrasenaModal"
          type="password"
          value={confirmarContrasena}
          onChange={(evento) => setConfirmarContrasena(evento.target.value)}
        />
        {errores.confirmarContrasena && (
          <p className="formulario-auth-error">{errores.confirmarContrasena}</p>
        )}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Guardar contraseña'}
        </button>
      </form>
    </Modal>
  );
}

export default ModalCambiarContrasena;
