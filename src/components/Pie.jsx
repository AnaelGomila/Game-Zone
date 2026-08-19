import './Pie.css';

/*
  Pie (footer) — nuevo en la Parte 6.
  --------------------------------------
  Resuelve el pendiente anotado desde la Parte 4: RAWG pide, en su plan
  gratuito, incluir un link de vuelta a su sitio en las páginas donde se
  muestran sus datos. Es intencionalmente mínimo (no es "el Header/Footer
  definitivos" mencionados como tarea aparte en la Parte 2 — eso sigue
  siendo una posible mejora visual futura), solo cumple el requisito legal
  del plan gratuito de la API.
*/
function Pie() {
  return (
    <footer className="pie-pagina">
      <p>
        Datos de juegos provistos por{' '}
        <a href="https://rawg.io" target="_blank" rel="noopener noreferrer">
          RAWG.io
        </a>
        .
      </p>
    </footer>
  );
}

export default Pie;
