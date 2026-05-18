import { NextResponse } from 'next/server';
import { canPublish, getCurrentUser } from '@/lib/auth';
import { addAuditLog, loadDatabase, saveDatabase } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  const user = await getCurrentUser();
  if (!canPublish(user?.role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 });
  }

  const { id, commentId } = await params;
  const db = await loadDatabase();
  const file = db.files.find((entry) => entry.id === id);
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  const before = file.comments?.length || 0;
  file.comments = (file.comments || []).filter((comment) => comment.id !== commentId);
  if (file.comments.length === before) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  addAuditLog(db, {
    actorId: user!.id,
    action: 'file.comment',
    targetId: file.id,
    message: `deleted comment on ${file.title}`
  });
  await saveDatabase(db);

  return NextResponse.json({ ok: true });
}
