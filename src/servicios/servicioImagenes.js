import { supabase } from './supabaseClient';

/*
  servicioImagenes.js — nuevo en la Parte 11.
  ---------------------------------------------
  Primera vez que el proyecto sube archivos reales (hasta ahora todo era
  texto o URLs que ya venían de RAWG). Usa Supabase Storage, en el bucket
  público "imagenes-juegos" (ver sql/parte-11-agregar-juegos-admin.sql) —
  subir un archivo ahí queda restringido a admins por política de RLS de
  Storage, aunque cualquiera pueda VER la imagen una vez subida (bucket
  público).
*/

const BUCKET_IMAGENES_JUEGOS = 'imagenes-juegos';

// Sube un archivo de imagen y devuelve su URL pública. El nombre de
// archivo se genera con un id al azar (no se usa el nombre original) para
// evitar que dos admins subiendo "portada.jpg" el mismo día se pisen el
// archivo del otro.
export async function subirImagenJuego(archivo) {
  const extension = archivo.name.split('.').pop();
  const nombreArchivo = `${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES_JUEGOS)
    .upload(nombreArchivo, archivo);

  if (error) {
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage
    .from(BUCKET_IMAGENES_JUEGOS)
    .getPublicUrl(nombreArchivo);

  return data.publicUrl;
}

// Borra un archivo del bucket a partir de su URL pública (la URL termina
// en ".../imagenes-juegos/<nombre-de-archivo>", así que alcanza con
// cortar por ese segmento para recuperar el nombre).
//
// La usa servicioSugerencias.eliminarSugerencia / eliminarSugerenciaPropia
// antes de borrar la fila, para no dejar un archivo huérfano en Storage
// sin ninguna fila que lo referencie. Si algo falla acá (por ejemplo, la
// URL no tiene el formato esperado), se loguea el error pero no se
// interrumpe el borrado de la fila — perder la fila de la base es peor
// que dejar un archivo de más en el bucket.
export async function borrarImagenJuego(urlPublica) {
  if (!urlPublica) return;

  const nombreArchivo = urlPublica.split(`${BUCKET_IMAGENES_JUEGOS}/`).pop();

  const { error } = await supabase.storage
    .from(BUCKET_IMAGENES_JUEGOS)
    .remove([nombreArchivo]);

  if (error) {
    console.error('Error al borrar la imagen del bucket:', error.message);
  }
}

// --- Parte 16: foto de perfil y portada, elegidas por el usuario --------

const BUCKET_PERFIL_USUARIOS = 'perfil-usuarios';

// A diferencia de subirImagenJuego (nombre de archivo al azar, porque
// puede haber muchas filas de sugerencias con imágenes distintas), acá el
// nombre es siempre el mismo por usuario ("<id>/avatar.<ext>") y se sube
// con upsert: true — cada usuario tiene como mucho un avatar, así que
// reemplazar el archivo anterior es lo correcto, no acumular uno nuevo
// por cada cambio.
async function subirImagenDePerfil(usuarioId, archivo, nombreBase) {
  // TEMPORAL — solo para diagnosticar, se saca después.
  const { data: sesionActual } = await supabase.auth.getSession();
  console.log('DEBUG sesión al subir imagen de perfil:', {
    haySession: !!sesionActual.session,
    userIdDeLaSesion: sesionActual.session?.user?.id,
    usuarioIdRecibido: usuarioId,
    coinciden: sesionActual.session?.user?.id === usuarioId,
    expiraEn: sesionActual.session?.expires_at,
  });

  const extension = archivo.name.split('.').pop();
  const ruta = `${usuarioId}/${nombreBase}.${extension}`;

  const { error } = await supabase.storage
    .from(BUCKET_PERFIL_USUARIOS)
    .upload(ruta, archivo, { upsert: true });

  if (error) {
    throw new Error(`Error al subir la imagen: ${error.message}`);
  }

  const { data } = supabase.storage.from(BUCKET_PERFIL_USUARIOS).getPublicUrl(ruta);

  // Como el nombre de archivo es siempre el mismo (upsert), la URL
  // pública en sí no cambia entre una foto y la siguiente — sin este
  // parámetro, el navegador podría seguir mostrando la imagen vieja
  // desde su caché en vez de notar que el archivo cambió.
  return `${data.publicUrl}?actualizado=${Date.now()}`;
}

export function subirAvatar(usuarioId, archivo) {
  return subirImagenDePerfil(usuarioId, archivo, 'avatar');
}

export function subirPortada(usuarioId, archivo) {
  return subirImagenDePerfil(usuarioId, archivo, 'portada');
}