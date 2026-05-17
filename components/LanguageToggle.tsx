'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { getLanguageSnapshot, subscribeToLanguage } from './LanguageText';

export function LanguageToggle() {
  const language = useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, () => 'ru');

  useEffect(() => {
    document.documentElement.lang = language;
    document.documentElement.dataset.lang = language;
  }, [language]);

  function toggleLanguage() {
    const next = language === 'ru' ? 'en' : 'ru';
    window.localStorage.setItem('copypast-language', next);
    window.dispatchEvent(new Event('copypast-language-change'));
  }

  return (
    <button className="language-toggle" onClick={toggleLanguage} type="button">
      <span>{language.toUpperCase()}</span>
      <small>{language === 'ru' ? 'EN' : 'RU'}</small>
    </button>
  );
}
