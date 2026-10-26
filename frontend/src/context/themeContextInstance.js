import { createContext } from 'react';

/**
 * The theme context itself lives in its own module so that
 * `ThemeContext.jsx` (the provider) and `useTheme.js` (the hook) can each
 * export a single kind of value — React Fast Refresh keeps working that way
 * (`react-refresh/only-export-components`).
 */
const ThemeContext = createContext(null);

export { ThemeContext };
