import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Link, useNavigate } from 'react-router-dom';
import ScrollAlInicio from '../components/ScrollAlInicio';

/*
  ScrollAlInicio: al cambiar de pantalla, el scroll vuelve arriba (el bug
  era que la pantalla nueva aparecía "un poco más abajo", con el scroll de
  la anterior). jsdom no implementa window.scrollTo, así que se espía.
*/
function BotonAtras() {
  const navegar = useNavigate();
  return <button onClick={() => navegar(-1)}>Atrás</button>;
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <ScrollAlInicio />
      <Link to="/catalogo">Ir al catálogo</Link>
      <Link to="/catalogo?pagina=2">Página 2</Link>
      <BotonAtras />
    </MemoryRouter>
  );
}

describe('ScrollAlInicio', () => {
  let scrollTo;

  beforeEach(() => {
    scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  });

  afterEach(() => {
    scrollTo.mockRestore();
  });

  it('no mueve el scroll al cargar la primera pantalla', () => {
    renderizar();

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('lleva el scroll arriba al navegar a otra pantalla', async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByText('Ir al catálogo'));

    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: 'instant' });
  });

  it('también sube al cambiar solo los parámetros (por ejemplo, la página del catálogo)', async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByText('Ir al catálogo'));
    scrollTo.mockClear();
    await usuario.click(screen.getByText('Página 2'));

    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it('no toca el scroll al volver con "atrás" (lo restaura el navegador)', async () => {
    const usuario = userEvent.setup();
    renderizar();

    await usuario.click(screen.getByText('Ir al catálogo'));
    scrollTo.mockClear();
    await usuario.click(screen.getByText('Atrás'));

    expect(scrollTo).not.toHaveBeenCalled();
  });
});