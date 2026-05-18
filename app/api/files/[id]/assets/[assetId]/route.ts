import { getCurrentUser } from '@/lib/auth';
import { loadDatabase } from '@/lib/db';
import { streamStoredAsset } from '@/lib/files';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string; assetId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return new Response('Login required', { status: 403 });

  const { id, assetId } = await params;
  const db = await loadDatabase();
  const file = db.files.find((entry) => entry.id === id);
  const asset = file?.attachments?.find((entry) => entry.id === assetId);

  if (!file || !asset) return new Response('Not found', { status: 404 });

  return streamStoredAsset(asset, request.headers.get('if-none-match'));
}
