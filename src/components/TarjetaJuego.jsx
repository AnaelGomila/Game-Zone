import { Link } from 'react-router-dom';
import './TarjetaJuego.css';

/*
  TarjetaJuego — Parte 6: agrega el prop opcional `pie`.
  ---------------------------------------------------------
  Sin `pie` (el caso de Catalogo.jsx, que no cambia), se comporta
  EXACTAMENTE igual que en la Parte 4: un <Link> completo a /juego/:id.

  Con `pie` (el caso nuevo de Favoritos.jsx), se envuelve en un <div> que
  agrega debajo del Link el contenido de `pie` — pensado para el botón
  "Quitar de favoritos", que no puede ir DENTRO del <Link> (un botón
  dentro de un link anidaría elementos interactivos, inválido en HTML y
  problemático para navegación por teclado).
*/
function TarjetaJuego({ juego, pie }) {
  const generos = juego.genres?.map((genero) => genero.name).join(', ');

  const contenido = (
    <>
      {juego.background_image ? (
        <img src={juego.background_image} alt={juego.name} />
      ) : (
        <div className="tarjeta-juego-sin-imagen">Sin imagen</div>
      )}

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
