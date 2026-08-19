import { supabase } from './supabaseClient';

/*
  servicioFavoritos.js — nuevo en la Parte 6.
  ----------------------------------------------
  CRUD contra la tabla `favoritos` (ver sql/parte-6-esquema-y-rls.sql).
  Guarda un snapshot del juego (juego_data) para no depender de volver a
  pedirle el detalle a RAWG cada vez que se abre la pantalla Favoritos, y
  para que la forma de los datos calce con lo que espera <TarjetaJuego>.
*/

// Trae los favoritos de un usuario. Devuelve un array de juegos con la
// misma forma que espera <TarjetaJuego> (id, name, background_image,
// genres, rating), reconstruidos a partir de juego_data — y se agrega
// favoritoId (el id de la fila en `favoritos`, no del juego) para poder
// borrar el favorito puntual.
export async function obtenerFavoritos(usuarioId) {
  const { data, error } = await supabase
    .from('favoritos')
    .select('id, juego_data')
    .eq('usuario_id', usuarioId)
    .order('creado_en', { ascending: false });

  if (error) {
    throw new Error(`Error al traer los favoritos: ${error.message}`);
  }

  return data.map((fila) => ({
    ...fila.juego_data,
    favoritoId: fila.id,
  }));
}

// Chequea si un juego puntual ya está en favoritos (para pintar el botón
// de DetalleJuego como "marcado" o no al entrar a la pantalla).
export async function esFavorito(usuarioId, juegoId) {
  const { data, error } = await supabase
    .from('favoritos')
    .select('id')
    .eq('usuario_id', usuarioId)
    .eq('juego_id', juegoId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al chequear favorito: ${error.message}`);
  }

  return data ? data.id : null;
}

// Agrega un juego a favoritos. `juego` es el objeto que devuelve la API
// de RAWG (o lo que ya tiene DetalleJuego en memoria) — se guarda solo lo
// que necesita <TarjetaJuego> para no inflar la fila con datos que no se
// van a usar en la grilla de Favoritos.
export async function agregarFavorito(usuarioId, juego) {
  const juegoData = {
    id: juego.id,
    name: juego.name,
    background_image: juego.background_image,
    genres: juego.genres,
    rating: juego.rating,
  };

  const { data, error } = await supabase
    .from('favoritos')
    .insert({ usuario_id: usuarioId, juego_id: juego.id, juego_data: juegoData })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Error al agregar a favoritos: ${error.message}`);
  }

  return data.id;
}

// Quita un favorito por su id de fila (favoritoId), no por juego_id — así
// no hace falta un segundo pedido para buscarlo primero.
export async function quitarFavorito(favoritoId) {
  const { error } = await supabase.from('favoritos').delete().eq('id', favoritoId);

  if (error) {
    throw new Error(`Error al quitar de favoritos: ${error.message}`);
  }
}
