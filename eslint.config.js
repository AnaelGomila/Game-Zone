import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  },
  {
    // Los archivos de test usan describe/it/expect/vi (globals que
    // inyecta Vitest en tiempo de test) — sin esto, eslint los marcaba
    // como "no definidos" aunque nunca fue un problema real: los tests
    // corren bien (vitest.config.js ya trae "globals: true"), era
    // puramente que el linter no lo sabía.
    files: ['**/*.test.{js,jsx}'],
    languageOptions: {
      globals: globals.vitest,
    },
  },
])
