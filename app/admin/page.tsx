import { redirect } from 'next/navigation';
import { AdminPanel } from '@/components/AdminPanel';
import { TopNav } from '@/components/Shell';
import { canPublish, getCurrentUser, isOwner } from '@/lib/auth';
import { loadDatabase, toPublicUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const user = await getCurrentUser();
  if (!canPublish(user?.role)) redirect('/login');

  const db = await loadDatabase();
  const users = isOwner(user?.role) ? db.users.map(toPublicUser) : [];

  return (
    <>
      <TopNav user={user} />
      <main className="admin-page">
        <AdminPanel
          user={user!}
          files={db.files.sort((a, b) => b.createdAt.localeCompare(a.createdAt))}
          users={users}
        />
      </main>
    </>
  );
}
