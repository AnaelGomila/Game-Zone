import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

/*
  ScrollAlInicio
  ----------------
  React Router cambia de pantalla sin recargar la página, y el navegador
  no mueve el scroll por su cuenta en ese caso: si estabas a mitad de una
  pantalla larga (por ejemplo el Catálogo) y entrabas a otra, la nueva
  pantalla aparecía con el mismo scroll de la anterior, "un poco más
  abajo". Este componente no dibuja nada: solo lleva el scroll arriba
  cada vez que cambia la ruta (o sus parámetros, como la página o el
  género del Catálogo).

  Excepción: al volver con "atrás"/"adelante" del navegador (tipo 'POP')
  no se toca el scroll, para que el navegador pueda devolver a la persona
  al lugar donde estaba.

  Tiene que renderizarse adentro del <BrowserRouter> (ver App.jsx).
*/
function ScrollAlInicio() {
  const { pathname, search } = useLocation();
  const tipoNavegacion = useNavigationType();

  useEffect(() => {
    if (tipoNavegacion === 'POP') return;

    // behavior 'instant' evita que un scroll-behavior: smooth global
    // haga una animación larga hasta arriba.
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search, tipoNavegacion]);

  return null;
}

export default ScrollAlInicio;