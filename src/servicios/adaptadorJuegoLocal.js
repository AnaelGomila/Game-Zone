/*
  adaptadorJuegoLocal.js — nuevo en la Parte 12.
  --------------------------------------------------
  Convierte una fila de `sugerencias` (aprobada, agregada por un admin o
  por un usuario) a la misma forma de datos que ya devuelve la API de
  RAWG, para que <TarjetaJuego> pueda mostrar un juego local exactamente
  igual que uno de RAWG sin saber que existe la diferencia — no hizo
  falta tocar ese componente en absoluto.

  El id se arma con el prefijo "local-" (ej: "local-3fa8...") para poder
  distinguirlo del id numérico de RAWG en la URL del Detalle
  (/juego/local-<uuid>), sin necesitar una ruta nueva en el router:
  DetalleJuego.jsx mira ese prefijo para decidir si pedir el juego a
  RAWG o a Supabase.
*/
export function adaptarJuegoLocal(sugerencia) {
  return {
    id: `local-${sugerencia.id}`,
    name: sugerencia.nombre_juego,
    background_image: sugerencia.imagen_url,
    genres: sugerencia.genero ? [{ name: sugerencia.genero }] : [],
    platforms: sugerencia.plataforma
      ? [{ platform: { name: sugerencia.plataforma } }]
      : [],
    released: sugerencia.anio_lanzamiento ? String(sugerencia.anio_lanzamiento) : null,
    rating: 0,
  };
}

export function esIdLocal(id) {
  return typeof id === 'string' && id.startsWith('local-');
}

export function extraerIdReal(idLocal) {
  return idLocal.replace('local-', '');
}
