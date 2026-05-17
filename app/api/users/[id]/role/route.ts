import { NextResponse } from 'next/server';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { loadDatabase, saveDatabase, toPublicUser } from '@/lib/db';
import { Role } from '@/lib/types';

const allowedRoles: Role[] = ['admin', 'user'];

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const currentUser = await getCurrentUser();
  if (!isOwner(currentUser?.role)) {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 });
  }

  const body = (await request.json().catch(() => null)) as { role?: Role } | null;
  if (!body?.role || !allowedRoles.includes(body.role)) {
    return NextResponse.json({ error: 'Role must be admin or user' }, { status: 400 });
  }

  const db = await loadDatabase();
  const target = db.users.find((entry) => entry.id === id);

  if (!target) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (target.role === 'owner') {
    return NextResponse.json({ error: 'Owner role is locked' }, { status: 409 });
  }

  target.role = body.role;
  await saveDatabase(db);

  return NextResponse.json({ user: toPublicUser(target) });
}
