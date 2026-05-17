export type Role = 'owner' | 'admin' | 'user';
export type StorageKind = 'blob' | 'local';
export type FileCategory = 'lua' | 'config';
export type Platform = 'nl' | 'gs';

export type StoredAsset = {
  id: string;
  name: string;
  mime: string;
  storage: StorageKind;
  path: string;
};

export type ProfileComment = {
  id: string;
  authorId: string;
  text: string;
  createdAt: string;
};

export type User = {
  id: string;
  uid: number;
  username: string;
  forumNick: string;
  passwordHash: string;
  role: Role;
  bio?: string;
  avatar?: StoredAsset;
  createdAt: string;
  lastSeenAt?: string;
  comments: ProfileComment[];
};

export type DocFile = {
  id: string;
  slug: string;
  title: string;
  category: FileCategory;
  description: string;
  platform: Platform;
  tags: string[];
  originalName: string;
  mime: string;
  size: number;
  storage: StorageKind;
  blobPath: string;
  imageName?: string;
  imageMime?: string;
  imageStorage?: StorageKind;
  imagePath?: string;
  screenshots: StoredAsset[];
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  version: 1;
  users: User[];
  files: DocFile[];
  auditLogs: AuditLog[];
  inviteKeys: InviteKey[];
};

export type PublicUser = Omit<User, 'passwordHash'>;

export type AuditAction =
  | 'file.created'
  | 'file.updated'
  | 'file.deleted'
  | 'user.created'
  | 'user.role'
  | 'invite.created'
  | 'invite.used'
  | 'profile.comment'
  | 'profile.updated';

export type AuditLog = {
  id: string;
  actorId: string;
  action: AuditAction;
  targetId?: string;
  message: string;
  createdAt: string;
};

export type InviteKey = {
  id: string;
  key: string;
  createdBy: string;
  createdAt: string;
  usedBy?: string;
  usedAt?: string;
};
