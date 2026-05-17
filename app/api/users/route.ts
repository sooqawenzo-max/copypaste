import bcrypt from 'bcryptjs';
import { NextResponse } from 'next/server';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { loadDatabase, saveDatabase, toPublicUser } from '@/lib/db';
import { Role } from '@/lib/types';

const allowedRoles: Role[] = ['admin', 'user'];

export async function GET() {
  const user = await getCurrentUser();
  if (!isOwner(user?.role)) {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 });
  }

  const db = await loadDatabase();
  return NextResponse.json({ users: db.users.map(toPublicUser) });
}

export async function POST(request: Request) {
  const currentUser = await getCurrentUser();
  if (!isOwner(currentUser?.role)) {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as
    | { username?: string; password?: string; role?: Role }
    | null;

  if (!body?.username || !body?.password) {
    return NextResponse.json({ error: 'Missing user data' }, { status: 400 });
  }

  const role = allowedRoles.includes(body.role as Role) ? body.role! : 'user';
  const db = await loadDatabase();
  const username = body.username.trim();

  if (db.users.some((entry) => entry.username.toLowerCase() === username.toLowerCase())) {
    return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
  }

  const nextUser = {
    id: crypto.randomUUID(),
    username,
    passwordHash: await bcrypt.hash(body.password, 12),
    role,
    createdAt: new Date().toISOString()
  };

  db.users.push(nextUser);
  await saveDatabase(db);

  return NextResponse.json({ user: toPublicUser(nextUser) }, { status: 201 });
}
