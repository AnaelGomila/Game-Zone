import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../servicios/supabaseClient';

/*
  ContextoAuth — sin cambios respecto a la Parte 3. Se incluye acá tal
  cual para que el ZIP de la Parte 6 quede completo y listo para copiar
  directo a src/, sin tener que ir a buscar este archivo a un ZIP viejo.
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
