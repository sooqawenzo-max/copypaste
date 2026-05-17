import { NextResponse } from 'next/server';
import { canPublish, getCurrentUser } from '@/lib/auth';
import { addAuditLog, loadDatabase, saveDatabase } from '@/lib/db';
import { savePostedContent, slugify } from '@/lib/files';
import { FileCategory, Platform, StoredAsset } from '@/lib/types';

const categories: FileCategory[] = ['lua', 'config'];
const platforms: Platform[] = ['nl', 'gs'];

function parseTags(input: FormDataEntryValue | null) {
  return String(input || '')
    .split(',')
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 12);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!canPublish(user?.role)) {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const db = await loadDatabase();
  const deleted = db.files.find((file) => file.id === id);
  const nextFiles = db.files.filter((file) => file.id !== id);
  if (nextFiles.length === db.files.length) {
    return NextResponse.json({ error: 'File not found' }, { status: 404 });
  }

  db.files = nextFiles;
  addAuditLog(db, {
    actorId: user!.id,
    action: 'file.deleted',
    targetId: id,
    message: `deleted ${deleted?.title || id}`
  });
  await saveDatabase(db);

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!canPublish(user?.role)) {
    return NextResponse.json({ error: 'Admins only' }, { status: 403 });
  }

  const form = await request.formData();
  const db = await loadDatabase();
  const file = db.files.find((entry) => entry.id === id);
  if (!file) return NextResponse.json({ error: 'File not found' }, { status: 404 });

  if (form.has('title')) {
    const title = String(form.get('title') || '').trim();
    if (title) {
      file.title = title;
      file.slug = slugify(title);
    }
  }

  if (form.has('category')) {
    const category = String(form.get('category') || '').toLowerCase();
    if (categories.includes(category as FileCategory)) {
      file.category = category as FileCategory;
    }
  }

  if (form.has('platform')) {
    const platform = String(form.get('platform') || '').toLowerCase();
    if (platforms.includes(platform as Platform)) {
      file.platform = platform as Platform;
    }
  }

  if (form.has('tags')) file.tags = parseTags(form.get('tags'));

  const content = String(form.get('content') || '');
  const uploaded = form.get('file');
  let nextBody: Blob | Buffer | string | null = null;
  let nextFilename = file.originalName;
  let nextMime = file.mime;
  let nextSize = file.size;

  if (uploaded instanceof File && uploaded.size > 0) {
    nextBody = uploaded;
    nextFilename = uploaded.name;
    nextMime = uploaded.type || 'text/plain';
    nextSize = uploaded.size;
  } else if (content) {
    nextBody = content;
    nextFilename = file.originalName || `${slugify(file.title)}.txt`;
    nextMime = 'text/plain';
    nextSize = Buffer.byteLength(content);
  }

  if (nextBody) {
    const stored = await savePostedContent({
      id,
      filename: nextFilename,
      mime: nextMime,
      body: nextBody
    });
    file.originalName = nextFilename;
    file.mime = nextMime;
    file.size = nextSize;
    file.storage = stored.storage;
    file.blobPath = stored.blobPath;
  }

  const imageInputs = [...form.getAll('images'), ...form.getAll('image')];
  const images = imageInputs.filter(
    (entry): entry is File =>
      entry instanceof File && entry.size > 0 && entry.type.startsWith('image/')
  ).slice(0, 3);

  if (images.length) {
    const screenshots: StoredAsset[] = [];
    for (const image of images) {
      const storedImage = await savePostedContent({
        id,
        filename: image.name,
        mime: image.type,
        body: image,
        folder: 'images'
      });
      screenshots.push({
        id: crypto.randomUUID(),
        name: image.name,
        mime: image.type,
        storage: storedImage.storage,
        path: storedImage.blobPath
      });
    }
    file.screenshots = screenshots;
    file.imageName = screenshots[0]?.name;
    file.imageMime = screenshots[0]?.mime;
    file.imageStorage = screenshots[0]?.storage;
    file.imagePath = screenshots[0]?.path;
  }

  file.updatedAt = new Date().toISOString();
  addAuditLog(db, {
    actorId: user!.id,
    action: 'file.updated',
    targetId: file.id,
    message: `updated ${file.title}`
  });
  await saveDatabase(db);

  return NextResponse.json({ file });
}
