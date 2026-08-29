import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { useAuth } from '../contexto/ContextoAuth';
import { useAlerta } from '../contexto/ContextoAlerta';

/*
  Login usa useAuth() (Supabase) y useAlerta() (toasts globales). Se
  mockean los dos módulos completos para poder probar el formulario de
  forma aislada, sin conectarse a Supabase ni renderizar el sistema de
  alertas real.

  El test cubre el camino de "formulario vacío": confirma que
  useValidacion corta el envío ANTES de llamar a iniciarSesion, que es
  justamente el comportamiento que se busca (no gastar un intento de
  login con campos que ya se sabe que están vacíos).
*/
vi.mock('../contexto/ContextoAuth', () => ({
  useAuth: vi.fn(),
}));

vi.mock('../contexto/ContextoAlerta', () => ({
  useAlerta: vi.fn(),
}));

describe('Login', () => {
  it('muestra errores de validación y no llama a iniciarSesion si el formulario está vacío', async () => {
    const iniciarSesion = vi.fn();
    useAuth.mockReturnValue({ iniciarSesion });
    useAlerta.mockReturnValue({ mostrarAlerta: vi.fn() });

    const usuario = userEvent.setup();

    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>
    );

    await usuario.click(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Ingresá tu email')).toBeInTheDocument();
    expect(screen.getByText('Ingresá tu contraseña')).toBeInTheDocument();
    expect(iniciarSesion).not.toHaveBeenCalled();
  });
});
