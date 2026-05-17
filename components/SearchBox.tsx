'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';
import { useLanguage } from './LanguageText';

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const language = useLanguage();
  const [query, setQuery] = useState(params.get('q') || '');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = new URLSearchParams(params.toString());
    if (query.trim()) next.set('q', query.trim());
    else next.delete('q');
    router.push(`/?${next.toString()}`);
  }

  return (
    <form className="search-pill search-form" onSubmit={submit}>
      <Search size={18} />
      <input
        aria-label="Search files and profiles"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={language === 'ru' ? 'Поиск' : 'Search'}
      />
    </form>
  );
}
