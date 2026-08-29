import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/*
  vitest.config.js
  -----------------
  Config separada de vite.config.js a propósito. vite.config.js usa el
  plugin experimental de React Compiler (@rolldown/plugin-babel), que es
  parte del pipeline de build de producción y no hace falta para correr
  tests. Mantener los tests en su propio archivo de config evita acoplar
  la infraestructura de testing a ese plugin.

  - environment: 'jsdom' → simula un navegador (document, window) para
    poder renderizar componentes de React sin un navegador real.
  - globals: true → permite usar describe/it/expect sin importarlos en
    cada archivo de test.
  - setupFiles → corre antes de cada archivo de test; ahí se cargan los
    matchers extra de jest-dom (toBeInTheDocument, etc).
*/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
});
