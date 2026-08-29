// Se ejecuta una vez antes de cada archivo de test (configurado en
// vitest.config.js, campo "setupFiles"). Agrega los matchers extra de
// jest-dom a expect(), como toBeInTheDocument() o toHaveTextContent(),
// que no vienen incluidos en Vitest por defecto.
import '@testing-library/jest-dom';
