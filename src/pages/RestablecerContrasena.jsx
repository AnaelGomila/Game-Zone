import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido, longitudMinima, coincideCon } from '../hooks/useValidacion';
import { supabase } from '../servicios/supabaseClient';
import '../styles/formularioAuth.css';

function RestablecerContrasena() {
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();
  const navegar = useNavigate();

  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      contrasena: {
        valor: contrasena,
        reglas: [requerido('Ingresá una contraseña nueva'), longitudMinima(6)],
      },
      confirmarContrasena: {
        valor: confirmarContrasena,
        reglas: [
          requerido('Confirmá tu contraseña'),
          coincideCon(contrasena, 'Las contraseñas no coinciden'),
        ],
      },
    });

    if (!esValido) return;

    setEnviando(true);
    const { error } = await supabase.auth.updateUser({ password: contrasena });
    setEnviando(false);

    if (error) {
      console.error('Error al restablecer la contraseña:', error.message);
      mostrarAlerta(
        'No se pudo actualizar la contraseña. El link puede haber expirado — pedí uno nuevo.',
        'error'
      );
      return;
    }

    mostrarAlerta('Contraseña actualizada. ¡Ya podés seguir navegando!', 'exito');
    navegar('/');
  }

  return (
    <div className="formulario-auth-pagina">
      <div className="formulario-auth">
        <h1>Elegí tu nueva contraseña</h1>
        <form onSubmit={manejarEnvio} noValidate>
          <label htmlFor="contrasena">Contraseña nueva</label>
          <input
            id="contrasena"
            type="password"
            value={contrasena}
            onChange={(evento) => setContrasena(evento.target.value)}
          />
          {errores.contrasena && (
            <p className="formulario-auth-error">{errores.contrasena}</p>
          )}

          <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
          <input
            id="confirmarContrasena"
            type="password"
            value={confirmarContrasena}
            onChange={(evento) => setConfirmarContrasena(evento.target.value)}
          />
          {errores.confirmarContrasena && (
            <p className="formulario-auth-error">{errores.confirmarContrasena}</p>
          )}

          <button type="submit" disabled={enviando}>
            {enviando ? 'Guardando...' : 'Guardar nueva contraseña'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default RestablecerContrasena;
