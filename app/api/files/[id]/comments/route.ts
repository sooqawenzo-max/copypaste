import { NextResponse } from 'next/server';
import { canPublish, getCurrentUser } from '@/lib/auth';
import { addAuditLog, loadDatabase, saveDatabase } from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Login required' }, { status: 401 });
  }

  if (!canPublish(user.role)) {
    return NextResponse.json({ error: 'Staff only' }, { status: 403 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const text = String(body.text || '').trim();

  if (!text) {
    return NextResponse.json({ error: 'Comment is required' }, { status: 400 });
  }

  if (text.length > 1200) {
    return NextResponse.json({ error: 'Comment is too long' }, { status: 400 });
  }

  const db = await loadDatabase();
  const file = db.files.find((entry) => entry.id === id);
  if (!file) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  file.comments ||= [];
  const comment = {
    id: crypto.randomUUID(),
    authorId: user.id,
    text,
    createdAt: new Date().toISOString()
  };
  file.comments.push(comment);

  addAuditLog(db, {
    actorId: user.id,
    action: 'file.comment',
    targetId: file.id,
    message: `commented on ${file.title}`
  });
  await saveDatabase(db);

  return NextResponse.json({ comment }, { status: 201 });
}
