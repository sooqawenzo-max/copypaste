import { get, put } from '@vercel/blob';
import bcrypt from 'bcryptjs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { AuditAction, Database, FileCategory, User } from './types';

const DB_PATH = 'db/copypast.json';
const LOCAL_DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), 'copypast')
  : path.join(process.cwd(), '.data');
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
        uid: 1,
        username: 'admin',
        forumNick: 'admin',
        passwordHash: await bcrypt.hash(password, 12),
        role: 'owner',
        createdAt: now,
        lastSeenAt: now,
        comments: []
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
        platform: 'gs',
        tags: ['starter', 'gamesense'],
        originalName: 'lua.lua',
        mime: 'text/plain',
        size: 615,
        storage: 'local',
        blobPath: 'seed/getting-started.lua',
        screenshots: [],
        attachments: [],
        comments: [],
        authorId: 'admin',
        createdAt: now,
        updatedAt: now
      }
    ],
    auditLogs: [],
    inviteKeys: []
  };
}

function normalizeCategory(category: string): FileCategory {
  if (category.toLowerCase() === 'folder') return 'folder';
  return category.toLowerCase() === 'config' ? 'config' : 'lua';
}

async function normalizeDatabase(db: Database) {
  let changed = false;
  db.auditLogs ||= [];
  db.inviteKeys ||= [];

  let maxUid = db.users.reduce((max, user) => Math.max(max, user.uid || 0), 0);
  db.users = db.users.map((user) => {
    const next: User = {
      ...user,
      uid: user.uid || ++maxUid,
      forumNick: user.forumNick || user.username,
      comments: user.comments || [],
      lastSeenAt: user.lastSeenAt || user.createdAt
    };

    if (
      next.uid !== user.uid ||
      next.forumNick !== user.forumNick ||
      next.comments !== user.comments ||
      next.lastSeenAt !== user.lastSeenAt
    ) {
      changed = true;
    }

    return next;
  });

  db.files = db.files.map((file) => {
    const nextCategory = normalizeCategory(file.category);
    const screenshots = file.screenshots || [];
    if (file.imagePath && !screenshots.some((shot) => shot.path === file.imagePath)) {
      screenshots.push({
        id: `${file.id}-legacy-shot`,
        name: file.imageName || 'screenshot',
        mime: file.imageMime || 'image/png',
        storage: file.imageStorage || file.storage,
        path: file.imagePath
      });
      changed = true;
    }

    const nextFile = {
      ...file,
      category: nextCategory,
      platform: file.platform || 'gs',
      tags: file.tags || [],
      screenshots,
      attachments: file.attachments || [],
      comments: file.comments || []
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
        platform: 'gs' as const,
        tags: ['starter', 'gamesense'],
        originalName: 'lua.lua',
        screenshots: [],
        attachments: []
      };
    }

    if (
      file.category !== nextCategory ||
      !file.platform ||
      !file.tags ||
      !file.screenshots ||
      !file.attachments ||
      !file.comments
    ) {
      changed = true;
    }
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
    const result = await get(DB_PATH, { access: 'private', useCache: false });
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
      contentType: 'application/json',
      cacheControlMaxAge: 60
    });
    return;
  }

  await writeLocalDatabase(db);
}

export function toPublicUser(user: Database['users'][number]) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

export function nextUid(db: Database) {
  return db.users.reduce((max, user) => Math.max(max, user.uid || 0), 0) + 1;
}

export function addAuditLog(
  db: Database,
  args: {
    actorId: string;
    action: AuditAction;
    targetId?: string;
    message: string;
  }
) {
  db.auditLogs ||= [];
  db.auditLogs.unshift({
    id: crypto.randomUUID(),
    actorId: args.actorId,
    action: args.action,
    targetId: args.targetId,
    message: args.message,
    createdAt: new Date().toISOString()
  });
  db.auditLogs = db.auditLogs.slice(0, 250);
}
