import { Link } from 'react-router-dom';
import '../styles/inicio.css';

/*
  Inicio — deja de ser placeholder en la Parte 6.
  ------------------------------------------------------
  Pantalla pública simple: presentación del proyecto + link al Catálogo.
  Intencionalmente sin lógica ni datos propios — es la puerta de entrada,
  no necesita más que esto para cumplir su función dentro del MVP.
*/
function Inicio() {
  return (
    <div className="inicio">
      <h1>Game Zone</h1>
      <p>
        Descubrí juegos, guardá tus favoritos y proponé los que todavía no
        están en el catálogo.
      </p>
      <Link to="/catalogo" className="inicio-boton">
        Ver catálogo
      </Link>
    </div>
  );
}

export default Inicio;
