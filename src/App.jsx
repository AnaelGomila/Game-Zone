import { BrowserRouter } from 'react-router-dom';
import { ProveedorAuth } from './contexto/ContextoAuth';
import Navegacion from './components/Navegacion';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <ProveedorAuth>
        <Navegacion />
        <AppRouter />
      </ProveedorAuth>
    </BrowserRouter>
  );
}

export default App;
