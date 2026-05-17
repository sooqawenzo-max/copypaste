'use client';

import { useSyncExternalStore } from 'react';

export type Language = 'ru' | 'en';

export function getLanguageSnapshot(): Language {
  if (typeof window === 'undefined') return 'ru';
  return window.localStorage.getItem('copypast-language') === 'en' ? 'en' : 'ru';
}

export function subscribeToLanguage(callback: () => void) {
  window.addEventListener('copypast-language-change', callback);
  return () => window.removeEventListener('copypast-language-change', callback);
}

export function useLanguage() {
  return useSyncExternalStore(subscribeToLanguage, getLanguageSnapshot, () => 'ru');
}

export function LanguageText({ ru, en }: { ru: string; en: string }) {
  const language = useLanguage();
  return language === 'ru' ? ru : en;
}
