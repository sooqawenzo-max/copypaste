import Link from 'next/link';
import Image from 'next/image';
import { Code2, ExternalLink, Home, Lock, Search } from 'lucide-react';
import { PublicUser } from '@/lib/types';
import { ThemeToggle } from './ThemeToggle';

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
  const lockedPreview = `local access = request_login()
local file = "gamesense_locked.lua"

if access then
  loadstring(file)()
end`;

  return (
    <div className={`code-frame ${locked ? 'locked-code' : ''}`}>
      <div className="code-title">
        {locked ? <Lock size={15} /> : <Code2 size={15} />}
        <span>{locked ? 'Locked preview' : 'Example'}</span>
      </div>
      <pre>
        <code>{locked ? lockedPreview : content}</code>
      </pre>
      {locked ? (
        <div className="code-lock-overlay">
          <Lock size={18} />
          <span>Login to view code</span>
        </div>
      ) : null}
    </div>
  );
}
