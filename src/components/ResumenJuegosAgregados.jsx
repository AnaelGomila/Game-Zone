import { Link } from 'react-router-dom';
import './ResumenJuegosAgregados.css';

// Cuántas tarjetas se muestran como máximo en el Perfil — el resto se ve
// entrando a Admin: Sugerencias.
const MAXIMO_A_MOSTRAR = 5;

/*
  ResumenJuegosAgregados — reemplaza a CarruselJuegosAgregados (Parte 11)
  en la Parte 16.
  ------------------------------------------------------------------------
  Antes era un carrusel (de a un juego, con ‹ › y contador). Se cambió a
  una grilla estática de hasta 5 juegos + un link "Ver todos" que lleva a
  Admin: Sugerencias — si el admin agregó muchos juegos, no tiene sentido
  duplicar en el Perfil la misma navegación que ya existe en ese panel;
  alcanza con una muestra chica acá y mandarlo al lugar real para ver el
  resto.
*/
function ResumenJuegosAgregados({ juegos }) {
  if (!juegos || juegos.length === 0) {
    return (
      <p className="resumen-juegos-agregados-vacio">
        Todavía no agregaste ningún juego.{' '}
        <Link to="/admin/agregar-juego">Agregar uno</Link>
      </p>
    );
  }

  const juegosAMostrar = juegos.slice(0, MAXIMO_A_MOSTRAR);

  return (
    <div className="resumen-juegos-agregados">
      <div className="resumen-juegos-agregados-grilla">
        {juegosAMostrar.map((juego) => (
          <div key={juego.id} className="resumen-juegos-agregados-tarjeta">
            {juego.imagen_url ? (
              <img src={juego.imagen_url} alt={juego.nombre_juego} />
            ) : (
              <div className="resumen-juegos-agregados-sin-imagen">Sin imagen</div>
            )}
            <div className="resumen-juegos-agregados-texto">
              <h3>{juego.nombre_juego}</h3>
              <p>
                {[juego.genero, juego.anio_lanzamiento, juego.plataforma]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
          </div>
        ))}
      </div>

      <Link to="/admin/sugerencias" className="resumen-juegos-agregados-ver-mas">
        Ver todos en Admin: Sugerencias →
      </Link>
    </div>
  );
}

export default ResumenJuegosAgregados;
