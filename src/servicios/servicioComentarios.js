import { supabase } from './supabaseClient';

/*
  servicioComentarios.js — nuevo en la Parte 14.
  -------------------------------------------------
  CRUD contra `comentarios_juego` (ver sql/parte-14-comentarios.sql).
  juego_id viaja como texto: sirve tanto para el id numérico de RAWG
  como para el id con prefijo "local-" de un juego local (Parte 12) —
  quien llama a estas funciones (ComentariosJuego.jsx) no necesita saber
  cuál de los dos es, simplemente le pasa el id tal como vino de la URL.

  No hay una función "editarComentario": no se puede modificar un
  comentario ya publicado (se borra y se vuelve a escribir) — decisión
  tomada para mantener esto simple, reflejada también en que la tabla
  no tiene política de RLS para UPDATE.
*/

export async function obtenerComentariosDeJuego(juegoId) {
  const { data, error } = await supabase
    .from('comentarios_juego')
    .select('*')
    .eq('juego_id', juegoId)
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al traer los comentarios: ${error.message}`);
  }

  return data;
}

// No se manda nombre_autor: lo completa solo el trigger de la base
// (completar_nombre_autor_comentario), mirando quién está logueado de
// verdad — así nadie puede comentar con un nombre que no es el suyo.
export async function crearComentario(usuarioId, juegoId, contenido) {
  const { error } = await supabase.from('comentarios_juego').insert({
    usuario_id: usuarioId,
    juego_id: juegoId,
    contenido,
  });

  if (error) {
    throw new Error(`Error al publicar el comentario: ${error.message}`);
  }
}

// La política de RLS ya exige que sea propio o que quien borra sea
// admin — acá no se duplica ese chequeo, si el pedido no cumple la
// condición, Supabase directamente no borra nada y devuelve error.
export async function eliminarComentario(id) {
  const { error } = await supabase.from('comentarios_juego').delete().eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar el comentario: ${error.message}`);
  }
}

// Parte 16: para el bloque de estadísticas del Perfil.
export async function contarComentariosDeUsuario(usuarioId) {
  const { count, error } = await supabase
    .from('comentarios_juego')
    .select('id', { count: 'exact', head: true })
    .eq('usuario_id', usuarioId);

  if (error) {
    throw new Error(`Error al contar comentarios: ${error.message}`);
  }

  return count ?? 0;
}
