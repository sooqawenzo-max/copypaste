import { get, put } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { Database, FileCategory } from './types';

const DB_PATH = 'db/copypast.json';
const LOCAL_DATA_DIR = path.join(process.cwd(), '.data');
const LOCAL_DB_PATH = path.join(LOCAL_DATA_DIR, 'copypast-db.json');

function hasVercelBlobToken() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

async function streamToText(stream: ReadableStream<Uint8Array> | null) {
  if (!stream) return '';
  const response = new Response(stream);
  return response.text();
}

async function seedDatabase(): Promise<Database> {
  const now = new Date().toISOString();
  const password = process.env.ADMIN_SEED_PASSWORD || 'dylan1336kuroko';

  return {
    version: 1,
    users: [
      {
        id: 'admin',
        username: 'admin',
        passwordHash: await bcrypt.hash(password, 12),
        role: 'owner',
        createdAt: now
      }
    ],
    files: [
      {
        id: 'getting-started',
        slug: 'lua',
        title: 'lua',
        category: 'lua',
        description:
          'A starter GameSense Lua post. Login to view raw code and download files.',
        originalName: 'lua.lua',
        mime: 'text/plain',
        size: 615,
        storage: 'local',
        blobPath: 'seed/getting-started.lua',
        authorId: 'admin',
        createdAt: now,
        updatedAt: now
      }
    ]
  };
}

function normalizeCategory(category: string): FileCategory {
  return category.toLowerCase() === 'config' ? 'config' : 'lua';
}

async function normalizeDatabase(db: Database) {
  let changed = false;

  db.files = db.files.map((file) => {
    const nextCategory = normalizeCategory(file.category);
    const nextFile = {
      ...file,
      category: nextCategory
    };

    if (file.id === 'getting-started') {
      if (
        file.slug !== 'lua' ||
        file.title !== 'lua' ||
        file.category !== 'lua'
      ) {
        changed = true;
      }

      return {
        ...nextFile,
        slug: 'lua',
        title: 'lua',
        category: 'lua' as const,
        description:
          'A starter GameSense Lua post. Login to view raw code and download files.',
        originalName: 'lua.lua'
      };
    }

    if (file.category !== nextCategory) changed = true;
    return nextFile;
  });

  return { db, changed };
}

async function readLocalDatabase(): Promise<Database | null> {
  try {
    const raw = await readFile(LOCAL_DB_PATH, 'utf8');
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

async function writeLocalDatabase(db: Database) {
  await mkdir(LOCAL_DATA_DIR, { recursive: true });
  await writeFile(LOCAL_DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

async function readBlobDatabase(): Promise<Database | null> {
  try {
    const result = await get(DB_PATH, { access: 'private' });
    if (!result || result.statusCode !== 200) return null;
    const raw = await streamToText(result.stream);
    return JSON.parse(raw) as Database;
  } catch {
    return null;
  }
}

export async function loadDatabase(): Promise<Database> {
  const existing = hasVercelBlobToken()
    ? await readBlobDatabase()
    : await readLocalDatabase();

  if (existing) {
    const normalized = await normalizeDatabase(existing);
    if (normalized.changed) await saveDatabase(normalized.db);
    return normalized.db;
  }

  const seeded = await seedDatabase();
  await saveDatabase(seeded);
  return seeded;
}

export async function saveDatabase(db: Database) {
  if (hasVercelBlobToken()) {
    await put(DB_PATH, JSON.stringify(db, null, 2), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json'
    });
    return;
  }

  await writeLocalDatabase(db);
}

export function toPublicUser(user: Database['users'][number]) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}
