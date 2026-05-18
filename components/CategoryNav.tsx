'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export function CategoryNav() {
  const params = useSearchParams();
  const section = params.get('category') === 'folder' ? 'folder' : 'docs';

  return (
    <>
      <Link className={`nav-link ${section === 'docs' ? 'active' : 'muted'}`} href="/?category=docs">
        Docs
      </Link>
      <Link
        className={`nav-link ${section === 'folder' ? 'active' : 'muted'}`}
        href="/?category=folder"
      >
        Folder
      </Link>
    </>
  );
}
