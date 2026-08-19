import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../servicios/supabaseClient';

/*
  ContextoAuth
  ------------
  Maneja la sesión de Supabase Auth para toda la app.

  Separa dos cosas:
  - "usuario": lo que devuelve Supabase Auth (id, email). Se sabe al toque.
  - "perfil": la fila correspondiente en la tabla "usuarios" (nombre, rol).
    Se busca en un segundo paso, apenas sabemos el id del usuario logueado.

  "esAdmin" se calcula a partir del rol del perfil, y lo van a usar más
  adelante las pantallas de administración para decidir si mostrar
  el panel o no.
*/

const ContextoAuth = createContext(null);

export function ProveedorAuth({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Al montar: revisa si ya hay sesión activa (ej: recargaste la página)
  // y se suscribe a cambios futuros (login, logout, refresh de token).
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

  // Cada vez que cambia el usuario logueado, busca su perfil (nombre, rol)
  // en la tabla "usuarios".
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
    // El "nombre" viaja en options.data: el trigger que creamos en Supabase
    // lo lee de ahí para crear automáticamente la fila en "usuarios".
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
