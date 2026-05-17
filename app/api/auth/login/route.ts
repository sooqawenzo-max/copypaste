import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { createSession, SESSION_COOKIE } from '@/lib/auth';
import { loadDatabase, saveDatabase, toPublicUser } from '@/lib/db';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string }
    | null;

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const db = await loadDatabase();
  const user = db.users.find(
    (entry) => entry.username.toLowerCase() === body.username!.toLowerCase()
  );

  if (!user || !(await bcrypt.compare(body.password, user.passwordHash))) {
    return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
  }

  user.lastSeenAt = new Date().toISOString();
  await saveDatabase(db);

  const publicUser = toPublicUser(user);
  const token = await createSession(publicUser);
  const response = NextResponse.json({ user: publicUser });

  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  });

  return response;
}
