'use client';

import { FormEvent, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Files,
  ImagePlus,
  KeyRound,
  LogOut,
  Pencil,
  Send,
  ShieldPlus,
  Trash2,
  Upload
} from 'lucide-react';
import { AuditLog, DocFile, FileCategory, InviteKey, Platform, PublicUser, Role } from '@/lib/types';

type Props = {
  user: PublicUser;
  files: DocFile[];
  users: PublicUser[];
  auditLogs: AuditLog[];
  inviteKeys: InviteKey[];
};

function sectionHref(file: DocFile) {
  const section = file.category === 'folder' ? 'folder' : 'docs';
  return `/?category=${section}&file=${file.slug}`;
}

function postedMeta(file: DocFile) {
  const kind =
    file.category === 'folder'
      ? `${file.attachments?.length || 0} files`
      : file.platform;
  return `${file.category} / ${kind} / ${new Date(file.updatedAt).toLocaleDateString('ru-RU')}`;
}

export function AdminPanel({ user, files, users, auditLogs, inviteKeys }: Props) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);
  const imageInput = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [category, setCategory] = useState<FileCategory>('lua');
  const [platform, setPlatform] = useState<Platform>('gs');
  const [editing, setEditing] = useState<DocFile | null>(null);

  const isOwner = user.role === 'owner';

  async function submitFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setBusy(true);
    setMessage('');

    try {
      const response = await fetch(editing ? `/api/files/${editing.id}` : '/api/files', {
        method: editing ? 'PATCH' : 'POST',
        body: new FormData(formElement),
        cache: 'no-store'
      });

      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        setMessage(body.error || `Save failed (${response.status})`);
        return;
      }

      formElement.reset();
      if (fileInput.current) fileInput.current.value = '';
      if (folderInput.current) folderInput.current.value = '';
      if (imageInput.current) imageInput.current.value = '';
      setEditing(null);
      setCategory('lua');
      setPlatform('gs');
      setMessage(editing ? 'File updated' : 'File published');
      router.push(sectionHref(body.file));
      router.refresh();
    } catch {
      setMessage('Network error while saving. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function deleteFile(id: string) {
    const response = await fetch(`/api/files/${id}`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Delete failed');
      return;
    }
    setMessage('File deleted');
    router.refresh();
  }

  function startEdit(file: DocFile) {
    setEditing(file);
    setCategory(file.category);
    setPlatform(file.platform || 'gs');
    window.requestAnimationFrame(() => formRef.current?.scrollIntoView({ behavior: 'smooth' }));
  }

  function cancelEdit() {
    setEditing(null);
    setCategory('lua');
    setPlatform('gs');
    formRef.current?.reset();
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

    setMessage('Role updated');
    router.refresh();
  }

  async function deleteUser(id: string) {
    const response = await fetch(`/api/users/${id}/role`, { method: 'DELETE' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'User delete failed');
      return;
    }
    setMessage('User deleted');
    router.refresh();
  }

  async function createInvite() {
    const response = await fetch('/api/invites', { method: 'POST' });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      setMessage(body.error || 'Invite creation failed');
      return;
    }
    setMessage(`Invite: ${body.invite.key}`);
    router.refresh();
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <div className="admin-grid">
      <section className="admin-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">{editing ? 'Editing' : 'Publishing'}</p>
            <h1>{editing ? editing.title : 'Post docs or folder'}</h1>
          </div>
          <button className="ghost-action" onClick={logout} type="button">
            <LogOut size={16} />
            Logout
          </button>
        </div>

        <form className="stack-form" key={editing?.id || 'new-post'} ref={formRef} onSubmit={submitFile}>
          <label>
            Title
            <input name="title" placeholder="ragebot_helper" defaultValue={editing?.title || ''} required />
          </label>

          <div className="segmented-field triple" aria-label="Post category">
            {(['lua', 'config', 'folder'] as FileCategory[]).map((entry) => (
              <label className={category === entry ? 'segment active' : 'segment'} key={entry}>
                <input
                  type="radio"
                  name="category"
                  value={entry}
                  checked={category === entry}
                  onChange={() => setCategory(entry)}
                />
                {entry}
              </label>
            ))}
          </div>

          <div className="segmented-field" aria-label="Platform">
            {(['gs', 'nl'] as Platform[]).map((entry) => (
              <label className={platform === entry ? `segment active platform-${entry}` : 'segment'} key={entry}>
                <input
                  type="radio"
                  name="platform"
                  value={entry}
                  checked={platform === entry}
                  onChange={() => setPlatform(entry)}
                />
                {entry}
              </label>
            ))}
          </div>

          <label>
            Tags
            <input name="tags" placeholder="rage, visuals, hvh" defaultValue={editing?.tags?.join(', ') || ''} />
          </label>

          <label>
            Paste content
            <textarea
              name="content"
              rows={12}
              spellCheck={false}
              disabled={category === 'folder'}
              placeholder={
                category === 'folder'
                  ? 'Folder uses the files below'
                  : editing
                    ? 'Paste new content only if you want to replace the file'
                    : 'local function main()\n  print("copypast")\nend'
              }
            />
          </label>

          <label className="file-box">
            <Upload size={18} />
            <span>Single Lua/config file</span>
            <input ref={fileInput} type="file" name="file" disabled={category === 'folder'} />
          </label>

          <label className="file-box">
            <Files size={18} />
            <span>Folder files, max 12</span>
            <input ref={folderInput} type="file" name="files" multiple disabled={category !== 'folder'} />
          </label>

          <label className="file-box image-required">
            <ImagePlus size={18} />
            <span>Screenshots, max 3</span>
            <input ref={imageInput} type="file" name="images" accept="image/*" multiple />
          </label>

          <button className="primary-action" disabled={busy} type="submit">
            <Send size={16} />
            {busy ? 'Saving...' : editing ? 'Save changes' : 'Publish'}
          </button>
          {editing ? (
            <button className="ghost-action" onClick={cancelEdit} type="button">
              Cancel edit
            </button>
          ) : null}
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
                <span>{postedMeta(file)}</span>
              </div>
              <div className="posted-actions">
                <button className="mini-link" onClick={() => startEdit(file)} type="button">
                  <Pencil size={14} />
                  Edit
                </button>
                <Link className="mini-link" href={sectionHref(file)}>
                  Open
                </Link>
                <button className="icon-danger" onClick={() => deleteFile(file.id)} type="button" aria-label={`Delete ${file.title}`}>
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
              <p className="eyebrow">Owner console</p>
              <h2>Moderation</h2>
            </div>
            <button className="primary-action compact" onClick={createInvite} type="button">
              <KeyRound size={16} />
              New invite
            </button>
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
          <div className="owner-console-grid">
            <div className="user-table">
              {users.map((entry) => (
                <div className="user-row" key={entry.id}>
                  <div>
                    <strong className={`role-name role-${entry.role}`}>{entry.forumNick}</strong>
                    <span>uid {entry.uid} / {entry.role}</span>
                  </div>
                  {entry.role === 'owner' ? (
                    <span className="owner-pill">locked owner</span>
                  ) : (
                    <div className="user-actions">
                      <select value={entry.role} onChange={(event) => updateRole(entry.id, event.target.value as Role)}>
                        <option value="admin">admin</option>
                        <option value="user">user</option>
                      </select>
                      <button className="icon-danger" onClick={() => deleteUser(entry.id)} type="button" aria-label={`Delete ${entry.username}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="audit-console">
              <h3>Audit</h3>
              {auditLogs.slice(0, 18).map((log) => (
                <div className="audit-row" key={log.id}>
                  <span>{new Date(log.createdAt).toLocaleString('ru-RU')}</span>
                  <strong>{log.action}</strong>
                  <p>{log.message}</p>
                </div>
              ))}
            </div>
            <div className="audit-console">
              <h3>Invites</h3>
              {inviteKeys.slice(0, 12).map((invite) => (
                <div className="audit-row" key={invite.id}>
                  <strong>{invite.key}</strong>
                  <p>{invite.usedBy ? 'used' : 'unused'}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
