import { notFound } from 'next/navigation';
import { DotGridBackground } from '@/components/DotGridBackground';
import { ProfilePanel } from '@/components/ProfilePanel';
import { TopNav } from '@/components/Shell';
import { getCurrentUser } from '@/lib/auth';
import { loadDatabase, toPublicUser } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function UserPage({ params }: { params: Promise<{ uid: string }> }) {
  const { uid } = await params;
  const [db, currentUser] = await Promise.all([loadDatabase(), getCurrentUser()]);
  const user = db.users.find((entry) => String(entry.uid) === uid);
  if (!user) notFound();

  const publicUsers = db.users.map(toPublicUser);
  const commentAuthors = Object.fromEntries(publicUsers.map((entry) => [entry.id, entry]));
  const publishCount = db.files.filter((file) => file.authorId === user.id).length;
  const ageDays = 1;

  return (
    <>
      <TopNav user={currentUser} />
      <main className="simple-page profile-page">
        <DotGridBackground />
        <ProfilePanel
          profile={toPublicUser(user)}
          currentUser={currentUser}
          commentAuthors={commentAuthors}
          publishCount={publishCount}
          ageDays={ageDays}
        />
      </main>
    </>
  );
}
