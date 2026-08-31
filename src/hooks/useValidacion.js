import { useState } from 'react';

/*
  useValidacion — pendiente desde la Parte 3, resuelto en la Parte 6.
  ----------------------------------------------------------------------
  Hook reusable de validación de formularios. Hasta ahora, Login y
  Registro validaban a mano con una fila de "if" dentro de manejarEnvio,
  cortando en el primer error encontrado. Este hook generaliza esa idea:

    const { errores, validarFormulario, limpiarErrores } = useValidacion();

    const esValido = validarFormulario({
      email: { valor: email, reglas: [requerido(), emailValido()] },
      contrasena: { valor: contrasena, reglas: [requerido(), longitudMinima(6)] },
    });

  `errores` queda como un objeto { nombreDelCampo: 'mensaje' }, para poder
  mostrar el error debajo de cada input puntual (no solo un error genérico
  para todo el formulario). `validarFormulario` valida todos los campos de
  una, junta todos los errores (no corta en el primero) y devuelve un
  booleano.

  Las "reglas" son funciones (valor) => mensaje | ''. Se exportan algunas
  reglas comunes reusables abajo; cada pantalla puede armar las suyas si
  necesita algo más específico.
*/
export function useValidacion() {
  const [errores, setErrores] = useState({});

  function validarFormulario(campos) {
    const nuevosErrores = {};

    for (const [nombreCampo, { valor, reglas }] of Object.entries(campos)) {
      for (const regla of reglas) {
        const mensaje = regla(valor);
        if (mensaje) {
          nuevosErrores[nombreCampo] = mensaje;
          break;
        }
      }
    }

    setErrores(nuevosErrores);
    return Object.keys(nuevosErrores).length === 0;
  }

  function limpiarErrores() {
    setErrores({});
  }

  return { errores, validarFormulario, limpiarErrores };
}

// --- Reglas reusables ---------------------------------------------------

export const requerido =
  (mensaje = 'Este campo es obligatorio') =>
  (valor) =>
    !valor || !String(valor).trim() ? mensaje : '';

export const emailValido =
  (mensaje = 'Ingresá un email válido') =>
  (valor) =>
    valor && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor) ? mensaje : '';

export const longitudMinima =
  (minimo, mensaje) =>
  (valor) =>
    valor && String(valor).length < minimo
      ? mensaje || `Debe tener al menos ${minimo} caracteres`
      : '';

export const coincideCon =
  (otroValor, mensaje = 'Los valores no coinciden') =>
  (valor) =>
    valor !== otroValor ? mensaje : '';

// Solo valida el formato si hay algo cargado — pensada para campos de
// link opcionales (ej: linkReferencia en SugerirJuego), donde dejar el
// campo vacío es válido pero completarlo con algo que no es una URL, no.
export const urlValida =
  (mensaje = 'Ingresá un link válido (ej: https://...)') =>
  (valor) => {
    if (!valor || !String(valor).trim()) return '';
    try {
      new URL(valor);
      return '';
    } catch {
      return mensaje;
    }
  };
