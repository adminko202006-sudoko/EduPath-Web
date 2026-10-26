import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/useTheme';

const ThemeToggle = ({ className = '' }) => {
  const { theme, setTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Switch to light mode' : 'Switch to dark mode';

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      title={label}
      aria-label={label}
      aria-pressed={isDark}
      className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 border-slate-200 bg-white text-[#123B5D] hover:bg-slate-100 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-amber-300 dark:hover:bg-slate-700 dark:hover:border-slate-600 dark:focus-visible:ring-offset-[#071426] ${className}`}
    >
      {isDark ? <Sun size={19} strokeWidth={2} aria-hidden="true" /> : <Moon size={19} strokeWidth={2} aria-hidden="true" />}
    </button>
  );
};

export default ThemeToggle;
