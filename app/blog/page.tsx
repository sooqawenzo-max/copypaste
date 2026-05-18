import Link from 'next/link';
import { redirect } from 'next/navigation';
import { DotGridBackground } from '@/components/DotGridBackground';
import { TopNav } from '@/components/Shell';
import { canPublish, getCurrentUser } from '@/lib/auth';

export default async function BlogPage() {
  const user = await getCurrentUser();
  if (!user) redirect('/login');
  const canOpenAdmin = canPublish(user.role);

  return (
    <>
      <TopNav user={user} />
      <main className="simple-page">
        <DotGridBackground />
        <section className="simple-panel">
          <p className="eyebrow">Blog</p>
          <h1>Changelog space</h1>
          <p>
            Use this page for updates, release notes, and featured configs. The main
            library already has locked previews for visitors without access.
          </p>
          <div className="simple-actions">
            <Link className="primary-action compact" href="/?category=docs">
              Browse docs
            </Link>
            {canOpenAdmin ? (
              <Link className="ghost-action" href="/admin">
                Publish
              </Link>
            ) : null}
          </div>
        </section>
      </main>
    </>
  );
}
