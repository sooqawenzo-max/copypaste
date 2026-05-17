import { loadDatabase } from '@/lib/db';
import { streamStoredAsset } from '@/lib/files';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const { uid } = await params;
  const db = await loadDatabase();
  const user = db.users.find((entry) => String(entry.uid) === uid);
  if (!user?.avatar) return new Response('Not found', { status: 404 });

  return streamStoredAsset(user.avatar, request.headers.get('if-none-match'));
}
