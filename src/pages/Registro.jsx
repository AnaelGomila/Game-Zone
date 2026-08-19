import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import '../styles/formularioAuth.css';

function Registro() {
  const { registrarse } = useAuth();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [error, setError] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setError('');
    setMensajeExito('');

    // Validación manual y simple, igual que en Login. El hook useValidacion
    // reusable se arma en el paso dedicado a validación de formularios.
    if (!nombre || !email || !contrasena || !confirmarContrasena) {
      setError('Completá todos los campos.');
      return;
    }

    if (contrasena.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (contrasena !== confirmarContrasena) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setEnviando(true);
    const { error: errorRegistro } = await registrarse(nombre, email, contrasena);
    setEnviando(false);

    if (errorRegistro) {
      setError(errorRegistro.message);
      return;
    }

    // No redirigimos automáticamente: si en Supabase quedó activa la
    // confirmación por email, el usuario todavía no puede loguearse hasta
    // confirmar. Le mostramos un mensaje y que vaya a /login cuando pueda.
    setMensajeExito('Cuenta creada. Ya podés iniciar sesión.');
  }

  return (
    <div className="formulario-auth">
      <h1>Crear cuenta</h1>
      <form onSubmit={manejarEnvio}>
        <label htmlFor="nombre">Nombre</label>
        <input
          id="nombre"
          type="text"
          value={nombre}
          onChange={(evento) => setNombre(evento.target.value)}
        />

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

        <label htmlFor="confirmarContrasena">Confirmar contraseña</label>
        <input
          id="confirmarContrasena"
          type="password"
          value={confirmarContrasena}
          onChange={(evento) => setConfirmarContrasena(evento.target.value)}
        />

        {error && <p className="formulario-auth-error">{error}</p>}
        {mensajeExito && <p className="formulario-auth-exito">{mensajeExito}</p>}

        <button type="submit" disabled={enviando}>
          {enviando ? 'Creando cuenta...' : 'Registrarme'}
        </button>
      </form>

      <p>
        ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
      </p>
    </div>
  );
}

export default Registro;
