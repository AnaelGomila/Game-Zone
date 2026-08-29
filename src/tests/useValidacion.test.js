import { renderHook, act } from '@testing-library/react';
import { useValidacion, requerido } from '../hooks/useValidacion';

/*
  useValidacion es lógica pura (no depende de Supabase, RAWG ni de nada
  externo), así que es el candidato más simple para empezar a testear:
  no hace falta mockear nada, solo llamar al hook con distintos valores
  y revisar qué devuelve.

  renderHook() de @testing-library/react permite usar un hook fuera de
  un componente real, como si estuviera montado. act() envuelve la
  llamada a validarFormulario() porque esa función actualiza estado
  interno (setErrores) — sin act(), React tira un warning en consola.
*/
describe('useValidacion', () => {
  it('detecta un campo vacío usando la regla "requerido"', () => {
    const { result } = renderHook(() => useValidacion());

    let esValido;
    act(() => {
      esValido = result.current.validarFormulario({
        email: { valor: '', reglas: [requerido('Ingresá tu email')] },
      });
    });

    expect(esValido).toBe(false);
    expect(result.current.errores.email).toBe('Ingresá tu email');
  });

  it('junta los errores de varios campos a la vez, sin cortar en el primero', () => {
    const { result } = renderHook(() => useValidacion());

    act(() => {
      result.current.validarFormulario({
        email: { valor: '', reglas: [requerido('Ingresá tu email')] },
        contrasena: { valor: '', reglas: [requerido('Ingresá tu contraseña')] },
      });
    });

    // Antes de este hook (Parte 3), Login/Registro validaban campo por
    // campo con "if" sueltos y cortaban en el primer error. Este test
    // confirma justamente lo que cambió: los dos campos reportan su
    // propio error en la misma pasada.
    expect(result.current.errores).toEqual({
      email: 'Ingresá tu email',
      contrasena: 'Ingresá tu contraseña',
    });
  });
});
