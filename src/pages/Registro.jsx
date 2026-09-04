import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  useValidacion,
  requerido,
  emailValido,
  longitudMinima,
  coincideCon,
} from '../hooks/useValidacion';
import '../styles/formularioAuth.css';

/*
  Registro — Parte 6: mismo cambio que Login, ahora usa useValidacion y
  useAlerta. La regla "contrasena !== confirmarContrasena" se arma con
  coincideCon(contrasena) en vez de un if a mano.
*/
function Registro() {
  const { registrarse } = useAuth();
  const { mostrarAlerta } = useAlerta();
  const { errores, validarFormulario } = useValidacion();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [confirmarContrasena, setConfirmarContrasena] = useState('');
  const [errorRegistro, setErrorRegistro] = useState('');
  const [mensajeExito, setMensajeExito] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function manejarEnvio(evento) {
    evento.preventDefault();
    setErrorRegistro('');
    setMensajeExito('');

    const esValido = validarFormulario({
      nombre: { valor: nombre, reglas: [requerido('Ingresá tu nombre')] },
      email: { valor: email, reglas: [requerido('Ingresá tu email'), emailValido()] },
      contrasena: {
        valor: contrasena,
        reglas: [requerido('Ingresá una contraseña'), longitudMinima(6)],
      },
      confirmarContrasena: {
        valor: confirmarContrasena,
        reglas: [requerido('Confirmá tu contraseña'), coincideCon(contrasena, 'Las contraseñas no coinciden')],
      },
    });

    if (!esValido) return;

    setEnviando(true);
    const { error } = await registrarse(nombre, email, contrasena);
    setEnviando(false);

    if (error) {
      setErrorRegistro(error.message);
      mostrarAlerta(error.message, 'error');
      return;
    }

    setMensajeExito('Cuenta creada. Ya podés iniciar sesión.');
    mostrarAlerta('Cuenta creada con éxito.', 'exito');
  }

  return (
    <div className="formulario-auth-pagina">
      <div className="formulario-auth">
        <h1>Crear cuenta</h1>
        <form onSubmit={manejarEnvio} noValidate>
          <label htmlFor="nombre">Nombre</label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={(evento) => setNombre(evento.target.value)}
          />
          {errores.nombre && <p className="formulario-auth-error">{errores.nombre}</p>}

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

          {errorRegistro && <p className="formulario-auth-error">{errorRegistro}</p>}
          {mensajeExito && <p className="formulario-auth-exito">{mensajeExito}</p>}

          <button type="submit" disabled={enviando}>
            {enviando ? 'Creando cuenta...' : 'Registrarme'}
          </button>
        </form>

        <p>
          ¿Ya tenés cuenta? <Link to="/login">Iniciá sesión</Link>
        </p>
      </div>
    </div>
  );
}

export default Registro;
