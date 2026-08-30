import { supabase } from './supabaseClient';
import { borrarImagenJuego } from './servicioImagenes';

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

  Parte 11: se agregan crearJuegoComoAdmin (usada por AgregarJuego, el
  formulario propio del admin) y obtenerJuegosAgregadosPorAdmin (usada
  por el carrusel del Perfil). No fue necesario tocar ninguna función
  existente: editarSugerencia ya aceptaba un objeto de cambios genérico
  (sirve tal cual para completar género/año/imagen/requisitos), y
  obtenerTodasLasSugerencias ya hace `select('*')`, así que las columnas
  nuevas de la tabla vienen incluidas solas.
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
//
// Se borra la imagen del bucket antes de borrar la fila (por si un admin
// ya le había cargado una imagen mientras la completaba, sin llegar a
// aprobarla todavía) — si no, quedaría huérfana en Storage.
export async function eliminarSugerenciaPropia(id) {
  const { data: fila } = await supabase
    .from('sugerencias')
    .select('imagen_url')
    .eq('id', id)
    .maybeSingle();

  if (fila?.imagen_url) {
    await borrarImagenJuego(fila.imagen_url);
  }

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

// Borra la imagen del bucket (si la fila tenía una cargada) antes de
// borrar la fila de `sugerencias` — así no queda un archivo huérfano en
// Storage sin nada que lo referencie. Se busca imagen_url con un select
// aparte en vez de pedirle al llamador que pase el objeto completo, para
// que la firma de esta función siga siendo simple (solo el id) sin
// importar desde dónde se la llame.
export async function eliminarSugerencia(id) {
  const { data: fila } = await supabase
    .from('sugerencias')
    .select('imagen_url')
    .eq('id', id)
    .maybeSingle();

  if (fila?.imagen_url) {
    await borrarImagenJuego(fila.imagen_url);
  }

  const { error } = await supabase.from('sugerencias').delete().eq('id', id);

  if (error) {
    throw new Error(`Error al eliminar la sugerencia: ${error.message}`);
  }
}

// --- Usadas por AgregarJuego (admin, Caso A) y Perfil (Parte 11) --------

// El admin agrega un juego directamente, sin pasar por el flujo de
// sugerencia + revisión de un usuario común. Sigue siendo un INSERT en
// la misma tabla `sugerencias` — es el trigger de la base
// (forzar_estado_inicial_sugerencia, ver
// sql/parte-11-agregar-juegos-admin.sql) el que decide, mirando si quien
// inserta es admin, si el registro queda 'pendiente' o 'aprobado' de
// una. Por eso acá no se manda ningún `estado` a mano: no serviría de
// nada, la base lo pisa igual según quién esté logueado de verdad.
export async function crearJuegoComoAdmin(usuarioId, datos) {
  const { error } = await supabase.from('sugerencias').insert({
    usuario_id: usuarioId,
    nombre_juego: datos.nombreJuego,
    plataforma: datos.plataforma || null,
    genero: datos.genero || null,
    anio_lanzamiento: datos.anioLanzamiento || null,
    descripcion: datos.descripcion,
    requisitos_minimos: datos.requisitosMinimos || null,
    requisitos_recomendados: datos.requisitosRecomendados || null,
    imagen_url: datos.imagenUrl,
  });

  if (error) {
    throw new Error(`Error al agregar el juego: ${error.message}`);
  }
}

// Juegos que este admin agregó él mismo (creado_por_admin = true) y ya
// quedaron aprobados (siempre lo están, por el trigger — pero se filtra
// igual por las dudas de que algún día se agregue un estado intermedio).
// La usa el carrusel del Perfil (Parte 11).
export async function obtenerJuegosAgregadosPorAdmin(usuarioId) {
  const { data, error } = await supabase
    .from('sugerencias')
    .select('*')
    .eq('usuario_id', usuarioId)
    .eq('creado_por_admin', true)
    .eq('estado', 'aprobado')
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al traer tus juegos agregados: ${error.message}`);
  }

  return data;
}
