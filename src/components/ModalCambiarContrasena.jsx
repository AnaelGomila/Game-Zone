import { useState } from 'react';
import { supabase } from '../servicios/supabaseClient';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido, longitudMinima, coincideCon } from '../hooks/useValidacion';
import Modal from './Modal';
import '../styles/formularioAuth.css';
import './modalFormulario.css';

/*
  ModalCambiarContrasena — nuevo en la Parte 6, usado desde Perfil.jsx.
  ------------------------------------------------------------------------
  Supabase Auth no tiene un endpoint de "reautenticar con la contraseña
  vieja" — updateUser({ password }) cambia la contraseña de cualquier
  sesión ya logueada, sin pedir la actual (así funciona la librería, no
  es una omisión de acá).

  Para igual poder exigir la contraseña actual antes de dejar cambiarla,
  se usa un truco simple y 100% soportado: antes de llamar a
  updateUser(), se intenta un signInWithPassword() con el email de la
  sesión actual y la contraseña que la persona escribió como "actual".
  Si esas credenciales no son correctas, signInWithPassword falla y ahí
  se corta — nunca se llega a cambiar nada. Si son correctas, recién ahí
  se procede con updateUser() para la contraseña nueva.
*/
function ModalCambiarContrasena({ onCerrar }) {
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();

  const [contrasenaActual, setContrasenaActual] = useState('');
  const [contrasenaNueva, setContrasenaNueva] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      contrasenaActual: {
        valor: contrasenaActual,
        reglas: [requerido('Ingresá tu contraseña actual')],
      },
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

    // Paso 1: confirmar que la contraseña actual es correcta,
    // "reautenticando" contra el mismo email de la sesión activa.
    const { error: errorReautenticacion } = await supabase.auth.signInWithPassword({
      email: usuario.email,
      password: contrasenaActual,
    });

    if (errorReautenticacion) {
      setEnviando(false);
      mostrarAlerta('La contraseña actual no es correcta.', 'error');
      return;
    }

    // Paso 2: recién acá se cambia de verdad.
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
        <label htmlFor="contrasenaActual">Contraseña actual</label>
        <input
          id="contrasenaActual"
          type="password"
          value={contrasenaActual}
          onChange={(evento) => setContrasenaActual(evento.target.value)}
        />
        {errores.contrasenaActual && (
          <p className="formulario-auth-error">{errores.contrasenaActual}</p>
        )}

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
