import { NextResponse } from 'next/server';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { addAuditLog, loadDatabase, saveDatabase } from '@/lib/db';

function makeKey() {
  return `CP-${crypto.randomUUID().slice(0, 8).toUpperCase()}-${crypto.randomUUID()
    .slice(0, 4)
    .toUpperCase()}`;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!isOwner(user?.role)) {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 });
  }

  const db = await loadDatabase();
  return NextResponse.json({ invites: db.inviteKeys || [] });
}

export async function POST() {
  const user = await getCurrentUser();
  if (!isOwner(user?.role)) {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 });
  }

  const db = await loadDatabase();
  const invite = {
    id: crypto.randomUUID(),
    key: makeKey(),
    createdBy: user!.id,
    createdAt: new Date().toISOString()
  };

  db.inviteKeys.unshift(invite);
  addAuditLog(db, {
    actorId: user!.id,
    action: 'invite.created',
    targetId: invite.id,
    message: 'created invite key'
  });
  await saveDatabase(db);

  return NextResponse.json({ invite }, { status: 201 });
}
