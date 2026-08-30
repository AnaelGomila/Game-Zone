import { useState } from 'react';
import './SelectorImagen.css';

/*
  SelectorImagen — nuevo en la Parte 11, reutilizable.
  -----------------------------------------------------
  Input de archivo con preview antes de subir nada. Lo usan tanto
  AgregarJuego (Caso A) como ModalEditarSugerencia (Caso B), así que se
  separó en vez de duplicar la lógica de preview en los dos formularios.

  La subida real a Supabase Storage (servicioImagenes.subirImagenJuego)
  NO pasa acá — este componente solo guarda el archivo elegido en memoria
  y llama a onCambio(archivo). Quien lo usa decide cuándo subirlo (recién
  al enviar el formulario). Si se subiera apenas se elige el archivo y
  después el usuario cancela el formulario, quedaría un archivo huérfano
  en el bucket sin ninguna fila de `sugerencias` que lo referencie.
*/
function SelectorImagen({ valorActual, onCambio }) {
  const [previsualizacion, setPrevisualizacion] = useState(valorActual || '');

  function manejarCambio(evento) {
    const archivo = evento.target.files[0];
    if (!archivo) return;

    setPrevisualizacion(URL.createObjectURL(archivo));
    onCambio(archivo);
  }

  return (
    <div className="selector-imagen">
      {previsualizacion ? (
        <img src={previsualizacion} alt="Vista previa" className="selector-imagen-preview" />
      ) : (
        <div className="selector-imagen-vacio">Sin imagen todavía</div>
      )}
      <input type="file" accept="image/*" onChange={manejarCambio} />
    </div>
  );
}

export default SelectorImagen;
