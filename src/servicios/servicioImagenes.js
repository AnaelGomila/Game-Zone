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
