import Link from 'next/link';
import Image from 'next/image';
import {
  BarChart3,
  FileCode2,
  Image as ImageIcon,
  Lock,
  MessageSquare,
  Sparkles,
  TrendingUp,
  Users
} from 'lucide-react';
import { Breadcrumbs, CodeFrame, TopNav } from '@/components/Shell';
import { DotGridBackground } from '@/components/DotGridBackground';
import { PostComments } from '@/components/PostComments';
import { ScreenshotGallery } from '@/components/ScreenshotGallery';
import { getCurrentUser } from '@/lib/auth';
import { loadDatabase } from '@/lib/db';
import { readStoredFileText } from '@/lib/files';
import { DocFile, FileCategory, PublicUser } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    file?: string;
    category?: string;
    q?: string;
  }>;
};

function normalizeCategory(category?: string): FileCategory {
  return category === 'config' ? 'config' : 'lua';
}

function categoryLabel(category: FileCategory) {
  return category === 'config' ? 'Config' : 'Lua';
}

function categorySummary(category: FileCategory) {
  return category === 'config'
    ? 'Configs with required previews, tags and platform filters.'
    : 'GameSense Lua posts with previews, authors and protected code.';
}

function isOnline(user: PublicUser) {
  if (!user.lastSeenAt) return false;
  return Date.now() - new Date(user.lastSeenAt).getTime() < 5 * 60 * 1000;
}

function roleClass(role: string) {
  return `role-name role-${role}`;
}

