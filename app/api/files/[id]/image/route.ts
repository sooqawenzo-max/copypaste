import { loadDatabase } from '@/lib/db';
import { streamStoredAsset, streamStoredImage } from '@/lib/files';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = new URL(request.url);
  const shotId = url.searchParams.get('shot');
  const db = await loadDatabase();
  const file = db.files.find((entry) => entry.id === id);
  if (!file) return new Response('Not found', { status: 404 });

  if (shotId) {
    const asset = file.screenshots?.find((shot) => shot.id === shotId);
    if (!asset) return new Response('Not found', { status: 404 });
    return streamStoredAsset(asset, request.headers.get('if-none-match'));
  }

  return streamStoredImage(file, request.headers.get('if-none-match'));
}
