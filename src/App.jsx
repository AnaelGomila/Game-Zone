import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from './contexto/ContextoAuth';
import { ProveedorAlerta } from './contexto/ContextoAlerta';
import BarraSuperior from './components/BarraSuperior';
import Sidebar from './components/Sidebar';
import ScrollAlInicio from './components/ScrollAlInicio';
import Pie from './components/Pie';
import AppRouter from './router/AppRouter';
import './styles/layout.css';

function App() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <BrowserRouter>
      <ScrollAlInicio />
      <ProveedorAuth>
        <ProveedorAlerta>
          <div className="layout-app">
            <BarraSuperior onAbrirMenu={() => setMenuAbierto((abierto) => !abierto)} />
            <div className="layout-cuerpo">
              <Sidebar abierta={menuAbierto} onCerrar={() => setMenuAbierto(false)} />
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