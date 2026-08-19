/*
  BadgeEstado — pequeño componente compartido entre MisSugerencias y
  AdminSugerencias, para no repetir el mismo mapeo estado → texto/clase
  en los dos lugares.
*/
const ETIQUETAS = {
  pendiente: 'Pendiente',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
};

function BadgeEstado({ estado }) {
  return (
    <span className={`badge-estado badge-estado-${estado}`}>
      {ETIQUETAS[estado] || estado}
    </span>
  );
}

export default BadgeEstado;
