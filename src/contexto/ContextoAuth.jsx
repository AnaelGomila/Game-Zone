import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../servicios/supabaseClient';

/*
  ContextoAuth — sin cambios respecto a la Parte 3. Se incluye acá tal
  cual para que el ZIP de la Parte 6 quede completo y listo para copiar
  directo a src/, sin tener que ir a buscar este archivo a un ZIP viejo.
*/

/*
  ContextoAuth — Parte 3, extendido en la Parte 16.
  ---------------------------------------------------
  Parte 16: el select de `usuarios` ahora trae también avatar_url y
  portada_url (foto de perfil y fondo, elegidos por el usuario), y se
  agrega refrescarPerfil() — Perfil.jsx la llama después de guardar una
  foto nueva, para que tanto la propia pantalla de Perfil como el
  círculo de AvatarMenu (en la barra superior) se actualicen sin
  necesidad de recargar la página.

  Baja lógica de usuarios (ajuste posterior): `activo` se chequea en dos
  lugares distintos, a propósito — iniciarSesion() lo chequea justo
  después de un login exitoso (así Login.jsx puede mostrar un mensaje
  específico, "cuenta deshabilitada", en vez de uno genérico), y
  buscarPerfil() lo vuelve a chequear cada vez que se busca el perfil
  (cubre el caso de que deshabiliten a alguien que YA tenía la sesión
  abierta — se nota recién la próxima vez que la app pide el perfil, por
  ejemplo al recargar la página). Los dos casos terminan en lo mismo:
  supabase.auth.signOut().
*/

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

  async function buscarPerfil(usuarioActual) {
    const { data, error } = await supabase
      .from('usuarios')
      .select(
        'nombre, rol, avatar_url, portada_url, nickname, nacionalidad, redes_sociales, titulo_admin, color_texto, activo'
      )
      .eq('id', usuarioActual.id)
      .single();

    if (error) {
      console.error('Error al buscar el perfil:', error.message);
      return;
    }

    // Cubre el caso de que a alguien lo deshabiliten MIENTRAS ya tenía
    // la sesión abierta (el chequeo de iniciarSesion, más abajo, solo
    // cubre el momento de loguearse) — se nota recién la próxima vez
    // que la app vuelve a pedir el perfil, por ejemplo al recargar la
    // página.
    if (data.activo === false) {
      await supabase.auth.signOut();
      return;
    }

    setPerfil(data);
  }

  useEffect(() => {
    if (!usuario) {
      setPerfil(null);
      return;
    }

    buscarPerfil(usuario);
  }, [usuario]);

  function refrescarPerfil() {
    if (!usuario) return;
    return buscarPerfil(usuario);
  }

  async function iniciarSesion(email, contrasena) {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: contrasena,
    });

    if (error) return { error };

    // Las credenciales son correctas, pero si la cuenta está
    // deshabilitada (baja lógica) no se deja continuar — se cierra la
    // sesión recién abierta de una y se devuelve un motivo específico,
    // en vez de dejar que Login.jsx navegue a "/" pensando que el login
    // funcionó de verdad.
    const {
      data: { session: sesionNueva },
    } = await supabase.auth.getSession();

    const { data: fila } = await supabase
      .from('usuarios')
      .select('activo')
      .eq('id', sesionNueva.user.id)
      .single();

    if (fila?.activo === false) {
      await supabase.auth.signOut();
      return {
        error: {
          message: 'Tu cuenta fue deshabilitada. Contactá a un administrador.',
          deshabilitada: true,
        },
      };
    }

    return { error: null };
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
    refrescarPerfil,
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
