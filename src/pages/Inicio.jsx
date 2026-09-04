import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { obtenerJuegos, obtenerGeneros } from '../servicios/servicioRawg';
import { obtenerJuegosLocalesPublicos } from '../servicios/servicioSugerencias';
import { adaptarJuegoLocal } from '../servicios/adaptadorJuegoLocal';
import CarruselInicio from '../components/CarruselInicio';
import '../styles/inicio.css';

/*
  Inicio — deja de ser placeholder en la Parte 6, ampliado después.
  ------------------------------------------------------------------------
  Pantalla pública. Reusa piezas que ya existían en otras partes del
  proyecto, sin agregar ningún servicio nuevo:
  - Destacados: obtenerJuegos({ orden: 'popular' }) — misma llamada que
    usa el Catálogo por defecto.
  - Agregados por la comunidad: obtenerJuegosLocalesPublicos() +
    adaptarJuegoLocal (Parte 12) — misma sección que ya vive al final
    del Catálogo, acá se muestra una vidriera chica con link directo a
    esa sección (/catalogo#comunidad, con el id agregado en Catalogo.jsx
    para poder saltar ahí).
  - Números del proyecto: se arman con datos que YA se están pidiendo
    para las dos vidrieras de arriba, sin ningún pedido extra —
    total de juegos sale del mismo pedido de obtenerJuegos (RAWG lo
    manda en cada respuesta), y "agregados por la comunidad" es
    simplemente el largo del array que ya se pidió. Solo géneros
    necesita su propio pedido (obtenerGeneros(), la misma función que ya
    usa la Sidebar en Catálogo/Favoritos).

  Layout: grilla de 2 columnas — a la izquierda, destacados y comunidad
  apilados uno arriba del otro (los dos "horizontales", carruseles
  anchos); a la derecha, una sola columna angosta y alta con los tres
  números apilados verticalmente, ocupando la altura combinada de los
  otros dos.
*/
function Inicio() {
  const [destacados, setDestacados] = useState([]);
  const [cargandoDestacados, setCargandoDestacados] = useState(true);
  const [totalJuegos, setTotalJuegos] = useState(null);

  const [comunidad, setComunidad] = useState([]);
  const [cargandoComunidad, setCargandoComunidad] = useState(true);

  const [totalGeneros, setTotalGeneros] = useState(null);

  useEffect(() => {
    obtenerJuegos({ orden: 'popular' })
      .then((resultado) => {
        setDestacados(resultado.juegos);
        setTotalJuegos(resultado.total);
      })
      .catch((error) => console.error('Error al traer destacados:', error.message))
      .finally(() => setCargandoDestacados(false));
  }, []);

  useEffect(() => {
    obtenerJuegosLocalesPublicos()
      .then((resultado) => setComunidad(resultado.map(adaptarJuegoLocal)))
      .catch((error) => console.error('Error al traer juegos de la comunidad:', error.message))
      .finally(() => setCargandoComunidad(false));
  }, []);

  useEffect(() => {
    obtenerGeneros()
      .then((resultado) => setTotalGeneros(resultado.length))
      .catch((error) => console.error('Error al traer géneros:', error.message));
  }, []);

  return (
    <div className="inicio">
      <div className="inicio-portada">
        <h1>Game Zone</h1>
        <p>
          Descubrí juegos, guardá tus favoritos y proponé los que todavía no
          están en el catálogo.
        </p>
        <Link to="/catalogo" className="inicio-boton">
          Ver catálogo
        </Link>
      </div>

      <div className="inicio-grid">
        <CarruselInicio
          titulo="Destacados"
          juegos={destacados}
          cargando={cargandoDestacados}
          enlace="/catalogo"
          textoEnlace="Ver más"
        />

        <CarruselInicio
          titulo="Agregados por la comunidad"
          juegos={comunidad}
          cargando={cargandoComunidad}
          enlace="/catalogo#comunidad"
          textoEnlace="Ver más"
        />

        <div className="inicio-numeros">
          <div className="inicio-numero">
            <span className="inicio-numero-valor">
              {totalJuegos != null ? totalJuegos.toLocaleString('es-AR') : '—'}
            </span>
            <span className="inicio-numero-etiqueta">Juegos disponibles</span>
          </div>

          <div className="inicio-numero">
            <span className="inicio-numero-valor">
              {cargandoComunidad ? '—' : comunidad.length}
            </span>
            <span className="inicio-numero-etiqueta">Agregados por la comunidad</span>
          </div>

          <div className="inicio-numero">
            <span className="inicio-numero-valor">
              {totalGeneros != null ? totalGeneros : '—'}
            </span>
            <span className="inicio-numero-etiqueta">Categorías distintas</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Inicio;
