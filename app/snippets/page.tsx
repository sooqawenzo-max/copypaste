import Link from 'next/link';
import { DotGridBackground } from '@/components/DotGridBackground';
import { TopNav } from '@/components/Shell';
import { getCurrentUser } from '@/lib/auth';

export default async function SnippetsPage() {
  const user = await getCurrentUser();

  return (
    <>
      <TopNav user={user} />
      <main className="simple-page">
        <DotGridBackground />
        <section className="simple-panel">
          <p className="eyebrow">Snippets</p>
          <h1>Small Lua ideas</h1>
          <p>
            Snippets live in the same catalog as Lua posts. Use the admin panel to
            publish tiny helpers, callbacks, UI patterns, and config notes.
          </p>
          <div className="simple-actions">
            <Link className="primary-action compact" href="/?category=lua">
              Browse lua
            </Link>
            <Link className="ghost-action" href="/admin">
              Post snippet
            </Link>
          </div>
        </section>
      </main>
    </>
  );
}
