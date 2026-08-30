import { useEffect, useState } from 'react';
import { useAuth } from '../contexto/ContextoAuth';
import { obtenerJuegosAgregadosPorAdmin } from '../servicios/servicioSugerencias';
import ModalCambiarContrasena from '../components/ModalCambiarContrasena';
import CarruselJuegosAgregados from '../components/CarruselJuegosAgregados';
import '../styles/perfil.css';

/*
  Perfil — deja de ser placeholder en la Parte 6.
  ----------------------------------------------------
  Muestra los datos del usuario logueado (nombre, email, rol) leídos del
  ContextoAuth (usuario viene de Supabase Auth, perfil viene de la tabla
  usuarios), y el botón para abrir el modal de cambio de contraseña, tal
  como estaba planeado desde la Parte 1 ("Cambio de contraseña: modal
  aparte dentro de Perfil").

  No incluye edición del nombre ni del rol a propósito: cambiar el nombre
  tocaría la fila de `usuarios` (posible, pero no fue pedido) y el rol no
  se expone nunca a que el propio usuario lo edite — eso es exclusivo de
  AdminUsuarios, reforzado además por el trigger de base de datos de la
  Parte 6 (evitar_cambio_rol_no_admin).

  Parte 11: si el usuario logueado es admin, se agrega debajo una
  sección con el carrusel de juegos que agregó (CarruselJuegosAgregados),
  para que el Perfil de un admin no se vea tan vacío como el de un
  usuario común — a propósito compacta (un carrusel, no una grilla
  completa) porque en algún momento se piensa sumar más contenido a esta
  pantalla y no queremos que ocupe toda la altura.
*/
function Perfil() {
  const { usuario, perfil, esAdmin } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);

  const [juegosAgregados, setJuegosAgregados] = useState([]);
  const [cargandoJuegos, setCargandoJuegos] = useState(esAdmin);

  useEffect(() => {
    if (!esAdmin || !usuario) return;

    obtenerJuegosAgregadosPorAdmin(usuario.id)
      .then((resultado) => setJuegosAgregados(resultado))
      .catch((error) =>
        console.error('Error al traer juegos agregados:', error.message)
      )
      .finally(() => setCargandoJuegos(false));
  }, [esAdmin, usuario]);

  return (
    <div className="perfil">
      <h1>Mi perfil</h1>

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

      {esAdmin && (
        <div className="perfil-tarjeta perfil-seccion-juegos">
          <span className="perfil-etiqueta">Juegos que agregué</span>
          {cargandoJuegos ? (
            <p className="perfil-juegos-cargando">Cargando...</p>
          ) : (
            <CarruselJuegosAgregados juegos={juegosAgregados} />
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
