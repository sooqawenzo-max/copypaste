import Image from 'next/image';
import Link from 'next/link';
import { ChevronDown, ChevronRight, Lock, PanelLeftClose } from 'lucide-react';
import { Breadcrumbs, CodeFrame, TopNav } from '@/components/Shell';
import { DotGridBackground } from '@/components/DotGridBackground';
import { getCurrentUser } from '@/lib/auth';
import { loadDatabase } from '@/lib/db';
import { readStoredFileText } from '@/lib/files';
import { FileCategory } from '@/lib/types';

export const dynamic = 'force-dynamic';

type Props = {
  searchParams: Promise<{
    file?: string;
    category?: string;
  }>;
};

const categories: FileCategory[] = ['lua', 'config'];

function normalizeCategory(category?: string): FileCategory {
  return category === 'config' ? 'config' : 'lua';
}

export default async function Home({ searchParams }: Props) {
  const query = await searchParams;
  const selectedCategory = normalizeCategory(query.category);
  const [db, user] = await Promise.all([loadDatabase(), getCurrentUser()]);
  const files = db.files.sort((a, b) => a.title.localeCompare(b.title));
  const byCategory = categories.reduce<Record<FileCategory, typeof files>>(
    (acc, category) => {
      acc[category] = files.filter((file) => file.category === category);
      return acc;
    },
    { lua: [], config: [] }
  );

  const current =
    files.find((file) => file.slug === query.file) ||
    byCategory[selectedCategory][0] ||
    files[0];
  const content = current && user ? await readStoredFileText(current) : '';
  const locked = !user;

  return (
    <>
      <TopNav user={user} />
      <div className="docs-shell">
        <DotGridBackground />
        <aside className="sidebar">
          <nav className="menu">
            {categories.map((category) => (
              <div className="menu-category open" key={category}>
                <Link className="menu-title menu-title-link" href={`/?category=${category}`}>
                  <span>{category}</span>
                  {category === selectedCategory ? (
                    <ChevronDown className="menu-arrow arrow-open" size={19} />
                  ) : (
                    <ChevronRight className="menu-arrow arrow-closed" size={19} />
                  )}
                </Link>
                {byCategory[category].length ? (
                  byCategory[category].map((file) => (
                    <Link
                      className={`menu-link ${current?.id === file.id ? 'active' : ''}`}
                      href={`/?category=${category}&file=${file.slug}`}
                      key={file.id}
                    >
                      {file.title}
                    </Link>
                  ))
                ) : (
                  <Link className="menu-link ghost" href="/admin">
                    Add {category}
                  </Link>
                )}
              </div>
            ))}
          </nav>
          <Link className="collapse-control" href="/admin" aria-label="Open admin panel">
            <PanelLeftClose size={18} />
          </Link>
        </aside>

        <main className="doc-main">
          <article className="doc-article">
            {current ? (
              <>
                <Breadcrumbs current={current.title} category={current.category} />
                <div className="title-row">
                  <div>
                    <p className="eyebrow">{current.category}</p>
                    <h1>{current.title}</h1>
                  </div>
                  {locked ? (
                    <Link className="unlock-chip" href="/login">
                      <Lock size={15} />
                      unlock
                    </Link>
                  ) : null}
                </div>

                {current.category === 'config' && current.imagePath ? (
                  <section id="preview" className="config-preview-section">
                    <h2>Preview</h2>
                    <div className="config-preview">
                      <Image
                        src={`/api/files/${current.id}/image`}
                        alt={`${current.title} config screenshot`}
                        width={1100}
                        height={620}
                        className="config-image"
                      />
                    </div>
                  </section>
                ) : null}

                <section id="description">
                  <h2>Description</h2>
                  <p>
                    {current.description ||
                      `Posted GameSense ${current.category} ready to save and use.`}
                  </p>
                </section>

                <section id="example">
                  <h2>{current.category === 'config' ? 'Config' : 'Lua'}</h2>
                  <CodeFrame
                    content={content}
                    locked={locked}
                    downloadUrl={user ? `/api/files/${current.id}/content` : undefined}
                    filename={current.originalName}
                  />
                  <div className="doc-actions">
                    {user ? (
                      <a href={`/api/files/${current.id}/content`} className="download-link">
                        Open raw file
                      </a>
                    ) : (
                      <Link href="/login" className="download-link">
                        Login to open raw file
                      </Link>
                    )}
                  </div>
                </section>

                <section id="arguments">
                  <h2>Properties</h2>
                  <div className="property-grid">
                    <span>Type</span>
                    <strong>{current.category}</strong>
                    <span>Filename</span>
                    <strong>{current.originalName}</strong>
                    <span>Size</span>
                    <strong>{Math.max(1, Math.round(current.size / 1024))} KB</strong>
                    <span>Storage</span>
                    <strong>{current.storage === 'blob' ? 'Vercel Blob' : 'Local dev'}</strong>
                    {current.imageName ? (
                      <>
                        <span>Screenshot</span>
                        <strong>{current.imageName}</strong>
                      </>
                    ) : null}
                  </div>
                </section>
              </>
            ) : (
              <div className="empty-state">
                <h1>lua</h1>
                <p>Login as admin and publish your first Lua or config.</p>
              </div>
            )}
          </article>
        </main>

        <aside className="toc">
          {current?.category === 'config' && current.imagePath ? (
            <a href="#preview">Preview</a>
          ) : null}
          <a href="#description">Description</a>
          <a href="#example">{current?.category === 'config' ? 'Config' : 'Lua'}</a>
          <a href="#arguments">Properties</a>
          <Link href="/admin">Admin</Link>
        </aside>
      </div>
    </>
  );
}
