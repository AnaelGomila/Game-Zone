import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexto/ContextoAuth';
import {
  obtenerJuegosAgregadosPorAdmin,
  contarSugerenciasDeUsuario,
  contarSugerenciasAprobadasDeUsuario,
} from '../servicios/servicioSugerencias';
import { obtenerFavoritos, contarFavoritos } from '../servicios/servicioFavoritos';
import { contarComentariosDeUsuario } from '../servicios/servicioComentarios';
import { obtenerUsuarioPorId } from '../servicios/servicioUsuarios';
import { obtenerIniciales } from '../utils/iniciales';
import ModalCambiarContrasena from '../components/ModalCambiarContrasena';
import ModalEditarPerfil from '../components/ModalEditarPerfil';
import ResumenJuegosAgregados from '../components/ResumenJuegosAgregados';
import CarruselFavoritosPerfil from '../components/CarruselFavoritosPerfil';
import MuroPerfil from '../components/MuroPerfil';
import '../styles/perfil.css';

/*
  Perfil — Parte 6 (placeholder → pantalla) + Parte 11 (juegos agregados
  para admin) + Parte 16 (avatar/portada/estadísticas/favoritos) + Parte
  17 (perfil público de otros usuarios) + ajustes posteriores (panel
  único, color de acento elegido por el usuario, sin columna apellido).
  ------------------------------------------------------------------------
  Un solo componente sirve para las dos rutas: "/perfil" (sin parámetro,
  siempre el propio) y "/usuario/:id" (el de otro usuario).

  Se sacó `apellido` como campo separado: el `nombre` que ya se carga al
  registrarse (Parte 3) incluye nombre y apellido juntos, así que tener
  una columna aparte era redundante.

  Todo el contenido (identidad, actividad, favoritos, juegos agregados)
  vive ahora dentro de un único panel translúcido (.perfil-panel), en vez
  de varias tarjetas sueltas — el fondo fijo (.perfil-fondo) se sigue
  viendo detrás, a través de él.

  color_texto (elegido en ModalEditarPerfil con el selector nativo del
  navegador) se aplica como variable CSS (--color-perfil-acento) en el
  panel entero, así que perfil.css puede usarla en cualquier borde/texto
  que quiera adoptar el color elegido por esa persona, no solo en el
  nickname — si no eligió ninguno, cae en el naranja del tema por
  defecto.

  Parte 18: se agrega <MuroPerfil> al final del panel — la "Parte B" del
  sistema de comentarios que había quedado pendiente desde la Parte 14.
  Recibe perfilId={idUsuarioAMostrar}, así que funciona igual sea el
  perfil propio o el de otro usuario, sin ninguna distinción extra acá.
*/
function Perfil() {
  const { id: idParam } = useParams();
  const { usuario, perfil, refrescarPerfil } = useAuth();

  const idUsuarioAMostrar = idParam || usuario.id;
  const esPropio = idUsuarioAMostrar === usuario.id;

  const [modalContrasenaAbierto, setModalContrasenaAbierto] = useState(false);
  const [modalEditarAbierto, setModalEditarAbierto] = useState(false);

  const [perfilAjeno, setPerfilAjeno] = useState(null);
  const [cargandoPerfilAjeno, setCargandoPerfilAjeno] = useState(!esPropio);

  const [juegosAgregados, setJuegosAgregados] = useState([]);
  const [cargandoJuegos, setCargandoJuegos] = useState(false);

  const [favoritos, setFavoritos] = useState([]);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(true);

  const [estadisticas, setEstadisticas] = useState({
    favoritos: 0,
    sugerencias: 0,
    comentarios: 0,
  });
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

  const datosPerfil = esPropio ? perfil : perfilAjeno;
  const esAdminDeEsePerfil = datosPerfil?.rol === 'admin';

  useEffect(() => {
    if (esPropio) {
      setCargandoPerfilAjeno(false);
      return;
    }

    setCargandoPerfilAjeno(true);
    obtenerUsuarioPorId(idUsuarioAMostrar)
      .then((resultado) => setPerfilAjeno(resultado))
      .catch((error) => console.error('Error al traer el perfil:', error.message))
      .finally(() => setCargandoPerfilAjeno(false));
  }, [esPropio, idUsuarioAMostrar]);

  useEffect(() => {
    if (!esAdminDeEsePerfil) {
      setJuegosAgregados([]);
      return;
    }

    setCargandoJuegos(true);
    obtenerJuegosAgregadosPorAdmin(idUsuarioAMostrar)
      .then((resultado) => setJuegosAgregados(resultado))
      .catch((error) =>
        console.error('Error al traer juegos agregados:', error.message)
      )
      .finally(() => setCargandoJuegos(false));
  }, [esAdminDeEsePerfil, idUsuarioAMostrar]);

  useEffect(() => {
    setCargandoFavoritos(true);
    obtenerFavoritos(idUsuarioAMostrar)
      .then((resultado) => setFavoritos(resultado))
      .catch((error) => console.error('Error al traer favoritos:', error.message))
      .finally(() => setCargandoFavoritos(false));
  }, [idUsuarioAMostrar]);

  useEffect(() => {
    setCargandoEstadisticas(true);

    const pedidoSugerencias = esPropio
      ? contarSugerenciasDeUsuario(idUsuarioAMostrar)
      : contarSugerenciasAprobadasDeUsuario(idUsuarioAMostrar);

    Promise.all([
      contarFavoritos(idUsuarioAMostrar),
      pedidoSugerencias,
      contarComentariosDeUsuario(idUsuarioAMostrar),
    ])
      .then(([favoritosTotal, sugerenciasTotal, comentariosTotal]) =>
        setEstadisticas({
          favoritos: favoritosTotal,
          sugerencias: sugerenciasTotal,
          comentarios: comentariosTotal,
        })
      )
      .catch((error) => console.error('Error al traer estadísticas:', error.message))
      .finally(() => setCargandoEstadisticas(false));
  }, [esPropio, idUsuarioAMostrar]);

  if (!esPropio && cargandoPerfilAjeno) {
    return <p className="cargando">Cargando perfil...</p>;
  }

  if (!esPropio && !datosPerfil) {
    return <p className="detalle-juego-error">No se encontró este usuario.</p>;
  }

  // Igual que en DetalleJuego: la imagen cambia por usuario, así que no
  // puede vivir en un .css estático — va como estilo inline solo por eso.
  const estiloPortada = datosPerfil?.portada_url
    ? { backgroundImage: `url(${datosPerfil.portada_url})` }
    : undefined;

  const nombreParaMostrar = datosPerfil?.nickname || datosPerfil?.nombre || 'Usuario';

  // El color elegido se aplica como variable CSS en el panel entero, no
  // como estilo puntual del h1 — así perfil.css puede usarlo en
  // cualquier borde/texto que corresponda, no solo en el nickname.
  const estiloPanel = {
    '--color-perfil-acento': datosPerfil?.color_texto || 'var(--color-primario)',
  };

  const lineasRedes = (datosPerfil?.redes_sociales || '')
    .split('\n')
    .map((linea) => linea.trim())
    .filter(Boolean);

  return (
    <>
      {/* Fondo fijo detrás de TODA la pantalla — position: fixed lo
          desprende del flujo normal, así que el panel de más abajo
          queda flotando (translúcido) encima en vez de taparlo. */}
      <div
        className={
          datosPerfil?.portada_url ? 'perfil-fondo' : 'perfil-fondo perfil-fondo-vacio'
        }
        style={estiloPortada}
      />

      <div className="perfil">
        <div className="perfil-panel" style={estiloPanel}>
          <div className="perfil-identidad-fila">
            <div className="perfil-identidad">
              <div className="perfil-avatar-grande">
                {datosPerfil?.avatar_url ? (
                  <img src={datosPerfil.avatar_url} alt="" />
                ) : (
                  <span>
                    {obtenerIniciales(datosPerfil?.nombre, esPropio ? usuario?.email : null)}
                  </span>
                )}
              </div>

              <div className="perfil-identidad-texto">
                <h1>{nombreParaMostrar}</h1>

                <p className="perfil-rol-etiqueta">
                  {esAdminDeEsePerfil ? 'Administrador' : 'Usuario'}
                  {datosPerfil?.titulo_admin && (
                    <span className="perfil-titulo-admin"> · {datosPerfil.titulo_admin}</span>
                  )}
                </p>

                {datosPerfil?.nombre && <p>{datosPerfil.nombre}</p>}
                {datosPerfil?.nacionalidad && <p>{datosPerfil.nacionalidad}</p>}

                {lineasRedes.length > 0 && (
                  <div className="perfil-redes">
                    {lineasRedes.map((linea, indice) =>
                      linea.startsWith('http') ? (
                        <a key={indice} href={linea} target="_blank" rel="noopener noreferrer">
                          {linea}
                        </a>
                      ) : (
                        <p key={indice}>{linea}</p>
                      )
                    )}
                  </div>
                )}
              </div>
            </div>

            {esPropio && (
              <div className="perfil-acciones">
                <button type="button" onClick={() => setModalEditarAbierto(true)}>
                  Modificar perfil
                </button>
                <button
                  type="button"
                  className="perfil-boton-secundario"
                  onClick={() => setModalContrasenaAbierto(true)}
                >
                  Cambiar contraseña
                </button>
              </div>
            )}
          </div>

          <div className="perfil-seccion">
            <span className="perfil-etiqueta">Actividad</span>
            {cargandoEstadisticas ? (
              <p className="perfil-cargando">Cargando...</p>
            ) : (
              <div className="perfil-estadisticas">
                <div className="perfil-estadistica">
                  <span className="perfil-estadistica-numero">{estadisticas.favoritos}</span>
                  <span className="perfil-estadistica-etiqueta">Favoritos</span>
                </div>
                <div className="perfil-estadistica">
                  <span className="perfil-estadistica-numero">{estadisticas.sugerencias}</span>
                  <span className="perfil-estadistica-etiqueta">
                    {esPropio ? 'Sugerencias enviadas' : 'Sugerencias aprobadas'}
                  </span>
                </div>
                <div className="perfil-estadistica">
                  <span className="perfil-estadistica-numero">{estadisticas.comentarios}</span>
                  <span className="perfil-estadistica-etiqueta">Comentarios</span>
                </div>
              </div>
            )}
          </div>

          <div className="perfil-seccion">
            <span className="perfil-etiqueta">{esPropio ? 'Mis favoritos' : 'Sus favoritos'}</span>
            {cargandoFavoritos ? (
              <p className="perfil-cargando">Cargando...</p>
            ) : (
              <CarruselFavoritosPerfil favoritos={favoritos} />
            )}
          </div>

          {esAdminDeEsePerfil && (
            <div className="perfil-seccion">
              <span className="perfil-etiqueta">
                {esPropio ? 'Juegos que agregué' : 'Juegos que agregó'}
              </span>
              {cargandoJuegos ? (
                <p className="perfil-cargando">Cargando...</p>
              ) : (
                <ResumenJuegosAgregados juegos={juegosAgregados} esPropio={esPropio} />
              )}
            </div>
          )}

          <div className="perfil-seccion">
            <span className="perfil-etiqueta">Muro</span>
            <MuroPerfil perfilId={idUsuarioAMostrar} />
          </div>
        </div>
      </div>

      {modalContrasenaAbierto && (
        <ModalCambiarContrasena onCerrar={() => setModalContrasenaAbierto(false)} />
      )}

      {modalEditarAbierto && (
        <ModalEditarPerfil
          onCerrar={() => setModalEditarAbierto(false)}
          onGuardado={refrescarPerfil}
        />
      )}
    </>
  );
}

export default Perfil;
