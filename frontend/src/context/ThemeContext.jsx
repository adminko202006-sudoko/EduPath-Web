import { useCallback, useEffect, useState } from 'react';

import { ThemeContext } from './themeContextInstance';

const STORAGE_KEY = 'edupath_appearance';
const LEGACY_KEYS = ['edupath_admin_appearance', 'edupath_staff_appearance'];

function readSavedTheme() {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    for (const key of LEGACY_KEYS) {
      const legacy = window.localStorage.getItem(key);
      if (legacy === 'dark' || legacy === 'light') return legacy;
    }
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyEduPathTheme(theme) {
  if (typeof document === 'undefined') return;
  const normalized = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.classList.toggle('dark', normalized === 'dark');
  document.documentElement.dataset.theme = normalized;
  document.documentElement.style.colorScheme = normalized;
}

// Apply the saved preference as soon as this module is loaded, before React paints.
const initialTheme = readSavedTheme();
applyEduPathTheme(initialTheme);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(initialTheme);

  const setTheme = useCallback((nextTheme) => {
    const normalized = nextTheme === 'dark' ? 'dark' : 'light';
    applyEduPathTheme(normalized);
    try {
      window.localStorage.setItem(STORAGE_KEY, normalized);
      // Keep older portal-specific keys in sync for compatibility with older builds.
      LEGACY_KEYS.forEach((key) => window.localStorage.setItem(key, normalized));
    } catch {
      // Theme still works for the current session when storage is unavailable.
    }
    setThemeState(normalized);
  }, []);

  useEffect(() => {
    applyEduPathTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key !== STORAGE_KEY || (event.newValue !== 'dark' && event.newValue !== 'light')) return;
      applyEduPathTheme(event.newValue);
      setThemeState(event.newValue);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}


