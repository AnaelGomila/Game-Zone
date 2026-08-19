import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import '../styles/formularioAuth.css';

function Login() {
  const { iniciarSesion } = useAuth();
  const navegar = useNavigate();

  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');

    // Validación manual y simple. El hook useValidacion reusable se
    // arma en el paso dedicado a validación de formularios.
    if (!email || !contrasena) {
      setError('Completá email y contraseña.');
      return;
    }

    setEnviando(true);
    const { error: errorLogin } = await iniciarSesion(email, contrasena);
    setEnviando(false);

    if (errorLogin) {
      setError('Email o contraseña incorrectos.');
      return;
    }

    navegar('/');
  }

  return (
    <div className="formulario-auth">
      <h1>Iniciar sesión</h1>
      <form onSubmit={manejarEnvio}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(evento) => setEmail(evento.target.value)}
        />

        <label htmlFor="contrasena">Contraseña</label>
        <input
          id="contrasena"
          type="password"
          value={contrasena}
          onChange={(evento) => setContrasena(evento.target.value)}
        />

        {error && <p className="formulario-auth-error">{error}</p>}

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
