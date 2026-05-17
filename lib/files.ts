import { get, put } from '@vercel/blob';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { DocFile, StoredAsset } from './types';

const LOCAL_DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'copypast')
  : path.join(process.cwd(), '.data');
const LOCAL_UPLOAD_DIR = path.join(LOCAL_DATA_DIR, 'uploads');

const seedContent = `local copypast = {
  name = "lua",
  game = "gamesense",
  type = "script"
}

local function announce(item)
  print(string.format("loaded %s for %s", item.name, item.game))
end

announce(copypast)
`;

export function slugify(input: string) {
  const fallback = 'file';
  const slug = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return slug || fallback;
}

function hasVercelBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function localPathFromBlobPath(blobPath: string) {
  const safePath = blobPath.replace(/^(files|images)\//, '').replace(/[/\\]/g, '_');
  return path.join(LOCAL_UPLOAD_DIR, safePath);
}

export async function savePostedContent(args: {
  id: string;
  filename: string;
  mime: string;
  body: Blob | Buffer | string;
  folder?: 'files' | 'images';
}) {
  const folder = args.folder || 'files';
  const pathname = `${folder}/${args.id}-${slugify(args.filename)}`;

  if (hasVercelBlobToken()) {
    await put(pathname, args.body, {
      access: 'private',
      allowOverwrite: true,
      contentType: args.mime || 'text/plain',
      cacheControlMaxAge: 60
    });

    return {
      storage: 'blob' as const,
      blobPath: pathname
    };
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const target = localPathFromBlobPath(pathname);
  const data =
    typeof args.body === 'string'
      ? Buffer.from(args.body)
      : Buffer.isBuffer(args.body)
        ? args.body
        : Buffer.from(await (args.body as Blob).arrayBuffer());

  await writeFile(target, data);

  return {
    storage: 'local' as const,
    blobPath: pathname
  };
}

export async function readStoredFileText(file: DocFile) {
  if (file.id === 'getting-started') return seedContent;

  if (file.storage === 'blob') {
    const result = await get(file.blobPath, { access: 'private', useCache: false });
    if (!result || result.statusCode !== 200 || !result.stream) return '';
    return new Response(result.stream).text();
  }

  try {
    return readFile(localPathFromBlobPath(file.blobPath), 'utf8');
  } catch {
    return '';
  }
}

export async function streamStoredFile(file: DocFile, ifNoneMatch?: string | null) {
  if (file.id === 'getting-started') {
    return new Response(seedContent, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'private, no-cache'
      }
    });
  }

  if (file.storage === 'blob') {
    const result = await get(file.blobPath, {
      access: 'private',
      useCache: false,
      ifNoneMatch: ifNoneMatch ?? undefined
    });

    if (!result) return new Response('Not found', { status: 404 });

    if (result.statusCode === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          'Cache-Control': 'private, no-cache'
        }
      });
    }

    if (result.statusCode !== 200 || !result.stream) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || file.mime,
        ETag: result.blob.etag,
        'Cache-Control': 'private, no-cache'
      }
    });
  }

  try {
    const body = await readFile(localPathFromBlobPath(file.blobPath));
    return new Response(body, {
      headers: {
        'Content-Type': file.mime || 'application/octet-stream',
        'Cache-Control': 'private, no-cache'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}

export async function streamStoredImage(file: DocFile, ifNoneMatch?: string | null) {
  const firstScreenshot =
    file.screenshots?.[0] ||
    (file.imagePath && file.imageMime && file.imageStorage
      ? {
          id: `${file.id}-legacy-shot`,
          name: file.imageName || 'screenshot',
          mime: file.imageMime,
          storage: file.imageStorage,
          path: file.imagePath
        }
      : null);

  if (!firstScreenshot) {
    return new Response('Not found', { status: 404 });
  }

  return streamStoredAsset(firstScreenshot, ifNoneMatch);
}

export async function streamStoredAsset(asset: StoredAsset, ifNoneMatch?: string | null) {
  if (asset.storage === 'blob') {
    const result = await get(asset.path, {
      access: 'private',
      useCache: false,
      ifNoneMatch: ifNoneMatch ?? undefined
    });

    if (!result) return new Response('Not found', { status: 404 });

    if (result.statusCode === 304) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: result.blob.etag,
          'Cache-Control': 'private, no-cache'
        }
      });
    }

    if (result.statusCode !== 200 || !result.stream) {
      return new Response('Not found', { status: 404 });
    }

    return new Response(result.stream, {
      headers: {
        'Content-Type': result.blob.contentType || asset.mime,
        ETag: result.blob.etag,
        'Cache-Control': 'private, no-cache'
      }
    });
  }

  try {
    const body = await readFile(localPathFromBlobPath(asset.path));
    return new Response(body, {
      headers: {
        'Content-Type': asset.mime,
        'Cache-Control': 'private, no-cache'
      }
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}
