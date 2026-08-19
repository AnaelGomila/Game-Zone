import './Modal.css';

/*
  Modal — componente genérico nuevo en la Parte 6.
  ----------------------------------------------------
  Se separa como componente reusable en vez de escribirlo inline dentro de
  Perfil.jsx, porque AdminSugerencias también necesita un modal (para
  editar una sugerencia) y así no se duplica el mismo maquetado/estilos
  dos veces. Es intencionalmente simple: fondo oscuro + caja centrada +
  botón de cerrar arriba a la derecha. No maneja foco ni "atrapa" el tab
  (accesibilidad avanzada) para no sobrecargar esta parte del proyecto.
*/
function Modal({ titulo, onCerrar, children }) {
  return (
    <div className="modal-fondo" onClick={onCerrar}>
      <div className="modal-caja" onClick={(evento) => evento.stopPropagation()}>
        <div className="modal-encabezado">
          <h2>{titulo}</h2>
          <button
            type="button"
            className="modal-cerrar"
            onClick={onCerrar}
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>
        <div className="modal-cuerpo">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
