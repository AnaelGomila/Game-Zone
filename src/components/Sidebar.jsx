import { useEffect, useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import { obtenerGeneros } from '../servicios/servicioRawg';
import './Sidebar.css';

/*
  Sidebar — nuevo en la Parte 7, reemplaza a Navegacion.jsx.
  ------------------------------------------------------------
  Fija, siempre visible (se eligió esa opción en vez de una colapsable con
  hamburguesa, para mantenerlo simple). Usa <NavLink> en vez de <Link>
  para poder marcar visualmente cuál es la pantalla activa (NavLink le
  agrega la clase "active" sola al link que coincide con la URL actual).

  Perfil y los links de admin de usuarios/sugerencias YA NO están acá —
  viven en <AvatarMenu>, adentro de <BarraSuperior>.

  Parte 11: si el usuario logueado es admin, "Sugerir juego" y "Mis
  sugerencias" se reemplazan por "Agregar juego" — el admin no propone
  juegos para que otro los revise, los agrega directamente (ver
  AgregarJuego.jsx). Favoritos se mantiene igual para todos, admin o no.

  Responsive: en pantallas anchas, `abierta` no hace nada (Sidebar.css
  la ignora, siempre visible, como siempre fue). Por debajo del
  breakpoint mobile, pasa a ser un panel que se desliza desde la
  izquierda (position: fixed) solo cuando `abierta` es true — se abre
  con el botón hamburguesa de BarraSuperior (el estado vive en App.jsx,
  ver ese archivo). El fondo oscuro (.sidebar-overlay) y el propio click
  en un link cierran el panel llamando a onCerrar.

  Filtro por género (ajuste posterior): solo aparece en /catalogo y
  /favoritos, con la misma lista de géneros de RAWG (obtenerGeneros(),
  la que antes vivía en el <select> "Categoría" dentro de Catalogo.jsx —
  ese desplegable se sacó, quedó reemplazado por esto). El valor que se
  manda en la URL es distinto según la pantalla:
    - /catalogo: el ID numérico de RAWG (así lo espera obtenerJuegos(),
      sin ningún cambio ahí — Catalogo.jsx sigue leyendo el mismo query
      param "genero" de siempre, ahora escrito desde acá en vez de un
      <select> local).
    - /favoritos: el NOMBRE del género en texto. Los favoritos son una
      "foto" (snapshot) guardada en Supabase con juego_data.genres como
      [{name: "Action"}, ...] — no tienen el id de RAWG guardado, así
      que ahí Favoritos.jsx filtra en el navegador comparando por
      nombre, no hay ningún pedido nuevo a ninguna API.
*/
function Sidebar({ abierta, onCerrar }) {
  const { estaLogueado, esAdmin } = useAuth();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const enCatalogo = location.pathname === '/catalogo';
  const enFavoritos = location.pathname === '/favoritos';
  const mostrarFiltros = enCatalogo || enFavoritos;

  const [generos, setGeneros] = useState([]);

  // Se piden solo la primera vez que hace falta (al entrar a Catálogo o
  // Favoritos), no en cada render ni en pantallas donde no se usan.
  useEffect(() => {
    if (!mostrarFiltros || generos.length > 0) return;

    obtenerGeneros()
      .then((resultado) => setGeneros(resultado))
      .catch((error) => console.error('Error al traer géneros:', error.message));
  }, [mostrarFiltros, generos.length]);

  const generoActivo = searchParams.get('genero') || '';

  function manejarClicGenero(valor) {
    const nuevos = new URLSearchParams(searchParams);
    if (valor) {
      nuevos.set('genero', valor);
    } else {
      nuevos.delete('genero');
    }
    // Mismo criterio que ya usaba el <select> de Catalogo: cambiar de
    // filtro vuelve a la página 1. Favoritos no pagina, así que esto no
    // le afecta.
    if (enCatalogo) {
      nuevos.delete('pagina');
    }
    setSearchParams(nuevos);
    onCerrar?.();
  }

  return (
    <>
      {abierta && <div className="sidebar-overlay" onClick={onCerrar} />}

      <aside className={abierta ? 'sidebar sidebar-abierta' : 'sidebar'}>
        <nav className="sidebar-nav" onClick={onCerrar}>
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'activo' : '')}>
            Inicio
          </NavLink>
          <NavLink to="/catalogo" className={({ isActive }) => (isActive ? 'activo' : '')}>
            Catálogo
          </NavLink>

          {estaLogueado && (
            <>
              <NavLink to="/favoritos" className={({ isActive }) => (isActive ? 'activo' : '')}>
                Favoritos
              </NavLink>

              {esAdmin ? (
                <NavLink
                  to="/admin/agregar-juego"
                  className={({ isActive }) => (isActive ? 'activo' : '')}
                >
                  Agregar juego
                </NavLink>
              ) : (
                <>
                  <NavLink to="/sugerir" className={({ isActive }) => (isActive ? 'activo' : '')}>
                    Sugerir juego
                  </NavLink>
                  <NavLink
                    to="/mis-sugerencias"
                    className={({ isActive }) => (isActive ? 'activo' : '')}
                  >
                    Mis sugerencias
                  </NavLink>
                </>
              )}
            </>
          )}
        </nav>

        {mostrarFiltros && (
          <div className="sidebar-filtros">
            <p className="sidebar-filtros-titulo">Filtros</p>

            <button
              type="button"
              className={generoActivo === '' ? 'activo' : ''}
              onClick={() => manejarClicGenero('')}
            >
              Todas las categorías
            </button>

            {generos.map((genero) => {
              const valor = enCatalogo ? String(genero.id) : genero.nombre;
              return (
                <button
                  key={genero.id}
                  type="button"
                  className={generoActivo === valor ? 'activo' : ''}
                  onClick={() => manejarClicGenero(valor)}
                >
                  {genero.nombre}
                </button>
              );
            })}
          </div>
        )}
      </aside>
    </>
  );
}

export default Sidebar;
