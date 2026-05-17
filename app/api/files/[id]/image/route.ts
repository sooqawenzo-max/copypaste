import { loadDatabase } from '@/lib/db';
import { streamStoredImage } from '@/lib/files';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const db = await loadDatabase();
  const file = db.files.find((entry) => entry.id === id);
  if (!file) return new Response('Not found', { status: 404 });

  return streamStoredImage(file, request.headers.get('if-none-match'));
}
