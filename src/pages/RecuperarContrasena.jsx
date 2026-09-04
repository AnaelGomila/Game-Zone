import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido, emailValido } from '../hooks/useValidacion';
import { supabase } from '../servicios/supabaseClient';
import '../styles/formularioAuth.css';

/*
  RecuperarContrasena — nuevo.
  --------------------------------
  Primer paso del flujo de "olvidé mi contraseña". El usuario pone su
  email, y supabase.auth.resetPasswordForEmail() le manda un link que lo
  trae de vuelta a /restablecer-contrasena (RestablecerContrasena.jsx)
  con una sesión temporal ya armada — ahí recién puede poner una
  contraseña nueva.

  redirectTo tiene que ser una URL permitida en Supabase → Authentication
  → URL Configuration → Redirect URLs (el mismo lugar donde ya se
  configuró el dominio de Netlify al desplegar) — si no está en esa
  lista, Supabase puede ignorar el redirectTo y mandar al usuario a otro
  lado.

  No se distingue en la UI si el email ingresado existe o no como cuenta
  registrada: Supabase responde success en los dos casos, a propósito
  (por seguridad, para no revelar qué emails están registrados solo
  probando este formulario) — el mensaje que se muestra es siempre el
  mismo.
*/
function RecuperarContrasena() {
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();

  const [email, setEmail] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();

    const esValido = validarFormulario({
      email: { valor: email, reglas: [requerido('Ingresá tu email'), emailValido()] },
    });

    if (!esValido) return;

    setEnviando(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/restablecer-contrasena`,
    });
    setEnviando(false);

    if (error) {
      console.error('Error al pedir recuperación de contraseña:', error.message);
      mostrarAlerta('No se pudo enviar el email. Probá de nuevo.', 'error');
      return;
    }

    setEnviado(true);
  }

  return (
    <div className="formulario-auth-pagina">
      <div className="formulario-auth">
        <h1>Recuperar contraseña</h1>

        {enviado ? (
          <p className="formulario-auth-exito">
            Si ese email está registrado, te mandamos un link para elegir una
            contraseña nueva. Revisá tu bandeja de entrada (y la carpeta de
            spam).
          </p>
        ) : (
          <form onSubmit={manejarEnvio} noValidate>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(evento) => setEmail(evento.target.value)}
            />
            {errores.email && <p className="formulario-auth-error">{errores.email}</p>}

            <button type="submit" disabled={enviando}>
              {enviando ? 'Enviando...' : 'Enviar link de recuperación'}
            </button>
          </form>
        )}

        <p>
          <Link to="/login">Volver a iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default RecuperarContrasena;
