import { useParams } from 'react-router-dom';
import '../styles/paginaTemporal.css';

function DetalleJuego() {
  // useParams lee el parámetro dinámico de la URL, definido en la ruta
  // como "/juego/:id". Por ejemplo, en "/juego/42", id va a ser "42".
  const { id } = useParams();

  return (
    <div className="pagina-temporal">
      <h1>Detalle de juego</h1>
      <p>Pantalla privada. ID del juego recibido por la URL: {id}</p>
    </div>
  );
}

export default DetalleJuego;
