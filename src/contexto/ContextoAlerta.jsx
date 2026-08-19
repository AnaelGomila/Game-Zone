import { createContext, useCallback, useContext, useState } from 'react';
import './contextoAlerta.css';

/*
  ContextoAlerta — pendiente desde la Parte 3, resuelto en la Parte 6.
  ----------------------------------------------------------------------
  Sistema de alertas/toast global vía Context API. Hasta ahora, los
  errores de cada formulario se mostraban como texto simple dentro del
  propio formulario (Login, Registro). Este contexto agrega una forma
  reutilizable de mostrar mensajes flotantes (éxito, error o info) desde
  cualquier pantalla, sin tener que repetir el manejo de estado en cada
  componente.

  Uso: const { mostrarAlerta } = useAlerta();
       mostrarAlerta('Cuenta creada con éxito', 'exito');

  Las alertas se autodestruyen a los 4 segundos, y también se pueden
  cerrar a mano con el botón "×". Se guardan en un array porque puede
  haber más de una visible al mismo tiempo (apiladas).
*/

const ContextoAlerta = createContext(null);

const DURACION_MS = 4000;

export function ProveedorAlerta({ children }) {
  const [alertas, setAlertas] = useState([]);

  const cerrarAlerta = useCallback((id) => {
    setAlertas((actuales) => actuales.filter((alerta) => alerta.id !== id));
  }, []);

  const mostrarAlerta = useCallback(
    (mensaje, tipo = 'info') => {
      const id = crypto.randomUUID();
      setAlertas((actuales) => [...actuales, { id, mensaje, tipo }]);
      setTimeout(() => cerrarAlerta(id), DURACION_MS);
    },
    [cerrarAlerta]
  );

  const valor = { mostrarAlerta };

  return (
    <ContextoAlerta.Provider value={valor}>
      {children}

      <div className="contenedor-alertas" role="status" aria-live="polite">
        {alertas.map((alerta) => (
          <div key={alerta.id} className={`alerta alerta-${alerta.tipo}`}>
            <span>{alerta.mensaje}</span>
            <button
              type="button"
              className="alerta-cerrar"
              onClick={() => cerrarAlerta(alerta.id)}
              aria-label="Cerrar alerta"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ContextoAlerta.Provider>
  );
}

export function useAlerta() {
  const contexto = useContext(ContextoAlerta);
  if (!contexto) {
    throw new Error('useAlerta debe usarse dentro de <ProveedorAlerta>');
  }
  return contexto;
}
