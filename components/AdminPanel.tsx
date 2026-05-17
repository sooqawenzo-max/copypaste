'use client';

import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ImagePlus, LogOut, Send, ShieldPlus, Trash2, Upload } from 'lucide-react';
import { DocFile, FileCategory, PublicUser, Role } from '@/lib/types';

type Props = {
  user: PublicUser;
  files: DocFile[];
  users: PublicUser[];
};

export function AdminPanel({ user, files, users }: Props) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<FileCategory>('lua');

  async function publish(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage('');

    try {
      const response = await fetch('/api/files', {
        method: 'POST',
        body: new FormData(formElement),
        cache: 'no-store'
      });

      const body = await response.json().catch(() => ({}));

      if (!response.ok) {
        setMessage(body.error || `Publish failed (${response.status})`);
        return;
      }

      formElement.reset();
      if (fileInput.current) fileInput.current.value = '';
      if (imageInput.current) imageInput.current.value = '';
      setCategory('lua');
      setMessage('File published');
      router.push(`/?category=${body.file.category}&file=${body.file.slug}`);
      router.refresh();
    } catch {
      setMessage('Network error while publishing. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteFile(id: string) {
    const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      setMessage(body.error || 'Delete failed');
      return;
    }
    router.refresh();
  }

  async function createUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage('');

    const form = new FormData(event.currentTarget);
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: form.get('username'),
        password: form.get('password'),
        role: form.get('role')
      })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'User creation failed');
      return;
    }

    event.currentTarget.reset();
    setMessage('Profile created');
    router.refresh();
  }

  async function updateRole(id: string, role: Role) {
    const response = await fetch(`/api/users/${id}/role`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Role update failed');
      return;
    }

    router.refresh();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  const isOwner = user.role === 'owner';

  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Publishing</p>
            <h1>Post Lua or config</h1>
          </div>
          <button className="ghost-action" onClick={logout} type="button">
            <LogOut size={16} />
            Logout
          </button>
        </div>
        <form className="stack-form" onSubmit={publish}>
          <label>
            Title
            <input name="title" placeholder="ragebot_helper" required />
          </label>

          <div className="segmented-field" aria-label="Post category">
            <label className={category === 'lua' ? 'segment active' : 'segment'}>
              <input
                type="radio"
                name="category"
                value="lua"
                checked={category === 'lua'}
                onChange={() => setCategory('lua')}
              />
              lua
            </label>
            <label className={category === 'config' ? 'segment active' : 'segment'}>
              <input
                type="radio"
                name="category"
                value="config"
                checked={category === 'config'}
                onChange={() => setCategory('config')}
              />
              config
            </label>
          </div>

          <label>
            Description
            <input name="description" placeholder="Short note about the Lua or config." />
          </label>

          <label>
            Paste content
            <textarea
              name="content"
              rows={12}
              spellCheck={false}
              placeholder={
                category === 'config'
                  ? 'paste config text here, or upload the config file below'
                  : 'local function main()\n  print("copypast")\nend'
              }
            />
          </label>

          <label className="file-box">
            <Upload size={18} />
            <span>Choose Lua/config file</span>
            <input ref={fileInput} type="file" name="file" />
          </label>

          {category === 'config' ? (
            <label className="file-box image-required">
              <ImagePlus size={18} />
              <span>Config screenshot required</span>
              <input ref={imageInput} type="file" name="image" accept="image/*" required />
            </label>
          ) : null}

          <button className="primary-action" disabled={busy} type="submit">
            <Send size={16} />
            {busy ? 'Publishing...' : 'Publish'}
          </button>
          {message ? <p className="form-message">{message}</p> : null}
        </form>
      </section>

      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Library</p>
            <h2>Posted files</h2>
          </div>
        </div>
        <div className="posted-list">
          {files.map((file) => (
            <div className="posted-row" key={file.id}>
              <div>
                <strong>{file.title}</strong>
                <span>
                  {file.category} · {Math.max(1, Math.round(file.size / 1024))} KB
                </span>
              </div>
              <div className="posted-actions">
                <Link className="mini-link" href={`/?category=${file.category}&file=${file.slug}`}>
                  Open
                </Link>
                <button
                  className="icon-danger"
                  onClick={() => deleteFile(file.id)}
                  type="button"
                  title="Delete"
                  aria-label={`Delete ${file.title}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {isOwner ? (
        <section className="admin-panel wide-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Owner controls</p>
              <h2>Profiles and admin rights</h2>
            </div>
          </div>
          <form className="profile-form" onSubmit={createUser}>
            <input name="username" placeholder="username" required />
            <input name="password" placeholder="password" required type="password" />
            <select name="role" defaultValue="admin">
              <option value="admin">admin</option>
              <option value="user">user</option>
            </select>
            <button className="primary-action compact" type="submit">
              <ShieldPlus size={16} />
              Create
            </button>
          </form>
          <div className="user-table">
            {users.map((entry) => (
              <div className="user-row" key={entry.id}>
                <div>
                  <strong>{entry.username}</strong>
                  <span>{entry.role}</span>
                </div>
                {entry.role === 'owner' ? (
                  <span className="owner-pill">locked owner</span>
                ) : (
                  <select
                    value={entry.role}
                    onChange={(event) => updateRole(entry.id, event.target.value as Role)}
                  >
                    <option value="admin">admin</option>
                    <option value="user">user</option>
                  </select>
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
