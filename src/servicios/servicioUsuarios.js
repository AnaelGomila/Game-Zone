import { supabase } from './supabaseClient';

/*
  servicioUsuarios.js — nuevo en la Parte 6, usado por AdminUsuarios.
  ------------------------------------------------------------------------
  Nota importante: solo se puede leer/editar la tabla `usuarios` (nombre,
  rol, id), NO el email — el email vive en el esquema privado `auth.users`
  de Supabase, al que el cliente (clave anon) no tiene acceso directo por
  diseño de seguridad. Para ver emails en un panel de admin de verdad hay
  dos caminos: una Edge Function con la service_role key (nunca expuesta
  al navegador), o guardar una copia del email en `usuarios` al registrarse
  (duplicando el dato). Ninguno de los dos estaba pedido, así que
  AdminUsuarios.jsx trabaja solo con nombre + rol, que es lo que la RLS de
  la Parte 6 ya deja leer a un admin.
*/

export async function obtenerTodosLosUsuarios() {
  const { data, error } = await supabase
    .from('usuarios')
    .select('id, nombre, rol')
    .order('nombre', { ascending: true });

  if (error) {
    throw new Error(`Error al traer los usuarios: ${error.message}`);
  }

  return data;
}

export async function cambiarRolUsuario(id, nuevoRol) {
  const { error } = await supabase.from('usuarios').update({ rol: nuevoRol }).eq('id', id);

  if (error) {
    throw new Error(`Error al cambiar el rol: ${error.message}`);
  }
}
