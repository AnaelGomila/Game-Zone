import { supabase } from './supabaseClient';

/*
  servicioSugerencias.js — nuevo en la Parte 6.
  ---------------------------------------------------
  CRUD contra la tabla `sugerencias` (ver sql/parte-6-esquema-y-rls.sql).
  Es la entidad ABM principal del proyecto, definida desde la Parte 1:
  el usuario propone, el admin aprueba/edita/rechaza/elimina.

  Las funciones de "solo lectura propia" (crearSugerencia,
  obtenerSugerenciasDeUsuario, eliminarSugerenciaPropia) las usan
  SugerirJuego y MisSugerencias. Las de administración (obtenerTodas,
  actualizarEstado, editarSugerencia, eliminarSugerencia) las usa
  AdminSugerencias — la propia política de RLS de Supabase es la que
  reచhaza el pedido si quien lo hace no es admin, así que no hace falta
  duplicar ese chequeo acá en el cliente.
*/

// --- Usadas por SugerirJuego y MisSugerencias ---------------------------

export async function crearSugerencia(usuarioId, { nombreJuego, plataforma, descripcion }) {
  const { error } = await supabase.from('sugerencias').insert({
    usuario_id: usuarioId,
    nombre_juego: nombreJuego,
    plataforma,
    descripcion,
    estado: 'pendiente',
  });

  if (error) {
    throw new Error(`Error al enviar la sugerencia: ${error.message}`);
  }
}

export async function obtenerSugerenciasDeUsuario(usuarioId) {
  const { data, error } = await supabase
    .from('sugerencias')
    .select('*')
    .eq('usuario_id', usuarioId)
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al traer tus sugerencias: ${error.message}`);
  }

  return data;
}

// Un usuario común solo puede borrar sus propias sugerencias mientras
// siguen en estado 'pendiente' (la policy de RLS lo exige igual, esto
// evita mandar un pedido que sabemos que va a fallar).
export async function eliminarSugerenciaPropia(id) {
  const { error } = await supabase.from('sugerencias').delete().eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar la sugerencia: ${error.message}`);
  }
}

// --- Usadas por AdminSugerencias -----------------------------------------

export async function obtenerTodasLasSugerencias() {
  const { data, error } = await supabase
    .from('sugerencias')
    .select('*, usuarios ( nombre )')
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al traer las sugerencias: ${error.message}`);
  }

  return data;
}

export async function actualizarEstadoSugerencia(id, estado, comentarioAdmin = '') {
  const { error } = await supabase
    .from('sugerencias')
    .update({ estado, comentario_admin: comentarioAdmin || null })
    .eq('id', id);

  if (error) {
    throw new Error(`Error al actualizar la sugerencia: ${error.message}`);
  }
}

export async function editarSugerencia(id, cambios) {
  const { error } = await supabase.from('sugerencias').update(cambios).eq('id', id);

  if (error) {
    throw new Error(`Error al editar la sugerencia: ${error.message}`);
  }
}

export async function eliminarSugerencia(id) {
  const { error } = await supabase.from('sugerencias').delete().eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar la sugerencia: ${error.message}`);
  }
}
