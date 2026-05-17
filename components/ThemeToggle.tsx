'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { Moon } from 'lucide-react';

type ThemeName = 'dark' | 'russian';

function getThemeSnapshot(): ThemeName {
  if (typeof window === 'undefined') return 'dark';
  return window.localStorage.getItem('copypast-theme') === 'russian'
    ? 'russian'
    : 'dark';
}

function subscribeToTheme(callback: () => void) {
  window.addEventListener('storage', callback);
  window.addEventListener('copypast-theme-change', callback);

  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('copypast-theme-change', callback);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, () => 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  function toggleTheme() {
    const next = theme === 'dark' ? 'russian' : 'dark';
    document.documentElement.dataset.theme = next;
    window.localStorage.setItem('copypast-theme', next);
    window.dispatchEvent(new Event('copypast-theme-change'));
  }

  return (
    <button
      className={`icon-btn theme-toggle ${theme === 'russian' ? 'russian-active' : ''}`}
      aria-label={theme === 'dark' ? 'Switch to Russian theme' : 'Switch to dark theme'}
      title={theme === 'dark' ? 'Russian theme' : 'Dark theme'}
      onClick={toggleTheme}
      type="button"
    >
      <Moon size={18} className="theme-moon" />
      <span className="flag-stripes" aria-hidden="true" />
    </button>
  );
}
