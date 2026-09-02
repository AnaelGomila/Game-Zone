import { supabase } from './supabaseClient';

/*
  servicioMensajesPerfil.js — nuevo en la Parte 18.
  -----------------------------------------------------
  CRUD contra `mensajes_perfil` (ver sql/parte-18-muro-perfil.sql). Mismo
  criterio que servicioComentarios.js: sin función "editar" (no se puede
  modificar un mensaje ya publicado), y nombre_autor/autor_es_admin los
  completa un trigger de la base, nunca se mandan desde acá.
*/

export async function obtenerMensajesDePerfil(perfilId) {
  const { data, error } = await supabase
    .from('mensajes_perfil')
    .select('*')
    .eq('perfil_id', perfilId)
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al traer los mensajes: ${error.message}`);
  }

  return data;
}

export async function crearMensajePerfil(usuarioId, perfilId, contenido) {
  const { error } = await supabase.from('mensajes_perfil').insert({
    usuario_id: usuarioId,
    perfil_id: perfilId,
    contenido,
  });

  if (error) {
    throw new Error(`Error al publicar el mensaje: ${error.message}`);
  }
}

// La política de RLS ya decide si este pedido puede borrar o no (propio,
// admin, o dueño del perfil borrando un mensaje que no es de un admin)
// — acá no se duplica ese chequeo.
export async function eliminarMensajePerfil(id) {
  const { error } = await supabase.from('mensajes_perfil').delete().eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar el mensaje: ${error.message}`);
  }
}
