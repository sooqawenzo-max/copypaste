import { loadDatabase } from '@/lib/db';
import { streamStoredFile } from '@/lib/files';
import { getCurrentUser } from '@/lib/auth';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response('Login required', { status: 403 });

  const { id } = await params;
  const db = await loadDatabase();
  const file = db.files.find((entry) => entry.id === id);
  if (!file) return new Response('Not found', { status: 404 });

  return streamStoredFile(file, request.headers.get('if-none-match'));
}
