import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addAuditLog, loadDatabase, saveDatabase, toPublicUser } from '@/lib/db';
import { savePostedContent } from '@/lib/files';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 403 });

  const { uid } = await params;
  const db = await loadDatabase();
  const target = db.users.find((user) => String(user.uid) === uid);
  if (!target) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  if (target.id !== current.id && current.role !== 'owner') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const form = await request.formData();
  const forumNick = String(form.get('forumNick') || '').trim();
  const bio = String(form.get('bio') || '').trim();
  const avatar = form.get('avatar');

  if (forumNick) target.forumNick = forumNick;
  target.bio = bio.slice(0, 280);

  if (avatar instanceof File && avatar.size > 0 && avatar.type.startsWith('image/')) {
    const stored = await savePostedContent({
      id: target.id,
      filename: avatar.name,
      mime: avatar.type,
      body: avatar,
      folder: 'images'
    });
    target.avatar = {
      id: crypto.randomUUID(),
      name: avatar.name,
      mime: avatar.type,
      storage: stored.storage,
      path: stored.blobPath
    };
  }

  addAuditLog(db, {
    actorId: current.id,
    action: 'profile.updated',
    targetId: target.id,
    message: `updated profile ${target.username}`
  });
  await saveDatabase(db);

  return NextResponse.json({ user: toPublicUser(target) });
}
