# Game Zone — Parte 3: Autenticación con Supabase (explicación + código)

Este documento reúne lo hecho en la Parte 3: conexión real con Supabase Auth, `ContextoAuth`, formularios de Login y Registro funcionales, y `RutaPrivada` protegiendo de verdad.

---

## 1. Explicación de lo que se hizo

**Proyecto de Supabase.** Antes del código, se creó el proyecto en Supabase (dashboard), se copiaron `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` al `.env`, y se creó el esquema de base de datos: tres tablas (`usuarios`, `sugerencias`, `favoritos`) con Row Level Security activado, más un trigger que crea automáticamente la fila en `usuarios` cada vez que alguien se registra en Supabase Auth.

**`ContextoAuth` (`src/contexto/ContextoAuth.jsx`).** Es el corazón de esta parte. Guarda dos cosas separadas:
- `usuario`: lo que devuelve Supabase Auth apenas hay sesión (`id`, `email`). Se sabe de inmediato.
- `perfil`: la fila de la tabla `usuarios` (`nombre`, `rol`). Se busca en un segundo paso, una vez que se sabe el `id` del usuario logueado, porque esa información no vive en Supabase Auth sino en nuestra propia tabla.

Al montarse, el contexto llama a `supabase.auth.getSession()` para saber si ya hay una sesión activa (por ejemplo, si el usuario recargó la página), y se suscribe con `onAuthStateChange` para enterarse de logins, logouts o renovaciones de token mientras la app está abierta.

De ahí salen `estaLogueado` (booleano) y `esAdmin` (booleano, según `perfil.rol`), que van a usar `RutaPrivada` y, más adelante, los paneles de administración.

**`RutaPrivada` ahora protege de verdad.** Lee `estaLogueado` y `cargando` del contexto. Mientras `cargando` es `true` (todavía no se sabe si hay sesión), muestra un mensaje de carga en vez de decidir apurado. Una vez que se sabe, si no hay sesión redirige a `/login` con `<Navigate>`; si hay sesión, deja pasar el contenido.

**Login y Registro dejaron de ser placeholders.** Ambos son formularios controlados (estado por `useState` para cada campo) con validación manual simple: campos vacíos, contraseña de al menos 6 caracteres en Registro, y que las dos contraseñas coincidan. Esta validación es intencionalmente básica: el hook reusable `useValidacion` se arma en el paso dedicado a validación de formularios, más adelante, para no mezclar dos frentes en la misma parte.

- `Login` llama a `iniciarSesion(email, contrasena)` del contexto; si falla, muestra un error genérico ("Email o contraseña incorrectos"); si funciona, navega a `/`.
- `Registro` llama a `registrarse(nombre, email, contrasena)`, que internamente manda `nombre` dentro de `options.data` al hacer `supabase.auth.signUp(...)` — ese dato es el que lee el trigger de Supabase para crear la fila en `usuarios`. No redirige automáticamente después de registrarse, porque si en el proyecto de Supabase quedó activa la confirmación por email, el usuario todavía no puede loguearse hasta confirmar: se le muestra un mensaje de éxito y un link a Login.

**`Navegacion` ahora distingue sesión.** Si no hay usuario logueado, muestra Login y Registro. Si hay usuario, muestra el resto de las rutas privadas más un botón "Cerrar sesión" que llama a `cerrarSesion()` del contexto y redirige a `/login`.

**`App.jsx` envuelve todo en `ProveedorAuth`.** Así el contexto queda disponible en toda la app, incluida la `Navegacion` y cualquier pantalla que use `useAuth()`.

**Primer usuario admin.** Como todavía no hay pantalla para asignar roles, queda pendiente crearlo a mano: una vez que exista al menos un usuario registrado, hay que ir a Supabase → Table Editor → `usuarios` y cambiar su `rol` de `'usuario'` a `'admin'`.

## Próximo paso
A definir: pantallas públicas (Inicio, Catálogo conectado a la API de RAWG) o el resto de las pantallas privadas — lo que se prefiera abordar primero.

---

## 2. Código de la Parte 3

### Estructura de carpetas agregada/modificada dentro de `src/`
```
src/
├── contexto/
│   └── ContextoAuth.jsx      (nuevo)
├── router/
│   └── RutaPrivada.jsx        (modificado)
├── styles/
│   ├── cargando.css           (nuevo)
│   └── formularioAuth.css     (nuevo)
├── pages/
│   ├── Login.jsx               (modificado, ya no es placeholder)
│   └── Registro.jsx            (modificado, ya no es placeholder)
├── components/
│   ├── Navegacion.jsx          (modificado)
│   └── Navegacion.css          (modificado)
└── App.jsx                     (modificado)
```

