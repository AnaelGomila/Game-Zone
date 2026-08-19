import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from './contexto/ContextoAuth';
import { ProveedorAlerta } from './contexto/ContextoAlerta';
import Navegacion from './components/Navegacion';
import Pie from './components/Pie';
import AppRouter from './router/AppRouter';

/*
  App.jsx — Parte 6: se agrega <ProveedorAlerta> (envolviendo todo, para
  que useAlerta esté disponible en cualquier pantalla) y <Pie /> (footer
  con la atribución a RAWG, pendiente desde la Parte 4).
*/
function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <ProveedorAlerta>
          <Navegacion />
          <AppRouter />
          <Pie />
        </ProveedorAlerta>
      </ProveedorAuth>
    </BrowserRouter>
  );
}

export default App;
