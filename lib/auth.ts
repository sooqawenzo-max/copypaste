import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { loadDatabase } from './db';
import { PublicUser } from './types';

export const SESSION_COOKIE = 'copypast_session';

function secretKey() {
  const secret =
    process.env.AUTH_SECRET ||
    'copypast-dev-secret-change-before-production-please';
  return new TextEncoder().encode(secret);
}

export async function createSession(user: PublicUser) {
  return new SignJWT({
    sub: user.id,
    username: user.username,
    role: user.role
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secretKey());
}

export async function verifySession(token?: string) {
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || typeof payload.sub !== 'string') return null;
    return {
      id: payload.sub,
      username: String(payload.username || ''),
      role: payload.role as PublicUser['role']
    };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = await verifySession(token);
  if (!session) return null;

  const db = await loadDatabase();
  const user = db.users.find((entry) => entry.id === session.id);
  if (!user) return null;

  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function canPublish(role?: string) {
  return role === 'owner' || role === 'admin';
}

export function isOwner(role?: string) {
  return role === 'owner';
}
