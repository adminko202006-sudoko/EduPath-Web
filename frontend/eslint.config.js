import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // `src/src` is a stale, inactive duplicate tree of the real `src/` (see
  // AUDIT.md finding 5): it is not the Vite entry point and nothing imports
  // it. It is ignored here so lint reports on the code that actually ships;
  // the tree itself is pending removal approval.
  globalIgnores(['dist', 'src/src/**']),
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
])