function authorLine(author?: PublicUser) {
  if (!author) return 'unknown';
  return author.forumNick || author.username;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function fileUpdatedAt(file: DocFile) {
  return new Date(file.updatedAt || file.createdAt).getTime();
}

function matchFile(file: DocFile, query: string) {
  if (!query) return true;
  const q = query.toLowerCase();
  return (
    file.title.toLowerCase().includes(q) ||
    file.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
    file.platform.toLowerCase().includes(q)
  );
}

function matchUser(user: PublicUser, query: string) {
  if (!query) return false;
  const q = query.toLowerCase();
  return (
    user.username.toLowerCase().includes(q) ||
    user.forumNick.toLowerCase().includes(q) ||
    String(user.uid).includes(q)
  );
}

function Avatar({ user, size = 34 }: { user?: PublicUser; size?: number }) {
  if (!user) return <span className="avatar-fallback" style={{ width: size, height: size }}>?</span>;
  return user.avatar ? (
    <Image
      className="avatar-img"
      src={`/api/profiles/${user.uid}/avatar`}
      alt=""
      width={size}
      height={size}
      style={{ width: size, height: size }}
    />
  ) : (
    <span className="avatar-fallback" style={{ width: size, height: size }}>
      {(user.forumNick || user.username).slice(0, 1).toUpperCase()}
    </span>
  );
}

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  const search = (query.q || '').trim();
  const [db, user] = await Promise.all([loadDatabase(), getCurrentUser()]);
  const users = db.users.map(({ passwordHash: _passwordHash, ...entry }) => entry);
  const authorMap = new Map(users.map((entry) => [entry.id, entry]));
  const files = db.files.sort((a, b) => a.title.localeCompare(b.title));
  const current = files.find((file) => file.slug === query.file);
  const selectedCategory = current?.category || normalizeCategory(query.category);
  const profileResults = users.filter((entry) => matchUser(entry, search)).slice(0, 6);
  const trendingFiles = [...files]
    .sort((a, b) => fileUpdatedAt(b) - fileUpdatedAt(a))
    .slice(0, 5);
  const latestMember = [...users].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
  const content = current && user ? await readStoredFileText(current) : '';
  const locked = !user;
  const onlineUsers = users
    .filter((entry) => isOnline(entry) || entry.id === user?.id)
    .slice(0, 8);
  const visibleFiles = files.filter(
    (file) => file.category === selectedCategory && matchFile(file, search)
  );
  const screenshotCount = visibleFiles.reduce(
    (count, file) => count + (file.screenshots?.length || 0),
    0
  );

  const renderForumBlock = (category: FileCategory) => {
    const forumFiles = files
      .filter((file) => file.category === category && matchFile(file, search))
      .sort((a, b) => fileUpdatedAt(b) - fileUpdatedAt(a));

    return (
      <div className="forum-block" id={category} key={category}>
        <div className="forum-block-header">
          <Link href={`/#${category}`}>{categoryLabel(category)}</Link>
          <span>{categorySummary(category)}</span>
        </div>

        <div className="forum-block-body">
          {forumFiles.length ? (
            forumFiles.map((file) => {
              const author = authorMap.get(file.authorId);

              return (
                <Link
                  className="forum-node"
                  href={`/?category=${file.category}&file=${file.slug}${search ? `&q=${encodeURIComponent(search)}` : ''}`}
                  key={file.id}
                >
                  <span className="forum-node-icon" aria-hidden="true">
                    {file.category === 'config' ? (
                      <ImageIcon size={19} />
                    ) : (
                      <FileCode2 size={19} />
                    )}
                  </span>
                  <span className="forum-node-main">
                    <strong>{file.title}</strong>
                    <span className="forum-node-meta">
                      <span className={`platform-pill platform-${file.platform}`}>
                        {file.platform}
                      </span>
                      {file.tags?.slice(0, 4).map((tag) => (
                        <em key={tag}>#{tag}</em>
                      ))}
                    </span>
                  </span>
                  <span className="forum-node-stats">
                    <span>
                      <b>{formatFileSize(file.size)}</b>
                      Size
                    </span>
                    <span>
                      <b>{file.screenshots?.length || 0}</b>
                      Preview
                    </span>
                  </span>
                  <span className="forum-node-extra">
                    <Avatar user={author} size={34} />
                    <span>
                      <strong>{authorLine(author)}</strong>
                      <time dateTime={file.updatedAt}>
                        {new Date(file.updatedAt).toLocaleDateString('ru-RU')}
                      </time>
                    </span>
                  </span>
                </Link>
              );
            })
          ) : (
            <div className="forum-empty">
              No posts found in {categoryLabel(category)}.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <TopNav user={user} />
      <div className="docs-shell">
        <DotGridBackground />
        <main className="doc-main">
          <article className="doc-article">
            {!current ? (
              <section className="forum-overview">
                <div className="forum-heading">
                  <div>
                    <p className="eyebrow">private gamesense forum</p>
                    <h1>
                      <span>copy</span><span>past</span> Docs
                    </h1>
                  </div>
                  <div className="forum-heading-actions">
                    <Link
                      className={selectedCategory === 'lua' ? 'primary-action compact' : 'ghost-action'}
                      href="/?category=lua"
                    >
                      Lua
                    </Link>
                    <Link
                      className={selectedCategory === 'config' ? 'primary-action compact' : 'ghost-action'}
                      href="/?category=config"
                    >
                      Config
                    </Link>
                    <Link className="ghost-action" href="/admin">
                      Publish
                    </Link>
                  </div>
                </div>

                {renderForumBlock(selectedCategory)}

                {profileResults.length ? (
                  <div className="forum-block">
                    <div className="forum-block-header">
                      <span>Profiles</span>
                      <span>Matches by username, forum nick or UID.</span>
                    </div>
                    <div className="forum-block-body">
                      {profileResults.map((profile) => (
                        <Link className="forum-node compact-node" href={`/u/${profile.uid}`} key={profile.id}>
                          <span className="forum-node-icon" aria-hidden="true">
                            <Users size={18} />
                          </span>
                          <span className="forum-node-main">
                            <strong className={roleClass(profile.role)}>{profile.forumNick}</strong>
                            <span className="forum-node-meta">UID {profile.uid}</span>
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="forum-quick-stats">
                  <span>
                    <MessageSquare size={17} />
                    {visibleFiles.length} posts
                  </span>
                  <span>
                    <ImageIcon size={17} />
                    {screenshotCount} previews
                  </span>
                  <span>
                    <Users size={17} />
                    {users.length} members
                  </span>
                </div>
              </section>
            ) : (
              <>
                <Breadcrumbs current={current.title} category={current.category} />
                <div className="title-row">
                  <div>
                    <div className="title-meta">
                      <span className={`platform-pill platform-${current.platform}`}>
                        {current.platform}
                      </span>
                      <span>{current.category}</span>
                      {current.tags?.slice(0, 4).map((tag) => (
                        <Link href={`/?category=${current.category}&q=${encodeURIComponent(tag)}`} key={tag}>
                          #{tag}
                        </Link>
                      ))}
                    </div>
                    <h1>{current.title}</h1>
                  </div>
                  {locked ? (
                    <Link className="unlock-chip" href="/login">
                      <Lock size={15} />
                      unlock
                    </Link>
                  ) : null}
                </div>

                {current.screenshots?.length ? (
                  <section id="preview" className="config-preview-section">
                    <h2>
                      <Sparkles size={22} />
                      Preview
                    </h2>
                    <ScreenshotGallery
                      fileId={current.id}
                      title={current.title}
                      screenshots={current.screenshots}
                    />
                  </section>
                ) : null}

                <section id="example">
                  <h2>{current.category === 'config' ? 'Config' : 'Lua'}</h2>
                  <CodeFrame
                    content={content}
                    locked={locked}
                    downloadUrl={user ? `/api/files/${current.id}/content` : undefined}
                    filename={current.originalName}
                  />
                </section>

                <section id="arguments">
                  <h2>Properties</h2>
                  <div className="property-grid">
                    <span>Author</span>
                    <strong>
                      <Link className="author-property" href={`/u/${authorMap.get(current.authorId)?.uid || 1}`}>
                        <Avatar user={authorMap.get(current.authorId)} />
                        <span className={roleClass(authorMap.get(current.authorId)?.role || 'user')}>
                          {authorLine(authorMap.get(current.authorId))}
                        </span>
                      </Link>
                    </strong>
                    <span>Forum nick</span>
                    <strong>{authorLine(authorMap.get(current.authorId))}</strong>
                    <span>Published</span>
                    <strong>{new Date(current.createdAt).toLocaleString('ru-RU')}</strong>
                    <span>Updated</span>
                    <strong>{new Date(current.updatedAt).toLocaleString('ru-RU')}</strong>
                    <span>Size</span>
                    <strong>{Math.max(1, Math.round(current.size / 1024))} KB</strong>
                  </div>
                </section>

                <PostComments
                  fileId={current.id}
                  comments={current.comments || []}
                  currentUser={user}
                  authors={Object.fromEntries(users.map((entry) => [entry.id, entry]))}
                />
              </>
            )}
          </article>
        </main>

        <aside className="toc">
          {current?.screenshots?.length ? <a href="#preview">Preview</a> : null}
          {current ? <a href="#example">{current.category === 'config' ? 'Config' : 'Lua'}</a> : null}
          {current ? <a href="#arguments">Properties</a> : null}
          {current ? <a href="#comments">Comments</a> : null}
          {!current ? (
            <>
              <div className="forum-widget">
                <h3>
                  <Users size={16} />
                  Members online
                </h3>
                <div className="widget-online-list">
                  {onlineUsers.length ? (
                    onlineUsers.map((entry) => (
                      <Link href={`/u/${entry.uid}`} key={entry.id}>
                        <Avatar user={entry} size={24} />
                        <span className={roleClass(entry.role)}>{entry.forumNick}</span>
                      </Link>
                    ))
                  ) : (
                    <span className="widget-muted">quiet</span>
                  )}
                </div>
              </div>
              <div className="forum-widget">
                <h3>
                  <TrendingUp size={16} />
                  Trending content
                </h3>
                {trendingFiles.map((file) => (
                  <Link href={`/?category=${file.category}&file=${file.slug}`} key={file.id}>
                    <span>{file.title}</span>
                  </Link>
                ))}
              </div>
              <div className="forum-widget">
                <h3>
                  <BarChart3 size={16} />
                  Forum statistics
                </h3>
                <dl className="forum-stat-list">
                  <dt>Lua</dt>
                  <dd>{files.filter((file) => file.category === 'lua').length}</dd>
                  <dt>Config</dt>
                  <dd>{files.filter((file) => file.category === 'config').length}</dd>
                  <dt>Members</dt>
                  <dd>{users.length}</dd>
                  <dt>Latest member</dt>
                  <dd>{latestMember ? authorLine(latestMember) : 'none'}</dd>
                </dl>
              </div>
            </>
          ) : null}
          {current ? (
            <div className="toc-online">
              <span>Online</span>
              {onlineUsers.map((entry) => (
                <Link href={`/u/${entry.uid}`} key={entry.id}>
                  <Avatar user={entry} size={24} />
                  <span className={roleClass(entry.role)}>{entry.forumNick}</span>
                </Link>
              ))}
            </div>
          ) : null}
        </aside>
      </div>
    </>
  );
}
