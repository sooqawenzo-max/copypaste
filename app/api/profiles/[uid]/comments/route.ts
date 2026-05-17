import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { addAuditLog, loadDatabase, saveDatabase } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ error: 'Login required' }, { status: 403 });

  const { uid } = await params;
  const body = (await request.json().catch(() => null)) as { text?: string } | null;
  const text = body?.text?.trim();
  if (!text) return NextResponse.json({ error: 'Comment is empty' }, { status: 400 });

  const db = await loadDatabase();
  const target = db.users.find((user) => String(user.uid) === uid);
  if (!target) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const comment = {
    id: crypto.randomUUID(),
    authorId: current.id,
    text: text.slice(0, 400),
    createdAt: new Date().toISOString()
  };
  target.comments.unshift(comment);
  target.comments = target.comments.slice(0, 40);
  addAuditLog(db, {
    actorId: current.id,
    action: 'profile.comment',
    targetId: target.id,
    message: `commented on ${target.username}`
  });
  await saveDatabase(db);

  return NextResponse.json({ comment }, { status: 201 });
}
