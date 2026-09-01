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
    .select('id, nombre, rol, titulo_admin')
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

// Parte 16: un usuario actualiza su propia fila (por ahora, avatar_url y/o
// portada_url) — distinta de cambiarRolUsuario porque esta la llama
// cualquier usuario sobre sí mismo, no un admin sobre otro. La política
// de RLS "Usuarios actualizan su propio perfil" (sql/parte-16-...) es la
// que garantiza que `cambios` nunca pueda tocar la fila de otro usuario,
// y el trigger evitar_cambio_rol_no_admin (Parte 6) sigue protegiendo
// `rol` independientemente de esto.
export async function actualizarPerfilPropio(usuarioId, cambios) {
  const { error } = await supabase.from('usuarios').update(cambios).eq('id', usuarioId);

  if (error) {
    throw new Error(`Error al actualizar el perfil: ${error.message}`);
  }
}

// Parte 17: trae el perfil público de CUALQUIER usuario (no solo el
// propio) — la usa Perfil.jsx cuando se entra a /usuario/:id. Funciona
// gracias a la política de RLS nueva "Usuarios logueados ven cualquier
// perfil" (sql/parte-17-perfil-publico.sql). No se pide el email acá
// tampoco: sigue sin existir en esta tabla, ver nota de arriba.
export async function obtenerUsuarioPorId(id) {
  const { data, error } = await supabase
    .from('usuarios')
    .select(
      'id, nombre, nickname, nacionalidad, rol, avatar_url, portada_url, redes_sociales, titulo_admin, color_texto'
    )
    .eq('id', id)
    .single();

  if (error) {
    throw new Error(`Error al traer el perfil: ${error.message}`);
  }

  return data;
}

// Parte 17: título cosmético que un admin le puede poner a cualquier
// usuario (o a sí mismo) desde AdminUsuarios — no es lo mismo que `rol`
// (que controla permisos). Queda reforzado por el trigger
// evitar_cambio_titulo_admin_no_admin (sql/parte-17-...), que revierte
// cualquier intento de cambiarlo desde una cuenta que no sea admin.
export async function actualizarTituloAdmin(id, titulo) {
  const { error } = await supabase
    .from('usuarios')
    .update({ titulo_admin: titulo || null })
    .eq('id', id);

  if (error) {
    throw new Error(`Error al actualizar el título: ${error.message}`);
  }
}
