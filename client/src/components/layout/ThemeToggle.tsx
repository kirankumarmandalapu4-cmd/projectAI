'use client';

import React, { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

type Theme = 'dark' | 'light';

export const ThemeToggle: React.FC = () => {
  const [theme, setTheme] = useState<Theme>('light');

  const applyTheme = (next: Theme) => {
    const root = document.documentElement;
    // Keep the theme classes mutually exclusive. This avoids mixed Tailwind
    // and CSS-variable states while switching modes.
    root.classList.remove('theme-light', 'dark');
    root.classList.add(next === 'light' ? 'theme-light' : 'dark');
    root.dataset.theme = next;
  };

  useEffect(() => {
    const saved = window.localStorage.getItem('theme') as Theme | null;
    const preferred: Theme = saved === 'dark' ? 'dark' : 'light';
    setTheme(preferred);
    applyTheme(preferred);
  }, []);

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    window.localStorage.setItem('theme', next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle p-2 rounded-xl text-slate-400 hover:text-blue-400 hover:bg-slate-800/60 transition border border-transparent"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};
