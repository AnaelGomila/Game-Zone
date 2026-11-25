import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../App';

/*
  Menú hamburguesa (mobile)
  --------------------------
  El bug que cubre este test: BarraSuperior (botón ☰) y Sidebar (panel)
  se renderizaban en App.jsx sin props, así que el botón no hacía nada y
  en el celular la navegación quedaba inaccesible. Se renderiza <App />
  completo (no cada componente por separado) justamente porque el error
  estaba en el cableado entre los dos, no dentro de ninguno.

  Se mockea lo que depende de Supabase o de la red (ContextoAuth,
  servicioRawg) y el AppRouter (no importa qué pantalla se muestre).
  jsdom no trae ResizeObserver, que BarraSuperior usa para medir su alto.
*/
vi.mock('../contexto/ContextoAuth', () => ({
  ProveedorAuth: ({ children }) => children,
  useAuth: () => ({ estaLogueado: false, esAdmin: false }),
}));

// Algunos componentes importan servicios que crean el cliente real de
// Supabase (necesita variables de entorno que no existen en los tests).
vi.mock('../servicios/supabaseClient', () => ({
  supabase: {},
}));

vi.mock('../servicios/servicioRawg', () => ({
  obtenerJuegos: vi.fn().mockResolvedValue({ juegos: [] }),
  obtenerGeneros: vi.fn().mockResolvedValue([]),
}));

vi.mock('../router/AppRouter', () => ({
  default: () => <p>Contenido de la pantalla</p>,
}));

beforeAll(() => {
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {}
  };
});

describe('Menú hamburguesa', () => {
  it('el panel de navegación empieza cerrado', () => {
    render(<App />);

    expect(document.querySelector('.sidebar')).not.toHaveClass('sidebar-abierta');
  });

  it('el botón ☰ abre el panel y muestra el fondo oscuro', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    await usuario.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }));

    expect(document.querySelector('.sidebar')).toHaveClass('sidebar-abierta');
    expect(document.querySelector('.sidebar-overlay')).toBeInTheDocument();
  });

  it('tocar un link del menú cierra el panel', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    await usuario.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }));
    await usuario.click(screen.getByRole('link', { name: 'Catálogo' }));

    expect(document.querySelector('.sidebar')).not.toHaveClass('sidebar-abierta');
  });

  it('tocar el fondo oscuro cierra el panel', async () => {
    const usuario = userEvent.setup();
    render(<App />);

    await usuario.click(screen.getByRole('button', { name: 'Abrir menú de navegación' }));
    await usuario.click(document.querySelector('.sidebar-overlay'));

    expect(document.querySelector('.sidebar')).not.toHaveClass('sidebar-abierta');
  });
});
