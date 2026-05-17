'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { LanguageText } from './LanguageText';

export function CategoryNav() {
  const [active, setActive] = useState<'lua' | 'config'>('lua');

  useEffect(() => {
    function syncHash() {
      setActive(window.location.hash === '#config' ? 'config' : 'lua');
    }

    syncHash();
    window.addEventListener('hashchange', syncHash);
    return () => window.removeEventListener('hashchange', syncHash);
  }, []);

  return (
    <>
      <Link
        className={`nav-link ${active === 'lua' ? 'active' : 'muted'}`}
        href="/#lua"
        onClick={() => setActive('lua')}
      >
        Lua
      </Link>
      <Link
        className={`nav-link ${active === 'config' ? 'active' : 'muted'}`}
        href="/#config"
        onClick={() => setActive('config')}
      >
        <LanguageText ru="Конфиг" en="Config" />
      </Link>
    </>
  );
}
