// redimensionarImagen.js — nuevo en la Parte 17.
// -------------------------------------------------
// Redimensiona una imagen del lado del navegador antes de subirla, pero
// SOLO si supera cierto tamaño — evita subir fotos de celular enormes
// (varios MB, miles de píxeles de lado) sin necesidad, pero sin perder
// calidad de forma perceptible: se recodifica en JPEG con calidad alta
// (0.92), no una compresión agresiva.
//
// Si la imagen ya es chica, o si algo falla en el proceso (por ejemplo,
// el navegador no puede leerla), se devuelve el archivo original tal
// cual — nunca se bloquea la subida por esto.

const LADO_MAXIMO_PX = 1600;
const CALIDAD_JPEG = 0.92;

export function redimensionarImagenSiHaceFalta(archivoOriginal) {
  return new Promise((resolve) => {
    if (!archivoOriginal.type.startsWith('image/')) {
      resolve(archivoOriginal);
      return;
    }

    const imagen = new Image();
    const url = URL.createObjectURL(archivoOriginal);

    imagen.onload = () => {
      URL.revokeObjectURL(url);

      const { width, height } = imagen;
      if (width <= LADO_MAXIMO_PX && height <= LADO_MAXIMO_PX) {
        resolve(archivoOriginal);
        return;
      }

      const escala = LADO_MAXIMO_PX / Math.max(width, height);
      const lienzo = document.createElement('canvas');
      lienzo.width = Math.round(width * escala);
      lienzo.height = Math.round(height * escala);

      const contexto = lienzo.getContext('2d');
      contexto.drawImage(imagen, 0, 0, lienzo.width, lienzo.height);

      lienzo.toBlob(
        (blob) => {
          if (!blob) {
            resolve(archivoOriginal);
            return;
          }
          resolve(new File([blob], archivoOriginal.name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        CALIDAD_JPEG
      );
    };

    imagen.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(archivoOriginal);
    };

    imagen.src = url;
  });
}
