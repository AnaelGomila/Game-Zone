import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TarjetaJuego from '../components/TarjetaJuego';

/*
  TarjetaJuego usa <Link> por dentro (react-router-dom), así que necesita
  estar envuelta en un Router aunque el test no navegue a ningún lado —
  si no, React tira un error porque <Link> no puede usarse fuera de un
  contexto de router.

  Se usa un objeto "juego" con la misma forma que devuelve la API de
  RAWG (confirmada en la Parte 7), no datos inventados sueltos.
*/
const juegoDeEjemplo = {
  id: 42,
  name: 'The Legend of Zelda',
  background_image: 'https://ejemplo.com/zelda.jpg',
  rating: 4.5,
  released: '2017-03-03',
  metacritic: 97,
  genres: [{ name: 'Aventura' }],
  platforms: [{ platform: { name: 'Switch' } }],
};

function renderizarTarjeta(props = {}) {
  return render(
    <MemoryRouter>
      <TarjetaJuego juego={juegoDeEjemplo} {...props} />
    </MemoryRouter>
  );
}

describe('TarjetaJuego', () => {
  it('muestra el nombre, el rating y los datos del panel de hover', () => {
    renderizarTarjeta();

    expect(screen.getByText('The Legend of Zelda')).toBeInTheDocument();
    expect(screen.getByText('★ 4.5')).toBeInTheDocument();

    // Estos cuatro datos son justamente los que agrega el panel de hover
    // en la Parte 7, y ya vienen en la respuesta del listado de RAWG (no
    // se piden con un fetch extra).
    expect(screen.getByText(/2017-03-03/)).toBeInTheDocument();
    expect(screen.getByText(/Switch/)).toBeInTheDocument();
    expect(screen.getByText(/97/)).toBeInTheDocument();
  });

  it('renderiza el contenido del prop "pie" cuando se lo pasa (caso Favoritos)', () => {
    renderizarTarjeta({ pie: <button>Quitar de favoritos</button> });

    expect(
      screen.getByRole('button', { name: 'Quitar de favoritos' })
    ).toBeInTheDocument();
  });
});
