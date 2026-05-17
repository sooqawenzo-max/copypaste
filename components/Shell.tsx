import Link from 'next/link';
import Image from 'next/image';
import { ExternalLink, Home } from 'lucide-react';
import { PublicUser } from '@/lib/types';
import { ThemeToggle } from './ThemeToggle';
import { CodePreview } from './CodePreview';
import { CategoryNav } from './CategoryNav';
import { SearchBox } from './SearchBox';
import { OnlinePulse } from './OnlinePulse';

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
      <OnlinePulse enabled={Boolean(user)} />
      <div className="nav-inner">
        <div className="nav-left">
          <Brand />
          <CategoryNav />
        </div>
        <div className="nav-right">
          <Link className="nav-link get-link profile-top-link" href={user ? `/u/${user.uid}` : '/login'}>
            {user ? user.forumNick || user.username : 'Login'}
            <ExternalLink size={14} />
          </Link>
          <ThemeToggle />
          <SearchBox />
        </div>
      </div>
    </nav>
  );
}

export function Breadcrumbs({
  current: _current,
  category: _category
}: {
  current: string;
  category: string;
}) {
  return (
    <div className="breadcrumbs" aria-label="Breadcrumbs">
      <Link href="/" className="crumb-icon" aria-label="Home page">
        <Home size={16} />
      </Link>
    </div>
  );
}

export function CodeFrame({
  content,
  locked = false,
  downloadUrl,
  filename
}: {
  content: string;
  locked?: boolean;
  downloadUrl?: string;
  filename?: string;
}) {
  return (
    <CodePreview
      content={content}
      locked={locked}
      previewLines={10}
      downloadUrl={downloadUrl}
      filename={filename}
    />
  );
}