### `src/contexto/ContextoAuth.jsx`
```jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../servicios/supabaseClient';

const ContextoAuth = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUsuario(session?.user ?? null);
      setCargando(false);
    });

    const { data: escucha } = supabase.auth.onAuthStateChange((_evento, session) => {
      setUsuario(session?.user ?? null);
    });

    return () => escucha.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!usuario) {
      setPerfil(null);
      return;
    }

    supabase
      .from('usuarios')
      .select('nombre, rol')
      .eq('id', usuario.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error('Error al buscar el perfil:', error.message);
          return;
        }
        setPerfil(data);
      });
  }, [usuario]);

  async function iniciarSesion(email, contrasena) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: contrasena,
    });
    return { error };
  }

  async function registrarse(nombre, email, contrasena) {
    const { error } = await supabase.auth.signUp({
      email,
      password: contrasena,
      options: { data: { nombre } },
    });
    return { error };
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
  }

  const valor = {
    usuario,
    perfil,
    cargando,
    estaLogueado: !!usuario,
    esAdmin: perfil?.rol === 'admin',
    iniciarSesion,
    registrarse,
    cerrarSesion,
  };

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
}

export function useAuth() {
  const contexto = useContext(ContextoAuth);
  if (!contexto) {
    throw new Error('useAuth debe usarse dentro de <ProveedorAuth>');
  }
  return contexto;
}
```

### `src/router/RutaPrivada.jsx`
```jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import '../styles/cargando.css';

function RutaPrivada({ children }) {
  const { estaLogueado, cargando } = useAuth();

  if (cargando) {
    return <p className="cargando">Cargando...</p>;
  }

  if (!estaLogueado) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

export default RutaPrivada;
```

### `src/styles/cargando.css`
```css
.cargando {
  text-align: center;
  margin-top: 2rem;
  color: var(--color-texto-secundario);
  font-family: var(--fuente-base);
}
```

### `src/styles/formularioAuth.css`
```css
.formulario-auth {
  max-width: 360px;
  margin: 3rem auto;
  padding: 2rem;
  background-color: var(--color-fondo-alt);
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-borde);
  font-family: var(--fuente-base);
  color: var(--color-texto);
}

.formulario-auth h1 {
  color: var(--color-primario);
  margin-top: 0;
  margin-bottom: 1.5rem;
  text-align: center;
}

.formulario-auth form {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.formulario-auth label {
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  margin-top: 0.5rem;
}

.formulario-auth input {
  padding: 0.5rem 0.6rem;
  border-radius: var(--radio-borde);
  border: 1px solid var(--color-borde);
  background-color: var(--color-fondo);
  color: var(--color-texto);
  font-family: var(--fuente-base);
}

.formulario-auth input:focus {
  outline: 2px solid var(--color-secundario);
}

.formulario-auth button {
  margin-top: 1.2rem;
  padding: 0.6rem;
  border: none;
  border-radius: var(--radio-borde);
  background-color: var(--color-primario);
  color: var(--color-fondo);
  font-weight: bold;
  cursor: pointer;
}

.formulario-auth button:hover {
  background-color: var(--color-primario-hover);
}

.formulario-auth button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.formulario-auth-error {
  color: var(--color-error);
  font-size: 0.85rem;
  margin: 0.4rem 0 0;
}

.formulario-auth-exito {
  color: var(--color-exito);
  font-size: 0.85rem;
  margin: 0.4rem 0 0;
}

.formulario-auth p {
  text-align: center;
  font-size: 0.85rem;
  color: var(--color-texto-secundario);
  margin-top: 1.2rem;
}

.formulario-auth a {
  color: var(--color-secundario);
}
```

### `src/pages/Login.jsx`
```jsx
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
```

### `src/pages/Registro.jsx`
```jsx
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
```

### `src/components/Navegacion.jsx`
```jsx
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import './Navegacion.css';

function Navegacion() {
  const { estaLogueado, perfil, cerrarSesion } = useAuth();
  const navegar = useNavigate();

  async function manejarLogout() {
    await cerrarSesion();
    navegar('/login');
  }

  return (
    <nav className="navegacion-temporal">
      <Link to="/">Inicio</Link>
      <Link to="/catalogo">Catálogo</Link>

      {!estaLogueado && (
        <>
          <Link to="/login">Login</Link>
          <Link to="/registro">Registro</Link>
        </>
      )}

      {estaLogueado && (
        <>
          <Link to="/perfil">Perfil{perfil?.nombre ? ` (${perfil.nombre})` : ''}</Link>
          <Link to="/favoritos">Favoritos</Link>
          <Link to="/sugerir">Sugerir juego</Link>
          <Link to="/mis-sugerencias">Mis sugerencias</Link>
          <Link to="/admin/usuarios">Admin: Usuarios</Link>
          <Link to="/admin/sugerencias">Admin: Sugerencias</Link>
          <button className="navegacion-boton-salir" onClick={manejarLogout}>
            Cerrar sesión
          </button>
        </>
      )}
    </nav>
  );
}

export default Navegacion;
```

