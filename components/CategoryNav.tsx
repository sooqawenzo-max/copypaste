'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function CategoryNav() {
  const params = useSearchParams();
  const category = params.get('category') === 'config'
    ? 'config'
    : params.get('category') === 'all'
      ? 'all'
      : 'lua';

  return (
    <>
      <Link className={`nav-link ${category === 'all' ? 'active' : 'muted'}`} href="/?category=all">
        All
      </Link>
      <Link className={`nav-link ${category === 'lua' ? 'active' : 'muted'}`} href="/?category=lua">
        Lua
      </Link>
      <Link
        className={`nav-link ${category === 'config' ? 'active' : 'muted'}`}
        href="/?category=config"
      >
        Config
      </Link>
    </>
  );
}
