import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from './contexto/ContextoAuth';
import { ProveedorAlerta } from './contexto/ContextoAlerta';
import BarraSuperior from './components/BarraSuperior';
import Sidebar from './components/Sidebar';
import Pie from './components/Pie';
import AppRouter from './router/AppRouter';
import './styles/layout.css';

/*
  App.jsx — Parte 7: layout completo nuevo.
  --------------------------------------------
  Antes (Parte 6): <Navegacion /> (una barra horizontal con todo) + rutas
  + <Pie />, todo apilado verticalmente.

  Ahora: <BarraSuperior /> (logo + buscador + cuenta) fija arriba, y debajo
  una fila con <Sidebar /> (navegación entre pantallas, fija a la
  izquierda) y el contenido de la ruta actual ocupando el resto del ancho.
  <Pie /> sigue abajo de todo, ancho completo. Navegacion.jsx queda
  reemplazado por estos tres componentes y se elimina del proyecto.
*/
function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <ProveedorAlerta>
          <div className="layout-app">
            <BarraSuperior />
            <div className="layout-cuerpo">
              <Sidebar />
              <main className="layout-contenido">
                <AppRouter />
              </main>
            </div>
            <Pie />
          </div>
        </ProveedorAlerta>
      </ProveedorAuth>
    </BrowserRouter>
  );
}

export default App;
