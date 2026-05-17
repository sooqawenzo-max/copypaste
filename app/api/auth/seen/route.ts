import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { loadDatabase, saveDatabase } from '@/lib/db';

export async function POST() {
  const current = await getCurrentUser();
  if (!current) return NextResponse.json({ ok: false }, { status: 401 });

  const db = await loadDatabase();
  const user = db.users.find((entry) => entry.id === current.id);
  if (!user) return NextResponse.json({ ok: false }, { status: 404 });

  user.lastSeenAt = new Date().toISOString();
  await saveDatabase(db);

  return NextResponse.json({ ok: true });
}
