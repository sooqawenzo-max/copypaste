'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { LanguageText } from './LanguageText';

export function CategoryNav() {
  const params = useSearchParams();
  const category = params.get('category') === 'config' ? 'config' : 'lua';

  return (
    <>
      <Link className={`nav-link ${category === 'lua' ? 'active' : 'muted'}`} href="/?category=lua">
        Lua
      </Link>
      <Link
        className={`nav-link ${category === 'config' ? 'active' : 'muted'}`}
        href="/?category=config"
      >
        <LanguageText ru="Конфиг" en="Config" />
      </Link>
    </>
  );
}