### `src/components/Navegacion.css`
```css
.navegacion-temporal {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-fondo-alt);
  border-bottom: 1px solid var(--color-borde);
}

.navegacion-temporal a {
  color: var(--color-secundario);
  text-decoration: none;
  font-family: var(--fuente-base);
  font-size: 0.9rem;
}

.navegacion-temporal a:hover {
  color: var(--color-primario);
  text-decoration: underline;
}

.navegacion-boton-salir {
  margin-left: auto;
  padding: 0.35rem 0.7rem;
  border: 1px solid var(--color-error);
  border-radius: var(--radio-borde);
  background-color: transparent;
  color: var(--color-error);
  font-family: var(--fuente-base);
  font-size: 0.85rem;
  cursor: pointer;
}

.navegacion-boton-salir:hover {
  background-color: var(--color-error);
  color: var(--color-fondo);
}
```

### `src/App.jsx`
```jsx
import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from './contexto/ContextoAuth';
import Navegacion from './components/Navegacion';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Navegacion />
        <AppRouter />
      </ProveedorAuth>
    </BrowserRouter>
  );
}

export default App;
```

---

## 3. Antes de copiar estos archivos: actualizar imports por el cambio de carpeta

La carpeta `src/estilos/` pasó a llamarse `src/styles/`. Los archivos de las Partes 1 y 2 que NO se tocan en esta parte todavía apuntan a la ruta vieja y hay que corregirlos a mano (búsqueda y reemplazo en el editor):

- `src/main.jsx`: cambiar `import './estilos/variables.css'` por `import './styles/variables.css'`
- Todas las páginas que siguen siendo placeholder (`Inicio.jsx`, `Catalogo.jsx`, `DetalleJuego.jsx`, `Perfil.jsx`, `Favoritos.jsx`, `SugerirJuego.jsx`, `MisSugerencias.jsx`, `AdminUsuarios.jsx`, `AdminSugerencias.jsx`, `NoEncontrada.jsx`): cambiar `import '../estilos/paginaTemporal.css'` por `import '../styles/paginaTemporal.css'`

En VS Code: `Ctrl+Shift+H` (Windows) o `Cmd+Shift+H` (Mac), buscar `estilos/` y reemplazar por `styles/` en todo el proyecto.

## 4. Cómo probarlo

1. Copiar los archivos de este ZIP dentro de `src/`, respetando la estructura (van a reemplazar `Login.jsx`, `Registro.jsx`, `App.jsx`, `Navegacion.jsx`, `Navegacion.css`, `RutaPrivada.jsx`, y agregan `ContextoAuth.jsx`, `cargando.css`, `formularioAuth.css`).
2. Corregir los imports viejos de `estilos/` a `styles/` (punto 3 de arriba).
3. Confirmar que el `.env` tiene `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` reales, y reiniciar `npm run dev`.
4. Ir a `/registro`, crear una cuenta de prueba. Debería aparecer "Cuenta creada. Ya podés iniciar sesión." (o, si tenés la confirmación por email activada en Supabase, revisar la casilla).
5. Ir a `/login` e iniciar sesión con esa cuenta. Debería redirigir a `/` y la `Navegacion` debería mostrar ahora Perfil, Favoritos, etc., y el botón "Cerrar sesión".
6. Probar entrar a una ruta privada (ej: `/favoritos`) sin estar logueado (abrir en una ventana de incógnito) — debería redirigir a `/login`.
7. Probar "Cerrar sesión" — debería volver a mostrar Login/Registro en el menú.
8. En Supabase → Table Editor → `usuarios`, verificar que apareció la fila del usuario nuevo con el `nombre` correcto y `rol = 'usuario'`. Para probar el panel de admin más adelante, cambiar ese `rol` a `'admin'` a mano.

## 5. Pendiente / a definir en próximas partes
- El primer usuario admin se sigue creando a mano en el Table Editor de Supabase, no hay pantalla para eso.
- `Perfil.jsx` sigue siendo un placeholder — todavía no muestra los datos del usuario logueado ni el modal de cambio de contraseña.
- Falta el hook `useValidacion` reusable (por ahora la validación de Login/Registro es manual e inline).
- Falta el sistema de alertas/toast (`ContextoAlerta` + `useAlerta`) — por ahora los errores se muestran como texto simple dentro del formulario.
- Las pantallas públicas (Inicio, Catálogo) y el resto de las privadas siguen siendo placeholders.
