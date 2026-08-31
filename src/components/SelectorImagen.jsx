import { useState } from 'react';
import './SelectorImagen.css';

/*
  SelectorImagen — nuevo en la Parte 11, reutilizable.
  -----------------------------------------------------
  Input de archivo con preview antes de subir nada. Lo usan AgregarJuego
  (Caso A), ModalEditarSugerencia (Caso B) y, desde la Parte 16, Perfil
  (avatar y portada) — así que se separó en vez de duplicar la lógica de
  preview en cada formulario.

  La subida real a Supabase Storage NO pasa acá — este componente solo
  guarda el archivo elegido en memoria y llama a onCambio(archivo). Quien
  lo usa decide cuándo subirlo (recién al confirmar el cambio).

  variante="circular" (Parte 16, la usa el avatar en Perfil) muestra la
  preview redonda en vez del rectángulo por defecto que usan las
  imágenes de juego — mismo componente, un solo prop distinto.
*/
function SelectorImagen({ valorActual, onCambio, variante }) {
  const [previsualizacion, setPrevisualizacion] = useState(valorActual || '');
  const esCircular = variante === 'circular';

  function manejarCambio(evento) {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    setPrevisualizacion(URL.createObjectURL(archivo));
    onCambio(archivo);
  }

  return (
    <div className="selector-imagen">
      {previsualizacion ? (
        <img
          src={previsualizacion}
          alt="Vista previa"
          className={
            esCircular ? 'selector-imagen-preview selector-imagen-preview-circular' : 'selector-imagen-preview'
          }
        />
      ) : (
        <div
          className={
            esCircular ? 'selector-imagen-vacio selector-imagen-vacio-circular' : 'selector-imagen-vacio'
          }
        >
          Sin imagen todavía
        </div>
      )}
      <input type="file" accept="image/*" onChange={manejarCambio} />
    </div>
  );
}

export default SelectorImagen;
