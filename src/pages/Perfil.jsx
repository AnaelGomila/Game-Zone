import { useEffect, useState } from 'react';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';
import {
  obtenerJuegosAgregadosPorAdmin,
  contarSugerenciasDeUsuario,
} from '../servicios/servicioSugerencias';
import { obtenerFavoritos, contarFavoritos } from '../servicios/servicioFavoritos';
import { contarComentariosDeUsuario } from '../servicios/servicioComentarios';
import { actualizarPerfilPropio } from '../servicios/servicioUsuarios';
import { subirAvatar, subirPortada } from '../servicios/servicioImagenes';
import { obtenerIniciales } from '../utils/iniciales';
import ModalCambiarContrasena from '../components/ModalCambiarContrasena';
import ResumenJuegosAgregados from '../components/ResumenJuegosAgregados';
import MiniCarruselFavoritos from '../components/MiniCarruselFavoritos';
import SelectorImagen from '../components/SelectorImagen';
import '../styles/perfil.css';

/*
  Perfil — Parte 6 (placeholder → pantalla) + Parte 11 (juegos agregados
  para admin) + Parte 16 (avatar, portada, estadísticas, favoritos).
  ------------------------------------------------------------------------
  Parte 16 agrega, en este orden:
  1. Portada + avatar elegidos por el usuario (Storage, bucket
     "perfil-usuarios" — ver sql/parte-16-perfil-personalizado.sql). Cada
     imagen se sube con SelectorImagen (reusado de la Parte 11) y un botón
     "Guardar" propio — no se sube nada hasta confirmar.
  2. Estadísticas simples (favoritos, sugerencias enviadas, comentarios),
     con funciones de conteo (contarFavoritos, etc.) que no traen los
     datos completos de cada fila, solo el número.
  3. Un mini carrusel con los juegos favoritos, que ahora avanza solo
     cada 6 segundos (MiniCarruselFavoritos) — a diferencia del resto de
     los carruseles del proyecto, que solo avanzan con clic.
  4. El bloque de "Juegos que agregué" (solo para admin, desde la Parte
     11) deja de ser un carrusel: ahora es ResumenJuegosAgregados, una
     grilla estática de hasta 5 juegos + un link a Admin: Sugerencias
     para ver el resto ahí.

  Después de guardar una foto nueva se llama a refrescarPerfil()
  (ContextoAuth) en vez de solo actualizar el estado local — así el
  círculo de AvatarMenu, en la barra superior, también se entera del
  cambio sin recargar la página.

  Se sigue sin permitir editar el nombre ni el rol acá — mismo criterio
  que antes, el rol es exclusivo de AdminUsuarios y está reforzado por el
  trigger evitar_cambio_rol_no_admin (Parte 6).
*/
function Perfil() {
  const { usuario, perfil, esAdmin, refrescarPerfil } = useAuth();
  const { mostrarAlerta } = useAlerta();

  const [modalAbierto, setModalAbierto] = useState(false);

  const [juegosAgregados, setJuegosAgregados] = useState([]);
  const [cargandoJuegos, setCargandoJuegos] = useState(esAdmin);

  const [favoritos, setFavoritos] = useState([]);
  const [cargandoFavoritos, setCargandoFavoritos] = useState(true);

  const [estadisticas, setEstadisticas] = useState({
    favoritos: 0,
    sugerencias: 0,
    comentarios: 0,
  });
  const [cargandoEstadisticas, setCargandoEstadisticas] = useState(true);

  const [archivoAvatar, setArchivoAvatar] = useState(null);
  const [guardandoAvatar, setGuardandoAvatar] = useState(false);
  const [archivoPortada, setArchivoPortada] = useState(null);
  const [guardandoPortada, setGuardandoPortada] = useState(false);

  useEffect(() => {
    if (!esAdmin || !usuario) return;

    obtenerJuegosAgregadosPorAdmin(usuario.id)
      .then((resultado) => setJuegosAgregados(resultado))
      .catch((error) =>
        console.error('Error al traer juegos agregados:', error.message)
      )
      .finally(() => setCargandoJuegos(false));
  }, [esAdmin, usuario]);

  useEffect(() => {
    if (!usuario) return;

    obtenerFavoritos(usuario.id)
      .then((resultado) => setFavoritos(resultado))
      .catch((error) => console.error('Error al traer favoritos:', error.message))
      .finally(() => setCargandoFavoritos(false));
  }, [usuario]);

  useEffect(() => {
    if (!usuario) return;

    Promise.all([
      contarFavoritos(usuario.id),
      contarSugerenciasDeUsuario(usuario.id),
      contarComentariosDeUsuario(usuario.id),
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
  }, [usuario]);

  async function manejarGuardarAvatar() {
    if (!archivoAvatar) return;
    setGuardandoAvatar(true);
    try {
      const url = await subirAvatar(usuario.id, archivoAvatar);
      await actualizarPerfilPropio(usuario.id, { avatar_url: url });
      await refrescarPerfil();
      setArchivoAvatar(null);
      mostrarAlerta('Foto de perfil actualizada.', 'exito');
    } catch (error) {
      console.error('Error al guardar el avatar:', error.message);
      mostrarAlerta('No se pudo guardar la foto de perfil.', 'error');
    } finally {
      setGuardandoAvatar(false);
    }
  }

  async function manejarGuardarPortada() {
    if (!archivoPortada) return;
    setGuardandoPortada(true);
    try {
      const url = await subirPortada(usuario.id, archivoPortada);
      await actualizarPerfilPropio(usuario.id, { portada_url: url });
      await refrescarPerfil();
      setArchivoPortada(null);
      mostrarAlerta('Fondo de perfil actualizado.', 'exito');
    } catch (error) {
      console.error('Error al guardar el fondo:', error.message);
      mostrarAlerta('No se pudo guardar el fondo de perfil.', 'error');
    } finally {
      setGuardandoPortada(false);
    }
  }

  // Igual que en DetalleJuego: la imagen cambia por usuario, así que no
  // puede vivir en un .css estático — va como estilo inline solo por eso.
  const estiloPortada = perfil?.portada_url
    ? { backgroundImage: `url(${perfil.portada_url})` }
    : undefined;

  return (
    <div className="perfil">
      <div
        className={perfil?.portada_url ? 'perfil-portada' : 'perfil-portada perfil-portada-vacia'}
        style={estiloPortada}
      >
        <div className="perfil-avatar-grande">
          {perfil?.avatar_url ? (
            <img src={perfil.avatar_url} alt="" />
          ) : (
            <span>{obtenerIniciales(perfil?.nombre, usuario?.email)}</span>
          )}
        </div>
      </div>

      <h1 className="perfil-nombre">{perfil?.nombre || 'Mi perfil'}</h1>

      <div className="perfil-grilla">
        <div className="perfil-tarjeta">
          <div className="perfil-dato">
            <span className="perfil-etiqueta">Nombre</span>
            <span>{perfil?.nombre || '—'}</span>
          </div>

          <div className="perfil-dato">
            <span className="perfil-etiqueta">Email</span>
            <span>{usuario?.email || '—'}</span>
          </div>

          <div className="perfil-dato">
            <span className="perfil-etiqueta">Rol</span>
            <span className={esAdmin ? 'perfil-rol-admin' : 'perfil-rol-usuario'}>
              {perfil?.rol || 'usuario'}
            </span>
          </div>

          <button type="button" onClick={() => setModalAbierto(true)}>
            Cambiar contraseña
          </button>
        </div>

        <div className="perfil-tarjeta">
          <span className="perfil-etiqueta">Personalizar perfil</span>

          <div className="perfil-personalizar-item">
            <p className="perfil-personalizar-titulo">Foto de perfil</p>
            <SelectorImagen
              variante="circular"
              valorActual={perfil?.avatar_url}
              onCambio={setArchivoAvatar}
            />
            {archivoAvatar && (
              <button type="button" onClick={manejarGuardarAvatar} disabled={guardandoAvatar}>
                {guardandoAvatar ? 'Guardando...' : 'Guardar foto'}
              </button>
            )}
          </div>

          <div className="perfil-personalizar-item">
            <p className="perfil-personalizar-titulo">Fondo de perfil</p>
            <SelectorImagen valorActual={perfil?.portada_url} onCambio={setArchivoPortada} />
            {archivoPortada && (
              <button type="button" onClick={manejarGuardarPortada} disabled={guardandoPortada}>
                {guardandoPortada ? 'Guardando...' : 'Guardar fondo'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="perfil-tarjeta perfil-seccion-ancha">
        <span className="perfil-etiqueta">Mi actividad</span>
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
              <span className="perfil-estadistica-etiqueta">Sugerencias enviadas</span>
            </div>
            <div className="perfil-estadistica">
              <span className="perfil-estadistica-numero">{estadisticas.comentarios}</span>
              <span className="perfil-estadistica-etiqueta">Comentarios</span>
            </div>
          </div>
        )}
      </div>

      <div className="perfil-tarjeta perfil-seccion-ancha">
        <span className="perfil-etiqueta">Mis favoritos</span>
        {cargandoFavoritos ? (
          <p className="perfil-cargando">Cargando...</p>
        ) : (
          <MiniCarruselFavoritos favoritos={favoritos} />
        )}
      </div>

      {esAdmin && (
        <div className="perfil-tarjeta perfil-seccion-ancha">
          <span className="perfil-etiqueta">Juegos que agregué</span>
          {cargandoJuegos ? (
            <p className="perfil-cargando">Cargando...</p>
          ) : (
            <ResumenJuegosAgregados juegos={juegosAgregados} />
          )}
        </div>
      )}

      {modalAbierto && (
        <ModalCambiarContrasena onCerrar={() => setModalAbierto(false)} />
      )}
    </div>
  );
}

export default Perfil;
