import { useEffect, useState } from 'react';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  obtenerSugerenciasDeUsuario,
  eliminarSugerenciaPropia,
} from '../servicios/servicioSugerencias';
import BadgeEstado from '../components/BadgeEstado';
import '../styles/listaSugerencias.css';
import '../styles/cargando.css';

/*
  MisSugerencias — Parte 6 (placeholder → lista) + Parte 13 (género/año/
  link como campos reales).
  ----------------------------------------------------------------------
  Lista las sugerencias del usuario logueado con su estado (pendiente /
  aprobado / rechazado). Si el admin dejó un comentario al aprobar o
  rechazar (comentario_admin), se muestra debajo de la descripción.

  Género, año y link de referencia ahora son columnas reales de
  `sugerencias` (Parte 11 para género/año, Parte 13 para el link) — antes
  de esta parte, el link viajaba como texto plano dentro de la
  descripción y había que detectarlo con una expresión regular al
  mostrarlo. Al ser un campo propio, alcanza con un <a> directo.

  Solo se puede eliminar una sugerencia propia mientras sigue 'pendiente'
  (la política de RLS en Supabase lo exige igual; acá simplemente no se
  muestra el botón para las que ya fueron revisadas, para no ofrecer una
  acción que de todos modos va a fallar).
*/
function MisSugerencias() {
  const { usuario } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [sugerencias, setSugerencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!usuario) return;

    obtenerSugerenciasDeUsuario(usuario.id)
      .then((resultado) => setSugerencias(resultado))
      .catch((error) => {
        console.error('Error al traer sugerencias:', error.message);
        setError('No se pudieron cargar tus sugerencias. Probá de nuevo más tarde.');
      })
      .finally(() => setCargando(false));
  }, [usuario]);

  async function manejarEliminar(id) {
    try {
      await eliminarSugerenciaPropia(id);
      setSugerencias((actuales) => actuales.filter((sugerencia) => sugerencia.id !== id));
      mostrarAlerta('Sugerencia eliminada.', 'info');
    } catch (error) {
      console.error('Error al eliminar sugerencia:', error.message);
      mostrarAlerta('No se pudo eliminar la sugerencia.', 'error');
    }
  }

  return (
    <div className="lista-sugerencias">
      <h1>Mis sugerencias</h1>

      {cargando && <p className="cargando">Cargando...</p>}
      {error && <p className="formulario-simple-error">{error}</p>}

      {!cargando && !error && sugerencias.length === 0 && (
        <p className="lista-sugerencias-vacio">
          Todavía no sugeriste ningún juego. Podés hacerlo desde "Sugerir juego".
        </p>
      )}

      {!cargando &&
        !error &&
        sugerencias.map((sugerencia) => (
          <div key={sugerencia.id} className="tarjeta-sugerencia">
            <div className="tarjeta-sugerencia-encabezado">
              <h2>{sugerencia.nombre_juego}</h2>
              <BadgeEstado estado={sugerencia.estado} />
            </div>

            <p className="tarjeta-sugerencia-meta">
              {sugerencia.plataforma && `Plataforma: ${sugerencia.plataforma}`}
              {sugerencia.genero && ` · Género: ${sugerencia.genero}`}
              {sugerencia.anio_lanzamiento && ` · Año: ${sugerencia.anio_lanzamiento}`}
              {' · '}
              {sugerencia.mostrar_autor
                ? 'Tu nombre se muestra públicamente si se aprueba'
                : 'Tu nombre queda oculto si se aprueba'}
            </p>

            {sugerencia.link_referencia && (
              <p className="tarjeta-sugerencia-meta">
                <a
                  href={sugerencia.link_referencia}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tarjeta-sugerencia-link"
                >
                  {sugerencia.link_referencia}
                </a>
              </p>
            )}

            {sugerencia.descripcion && (
              <p className="tarjeta-sugerencia-descripcion">{sugerencia.descripcion}</p>
            )}

            {sugerencia.comentario_admin && (
              <p className="tarjeta-sugerencia-comentario">
                Comentario del admin: {sugerencia.comentario_admin}
              </p>
            )}

            {sugerencia.estado === 'pendiente' && (
              <div className="tarjeta-sugerencia-acciones">
                <button
                  type="button"
                  className="boton-eliminar"
                  onClick={() => manejarEliminar(sugerencia.id)}
                >
                  Eliminar
                </button>
              </div>
            )}
          </div>
        ))}
    </div>
  );
}

export default MisSugerencias;
