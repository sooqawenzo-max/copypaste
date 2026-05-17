import { NextResponse } from 'next/server';
import { canPublish, getCurrentUser } from '@/lib/auth';
import { loadDatabase, saveDatabase } from '@/lib/db';

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!canPublish(user?.role)) {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const db = await loadDatabase();
  const nextFiles = db.files.filter((file) => file.id !== id);
  if (nextFiles.length === db.files.length) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  db.files = nextFiles;
  await saveDatabase(db);

  return NextResponse.json({ ok: true });
}
