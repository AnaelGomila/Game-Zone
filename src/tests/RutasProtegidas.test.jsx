import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RutaPrivada from '../router/RutaPrivada';
import RutaAdmin from '../router/RutaAdmin';
import { useAuth } from '../contexto/ContextoAuth';

/*
  RutaPrivada y RutaAdmin dependen de useAuth() (ContextoAuth), que a su
  vez se conecta a Supabase de verdad. Para no depender de una sesión
  real ni de la red en los tests, se mockea todo el módulo ContextoAuth:
  useAuth pasa a ser una función de prueba (vi.fn()) cuyo valor de
  retorno se define en cada test con mockReturnValue.

  MemoryRouter simula la navegación sin un navegador real. Se arma una
  mini-tabla de rutas con una pantalla "de destino" (login o inicio) para
  poder comprobar, después de renderizar, a dónde terminó navegando el
  <Navigate> de cada guard.
*/
vi.mock('../contexto/ContextoAuth', () => ({
  useAuth: vi.fn(),
}));

function renderizarRutaProtegida(rutaProtegida) {
  return render(
    <MemoryRouter initialEntries={['/privada']}>
      <Routes>
        <Route path="/privada" element={rutaProtegida} />
        <Route path="/login" element={<p>Pantalla de login</p>} />
        <Route path="/" element={<p>Pantalla de inicio</p>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('RutaPrivada', () => {
  it('redirige a /login si no hay sesión activa', () => {
    useAuth.mockReturnValue({ estaLogueado: false, cargando: false });

    renderizarRutaProtegida(
      <RutaPrivada>
        <p>Contenido privado</p>
      </RutaPrivada>
    );

    expect(screen.getByText('Pantalla de login')).toBeInTheDocument();
  });

  it('muestra el contenido si hay sesión activa', () => {
    useAuth.mockReturnValue({ estaLogueado: true, cargando: false });

    renderizarRutaProtegida(
      <RutaPrivada>
        <p>Contenido privado</p>
      </RutaPrivada>
    );

    expect(screen.getByText('Contenido privado')).toBeInTheDocument();
  });
});

describe('RutaAdmin', () => {
  it('redirige a "/" si hay sesión pero el usuario no es admin', () => {
    useAuth.mockReturnValue({
      estaLogueado: true,
      esAdmin: false,
      cargando: false,
    });

    renderizarRutaProtegida(
      <RutaAdmin>
        <p>Panel de administración</p>
      </RutaAdmin>
    );

    // A diferencia de RutaPrivada, acá NO va a /login (ya está logueado),
    // sino a "/": este es justamente el bug de seguridad que se corrigió
    // en la Parte 6 (cualquier usuario logueado podía entrar a mano a
    // /admin/usuarios aunque no viera el link en la navbar).
    expect(screen.getByText('Pantalla de inicio')).toBeInTheDocument();
  });
});
