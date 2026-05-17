import { NextResponse } from 'next/server';
import { getCurrentUser, isOwner } from '@/lib/auth';
import { loadDatabase } from '@/lib/db';

export async function GET() {
  const user = await getCurrentUser();
  if (!isOwner(user?.role)) {
    return NextResponse.json({ error: 'Owner only' }, { status: 403 });
  }

  const db = await loadDatabase();
  return NextResponse.json({ logs: db.auditLogs || [] });
}
