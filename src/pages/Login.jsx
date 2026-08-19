import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import { useValidacion, requerido, emailValido } from '../hooks/useValidacion';
import '../styles/formularioAuth.css';

/*
  Login — Parte 6: ahora usa useValidacion (en vez de "if" sueltos) y
  useAlerta para el mensaje de error, además del texto en el propio
  formulario. El comportamiento funcional no cambia respecto a la Parte 3.
*/
function Login() {
  const { iniciarSesion } = useAuth();
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();
  const navegar = useNavigate();

  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setErrorLogin('');

    const esValido = validarFormulario({
      email: { valor: email, reglas: [requerido('Ingresá tu email'), emailValido()] },
      contrasena: { valor: contrasena, reglas: [requerido('Ingresá tu contraseña')] },
    });

    if (!esValido) return;

    setEnviando(true);
    const { error } = await iniciarSesion(email, contrasena);
    setEnviando(false);

    if (error) {
      setErrorLogin('Email o contraseña incorrectos.');
      mostrarAlerta('Email o contraseña incorrectos.', 'error');
      return;
    }

    mostrarAlerta('Sesión iniciada.', 'exito');
    navegar('/');
  }

  return (
    <div className="formulario-auth">
      <h1>Iniciar sesión</h1>
      <form onSubmit={manejarEnvio} noValidate>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />
        {errores.email && <p className="formulario-auth-error">{errores.email}</p>}

        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          type="password"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
        />
        {errores.contrasena && (
          <p className="formulario-auth-error">{errores.contrasena}</p>
        )}

        {errorLogin && <p className="formulario-auth-error">{errorLogin}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>

      <p>
        ¿No tenés cuenta? <Link to="/registro">Registrate</Link>
      </p>
    </div>
  );
}

export default Login;
