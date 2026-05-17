import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSession, SESSION_COOKIE } from '@/lib/auth';
import { addAuditLog, loadDatabase, nextUid, saveDatabase, toPublicUser } from '@/lib/db';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string; invite?: string; forumNick?: string }
    | null;

  if (!body?.username || !body?.password || !body?.invite) {
    return NextResponse.json({ error: 'Invite, username and password required' }, { status: 400 });
  }

  const db = await loadDatabase();
  const invite = db.inviteKeys.find(
    (entry) => entry.key.toLowerCase() === body.invite!.trim().toLowerCase() && !entry.usedBy
  );

  if (!invite) {
    return NextResponse.json({ error: 'Invalid or used invite key' }, { status: 403 });
  }

  const username = body.username.trim();
  if (db.users.some((entry) => entry.username.toLowerCase() === username.toLowerCase())) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
  }

  const now = new Date().toISOString();
  const user = {
    id: crypto.randomUUID(),
    uid: nextUid(db),
    username,
    forumNick: body.forumNick?.trim() || username,
    passwordHash: await bcrypt.hash(body.password, 12),
    role: 'user' as const,
    createdAt: now,
    lastSeenAt: now,
    comments: []
  };

  invite.usedBy = user.id;
  invite.usedAt = now;
  db.users.push(user);
  addAuditLog(db, {
    actorId: user.id,
    action: 'invite.used',
    targetId: invite.id,
    message: `${username} registered by invite`
  });
  await saveDatabase(db);

  const publicUser = toPublicUser(user);
  const token = await createSession(publicUser);
  const response = NextResponse.json({ user: publicUser }, { status: 201 });
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });

  return response;
}
