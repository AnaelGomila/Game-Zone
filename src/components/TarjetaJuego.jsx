import { Link } from 'react-router-dom';
import './TarjetaJuego.css';

/*
  TarjetaJuego — Parte 7: agrega el panel de hover.
  ------------------------------------------------------
  Al pasar el cursor por arriba de la tarjeta aparece un panel con datos
  que no se ven en la tarjeta "cerrada": fecha de lanzamiento, plataformas,
  puntaje de Metacritic y género. Todos estos datos ya vienen en la
  respuesta del listado de RAWG (/games) — no hace falta pedir el detalle
  del juego para mostrarlos, se confirmó revisando la respuesta real de la
  API antes de implementar esto (ver el doc de la Parte 7).

  Es un overlay puramente CSS (opacity + visibility en :hover, sin estado
  de React): más simple y no agrega un listener por tarjeta en una grilla
  que puede tener 20 juegos a la vez.
*/
function TarjetaJuego({ juego, pie }) {
  const generos = juego.genres?.map((genero) => genero.name).join(', ');
  const plataformas = juego.platforms
    ?.map((entrada) => entrada.platform?.name)
    .filter(Boolean)
    .join(', ');

  const contenido = (
    <>
      {juego.background_image ? (
        <img src={juego.background_image} alt={juego.name} />
      ) : (
        <div className="tarjeta-juego-sin-imagen">Sin imagen</div>
      )}

      <div className="tarjeta-juego-hover">
        <p>
          <strong>Lanzamiento:</strong> {juego.released || 'Sin confirmar'}
        </p>
        {plataformas && (
          <p>
            <strong>Plataformas:</strong> {plataformas}
          </p>
        )}
        {generos && (
          <p>
            <strong>Género:</strong> {generos}
          </p>
        )}
        <p>
          <strong>Metacritic:</strong> {juego.metacritic ?? 'Sin puntaje'}
        </p>
      </div>

      <div className="tarjeta-juego-cuerpo">
        <h2>{juego.name}</h2>
        {generos && <p>{generos}</p>}
        {juego.rating > 0 && (
          <p className="tarjeta-juego-rating">★ {juego.rating}</p>
        )}
      </div>
    </>
  );

  if (!pie) {
    return (
      <Link to={`/juego/${juego.id}`} className="tarjeta-juego">
        {contenido}
      </Link>
    );
  }

  return (
    <div className="tarjeta-juego-con-pie">
      <Link to={`/juego/${juego.id}`} className="tarjeta-juego">
        {contenido}
      </Link>
      <div className="tarjeta-juego-pie">{pie}</div>
    </div>
  );
}

export default TarjetaJuego;
