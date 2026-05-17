export type Role = 'owner' | 'admin' | 'user';
export type StorageKind = 'blob' | 'local';
export type FileCategory = 'lua' | 'config';

export type User = {
  id: string;
  username: string;
  passwordHash: string;
  role: Role;
  createdAt: string;
};

export type DocFile = {
  id: string;
  slug: string;
  title: string;
  category: FileCategory;
  description: string;
  originalName: string;
  mime: string;
  size: number;
  storage: StorageKind;
  blobPath: string;
  imageName?: string;
  imageMime?: string;
  imageStorage?: StorageKind;
  imagePath?: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
};

export type Database = {
  version: 1;
  users: User[];
  files: DocFile[];
};

export type PublicUser = Omit<User, 'passwordHash'>;
