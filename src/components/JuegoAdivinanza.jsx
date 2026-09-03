import { useEffect, useState } from 'react';
import { obtenerCapturas } from '../servicios/servicioRawg';
import './JuegoAdivinanza.css';

const TOTAL_PREGUNTAS = 5;
const OPCIONES_POR_PREGUNTA = 4;
// Cuántos juegos distintos del mazo se prueban buscando uno que tenga
// capturas cargadas en RAWG, antes de resignarse y usar la carátula
// como respaldo — no todos los juegos tienen screenshots.
const INTENTOS_CAPTURA = 3;

// Elige `cantidad` elementos al azar de una lista, sin repetir ninguno.
function elegirAlAzar(lista, cantidad) {
  const copia = [...lista];
  const elegidos = [];
  while (elegidos.length < cantidad && copia.length > 0) {
    const indice = Math.floor(Math.random() * copia.length);
    elegidos.push(copia.splice(indice, 1)[0]);
  }
  return elegidos;
}

/*
  JuegoAdivinanza — nuevo.
  ----------------------------
  Mecánica compartida entre los dos modos de Minijuegos.jsx: se elige un
  juego al azar del mazo como respuesta correcta, se arman 4 opciones (la
  correcta + 3 distractores del mismo mazo, mezcladas), y se muestra una
  imagen — la carátula (modo="portada") o una captura de pantalla
  borrosa que se destapa al responder (modo="captura").

  El mazo (`pool`) lo arma y pasa Minijuegos.jsx una sola vez (populares
  + mejor valorados combinados) — acá no se vuelve a pedir nada a RAWG
  salvo, en modo "captura", las screenshots del juego elegido en cada
  pregunta (obtenerCapturas, Parte 9). Como no todos los juegos tienen
  capturas cargadas, si el elegido no tiene ninguna se prueba con otro
  juego al azar del mazo (hasta INTENTOS_CAPTURA veces) antes de usar su
  carátula como respaldo, para no dejar la pregunta sin imagen.
*/
function JuegoAdivinanza({ modo, pool }) {
  const [numeroPregunta, setNumeroPregunta] = useState(1);
  const [aciertos, setAciertos] = useState(0);
  const [terminado, setTerminado] = useState(false);

  const [cargandoPregunta, setCargandoPregunta] = useState(true);
  const [imagenUrl, setImagenUrl] = useState('');
  const [juegoCorrecto, setJuegoCorrecto] = useState(null);
  const [opciones, setOpciones] = useState([]);
  const [seleccion, setSeleccion] = useState(null);

  useEffect(() => {
    let cancelado = false;

    async function armarPregunta() {
      setCargandoPregunta(true);
      setSeleccion(null);

      let elegido = null;
      let urlImagen = '';

      if (modo === 'captura') {
        for (let intento = 0; intento < INTENTOS_CAPTURA && !urlImagen; intento++) {
          const [candidato] = elegirAlAzar(pool, 1);
          try {
            const capturas = await obtenerCapturas(candidato.id);
            if (capturas.length > 0) {
              elegido = candidato;
              urlImagen = capturas[Math.floor(Math.random() * capturas.length)].image;
            }
          } catch (error) {
            console.error('Error al traer capturas:', error.message);
          }
        }
        if (!urlImagen && elegido) {
          urlImagen = elegido.background_image;
        }
      }

      if (!elegido) {
        [elegido] = elegirAlAzar(pool, 1);
        urlImagen = urlImagen || elegido.background_image;
      }

      const distractores = elegirAlAzar(
        pool.filter((juego) => juego.id !== elegido.id),
        OPCIONES_POR_PREGUNTA - 1
      );
      const mezcladas = elegirAlAzar([elegido, ...distractores], OPCIONES_POR_PREGUNTA);

      if (cancelado) return;
      setJuegoCorrecto(elegido);
      setImagenUrl(urlImagen);
      setOpciones(mezcladas);
      setCargandoPregunta(false);
    }

    armarPregunta();
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numeroPregunta]);

  function manejarElegir(opcion) {
    if (seleccion) return;
    setSeleccion(opcion);
    if (opcion.id === juegoCorrecto.id) {
      setAciertos((actual) => actual + 1);
    }
  }

  function manejarSiguiente() {
    if (numeroPregunta === TOTAL_PREGUNTAS) {
      setTerminado(true);
    } else {
      setNumeroPregunta((actual) => actual + 1);
    }
  }

  function manejarJugarDeNuevo() {
    setAciertos(0);
    setTerminado(false);
    setNumeroPregunta(1);
  }

  if (terminado) {
    return (
      <div className="juego-adivinanza-final">
        <p className="juego-adivinanza-puntaje">
          {aciertos} / {TOTAL_PREGUNTAS} correctas
        </p>
        <button type="button" onClick={manejarJugarDeNuevo}>
          Jugar de nuevo
        </button>
      </div>
    );
  }

  return (
    <div className="juego-adivinanza">
      <p className="juego-adivinanza-progreso">
        Pregunta {numeroPregunta} / {TOTAL_PREGUNTAS} · Aciertos: {aciertos}
      </p>

      {cargandoPregunta ? (
        <p className="cargando">Preparando la pregunta...</p>
      ) : (
        <>
          <div className="juego-adivinanza-imagen-contenedor">
            <img
              src={imagenUrl}
              alt="¿Qué juego es?"
              className={
                modo === 'captura' && !seleccion
                  ? 'juego-adivinanza-imagen borrosa'
                  : 'juego-adivinanza-imagen'
              }
            />
          </div>

          <div className="juego-adivinanza-opciones">
            {opciones.map((opcion) => {
              let clase = '';
              if (seleccion) {
                if (opcion.id === juegoCorrecto.id) clase = 'correcta';
                else if (opcion.id === seleccion.id) clase = 'incorrecta';
              }
              return (
                <button
                  key={opcion.id}
                  type="button"
                  className={clase}
                  disabled={!!seleccion}
                  onClick={() => manejarElegir(opcion)}
                >
                  {opcion.name}
                </button>
              );
            })}
          </div>

          {seleccion && (
            <button
              type="button"
              className="juego-adivinanza-siguiente"
              onClick={manejarSiguiente}
            >
              {numeroPregunta === TOTAL_PREGUNTAS ? 'Ver resultado' : 'Siguiente →'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

export default JuegoAdivinanza;
