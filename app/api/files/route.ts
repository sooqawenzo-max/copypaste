import { NextResponse } from 'next/server';
import { canPublish, getCurrentUser } from '@/lib/auth';
import { loadDatabase, saveDatabase } from '@/lib/db';
import { savePostedContent, slugify } from '@/lib/files';
import { DocFile, FileCategory } from '@/lib/types';

const categories: FileCategory[] = ['lua', 'config'];

export async function GET() {
  const db = await loadDatabase();
  return NextResponse.json(
    {
      files: db.files.sort((a, b) => a.title.localeCompare(b.title))
    },
    {
      headers: {
        'Cache-Control': 'no-store'
      }
    }
  );
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!canPublish(user?.role)) {
      return NextResponse.json({ error: 'Admins only' }, { status: 403 });
    }

    const form = await request.formData();
    const title = String(form.get('title') || '').trim();
    const categoryInput = String(form.get('category') || 'lua').trim().toLowerCase();
    const category = categories.includes(categoryInput as FileCategory)
      ? (categoryInput as FileCategory)
      : 'lua';
    const description = String(form.get('description') || '').trim();
    const content = String(form.get('content') || '');
    const uploaded = form.get('file');
    const image = form.get('image');

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    let filename = `${slugify(title)}.txt`;
    let mime = 'text/plain';
    let size = Buffer.byteLength(content);
    let body: Blob | Buffer | string = content;

    if (uploaded instanceof File && uploaded.size > 0) {
      filename = uploaded.name;
      mime = uploaded.type || 'text/plain';
      size = uploaded.size;
      body = uploaded;
    }

    if (!content && !(uploaded instanceof File && uploaded.size > 0)) {
      return NextResponse.json(
        { error: 'Paste content or choose a file' },
        { status: 400 }
      );
    }

    if (
      category === 'config' &&
      (!(image instanceof File) || image.size === 0 || !image.type.startsWith('image/'))
    ) {
      return NextResponse.json(
        { error: 'Configs require a screenshot image' },
        { status: 400 }
      );
    }

    const db = await loadDatabase();
    const id = crypto.randomUUID();
    const baseSlug = slugify(title);
    const existingSlugs = new Set(db.files.map((file) => file.slug));
    let slug = baseSlug;
    let suffix = 2;
    while (existingSlugs.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const stored = await savePostedContent({ id, filename, mime, body });
    const storedImage =
      image instanceof File && image.size > 0 && image.type.startsWith('image/')
        ? await savePostedContent({
            id,
            filename: image.name,
            mime: image.type,
            body: image,
            folder: 'images'
          })
        : null;
    const now = new Date().toISOString();
    const file: DocFile = {
      id,
      slug,
      title,
      category,
      description,
      originalName: filename,
      mime,
      size,
      storage: stored.storage,
      blobPath: stored.blobPath,
      imageName: image instanceof File && image.size > 0 ? image.name : undefined,
      imageMime: image instanceof File && image.size > 0 ? image.type : undefined,
      imageStorage: storedImage?.storage,
      imagePath: storedImage?.blobPath,
      authorId: user!.id,
      createdAt: now,
      updatedAt: now
    };

    db.files.push(file);
    await saveDatabase(db);

    return NextResponse.json({ file }, { status: 201 });
  } catch (error) {
    console.error('File publish failed', error);
    return NextResponse.json(
      { error: 'File publish failed on hosting. Check Vercel Blob/env logs.' },
      { status: 500 }
    );
  }
}
