import { NextResponse } from 'next/server';
import { canPublish, getCurrentUser } from '@/lib/auth';
import { addAuditLog, loadDatabase, saveDatabase } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ uid: string; commentId: string }> }
) {
  const current = await getCurrentUser();
  if (!canPublish(current?.role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 });
  }

  const { uid, commentId } = await params;
  const db = await loadDatabase();
  const target = db.users.find((user) => String(user.uid) === uid);
  if (!target) return NextResponse.json({ error: 'Profile not found' }, { status: 404 });

  const before = target.comments?.length || 0;
  target.comments = (target.comments || []).filter((comment) => comment.id !== commentId);
  if (target.comments.length === before) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  addAuditLog(db, {
    actorId: current!.id,
    action: 'profile.comment',
    targetId: target.id,
    message: `deleted profile comment on ${target.username}`
  });
  await saveDatabase(db);

  return NextResponse.json({ ok: true });
}
