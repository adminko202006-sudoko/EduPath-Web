import { useContext } from 'react';

import { ThemeContext } from './themeContextInstance';

/**
 * Kept in its own module (next to the provider in `ThemeContext.jsx`) so each
 * file exports a single kind of value and React Fast Refresh keeps working.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
