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
      .select('nombre, rol, avatar_url, portada_url')
      .eq('id', usuarioActual.id)
      .single();

    if (error) {
      console.error('Error al buscar el perfil:', error.message);
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
