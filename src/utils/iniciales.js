/*
  obtenerIniciales — Parte 7, usado por AvatarMenu.
  ----------------------------------------------------
  No hay funcionalidad de foto de perfil (no se pidió, y agregarla implica
  subida de archivos a Supabase Storage — se dejó afuera a propósito, ver
  el doc de esta parte). El avatar se arma con las iniciales del nombre:
  toma la primera letra de las primeras dos palabras del nombre ("Ana
  Gomez" → "AG"). Si todavía no cargó el perfil (nombre vacío), usa la
  primera letra del email como respaldo, y si tampoco hay nada, "?".
*/
export function obtenerIniciales(nombre, email) {
  if (nombre && nombre.trim()) {
    const palabras = nombre.trim().split(/\s+/);
    const letras = palabras.slice(0, 2).map((palabra) => palabra[0]);
    return letras.join('').toUpperCase();
  }

  if (email) {
    return email[0].toUpperCase();
  }

  return '?';
}
