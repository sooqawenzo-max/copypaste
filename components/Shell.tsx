import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Home, Search } from 'lucide-react';
import { PublicUser } from '@/lib/types';
import { ThemeToggle } from './ThemeToggle';
import { CodePreview } from './CodePreview';

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="copypast home">
      <Image src="/brand-mark.svg" alt="" className="brand-mark" width={26} height={26} />
      <span className="brand-copy">copy</span>
      <span className="brand-past">past</span>
      <span className="brand-docs">Docs</span>
    </Link>
  );
}

export function TopNav({ user }: { user: PublicUser | null }) {
  return (
    <nav className="top-nav">
      <div className="nav-inner">
        <div className="nav-left">
          <Brand />
          <Link className="nav-link active" href="/?category=lua">
            Lua
          </Link>
          <Link className="nav-link muted" href="/?category=config">
            Config
          </Link>
          <Link className="nav-link muted" href="/snippets">
            Snippets
          </Link>
          <Link className="nav-link muted" href="/blog">
            Blog
          </Link>
        </div>
        <div className="nav-right">
          <Link className="nav-link get-link" href={user ? '/admin' : '/login'}>
            {user ? user.username : 'Login'}
            <ExternalLink size={14} />
          </Link>
          <ThemeToggle />
          <Link className="search-pill" href="/?category=lua">
            <Search size={20} />
            <span>Search</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

export function Breadcrumbs({
  current,
  category
}: {
  current: string;
  category: string;
}) {
  return (
    <div className="breadcrumbs" aria-label="Breadcrumbs">
      <Link href="/" className="crumb-icon" aria-label="Home page">
        <Home size={16} />
      </Link>
      <span className="crumb-separator">/</span>
      <Link href={`/?category=${category}`}>{category}</Link>
      <span className="crumb-separator">/</span>
      <span className="crumb-badge">{current}</span>
    </div>
  );
}

export function CodeFrame({
  content,
  locked = false
}: {
  content: string;
  locked?: boolean;
}) {
  return <CodePreview content={content} locked={locked} previewLines={10} />;
}
