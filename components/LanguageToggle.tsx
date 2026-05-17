'use client';

import { useEffect, useSyncExternalStore } from 'react';

type Language = 'ru' | 'en';

function getSnapshot(): Language {
  if (typeof window === 'undefined') return 'ru';
  return window.localStorage.getItem('copypast-language') === 'en' ? 'en' : 'ru';
}

function subscribe(callback: () => void) {
  window.addEventListener('copypast-language-change', callback);
  return () => window.removeEventListener('copypast-language-change', callback);
}

export function LanguageToggle() {
  const language = useSyncExternalStore(subscribe, getSnapshot, () => 'ru');

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  function toggleLanguage() {
    const next = language === 'ru' ? 'en' : 'ru';
    window.localStorage.setItem('copypast-language', next);
    window.dispatchEvent(new Event('copypast-language-change'));
  }

  return (
    <button className="language-toggle" onClick={toggleLanguage} type="button">
      {language.toUpperCase()}
    </button>
  );
}
