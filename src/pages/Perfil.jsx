import { useState } from 'react';
import { useAuth } from '../contexto/ContextoAuth';
import ModalCambiarContrasena from '../components/ModalCambiarContrasena';
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
*/
function Perfil() {
  const { usuario, perfil, esAdmin } = useAuth();
  const [modalAbierto, setModalAbierto] = useState(false);

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

      {modalAbierto && (
        <ModalCambiarContrasena onCerrar={() => setModalAbierto(false)} />
      )}
    </div>
  );
}

export default Perfil;
