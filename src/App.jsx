import { BrowserRouter } from 'react-router-dom';
import Navegacion from './components/Navegacion';
import AppRouter from './router/AppRouter';

function App() {
  return (
    <BrowserRouter>
      <Navegacion />
      <AppRouter />
    </BrowserRouter>
  );
}

export default App;
