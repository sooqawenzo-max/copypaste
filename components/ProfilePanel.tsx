'use client';

import { FormEvent, useRef, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Camera, MessageSquare, Save, Trash2 } from 'lucide-react';
import { PublicUser } from '@/lib/types';

type Props = {
  profile: PublicUser;
  currentUser: PublicUser | null;
  commentAuthors: Record<string, PublicUser>;
  publishCount: number;
};

export function ProfilePanel({
  profile,
  currentUser,
  commentAuthors,
  publishCount
}: Props) {
  const router = useRouter();
  const avatarRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');
  const canEdit = currentUser?.id === profile.id || currentUser?.role === 'owner';
  const canComment = currentUser?.role === 'owner' || currentUser?.role === 'admin';
  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const response = await fetch(`/api/profiles/${profile.uid}`, {
      method: 'PATCH',
      body: new FormData(formElement)
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? 'Profile saved' : body.error || 'Save failed');
    router.refresh();
  }

  async function addComment(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const response = await fetch(`/api/profiles/${profile.uid}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: form.get('text') })
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? 'Comment posted' : body.error || 'Comment failed');
    if (response.ok) formElement.reset();
    router.refresh();
  }

  async function deleteComment(commentId: string) {
    const response = await fetch(`/api/profiles/${profile.uid}/comments/${commentId}`, {
      method: 'DELETE'
    });
    const body = await response.json().catch(() => ({}));
    setMessage(response.ok ? 'Comment deleted' : body.error || 'Delete failed');
    router.refresh();
  }

  return (
    <div className="steam-profile">
      <section className="profile-hero">
        <div className="profile-avatar-wrap">
          {profile.avatar ? (
            <Image
              src={`/api/profiles/${profile.uid}/avatar`}
              alt=""
              width={132}
              height={132}
              unoptimized
              className="profile-avatar"
            />
          ) : (
            <div className="profile-avatar fallback">{profile.forumNick.slice(0, 1).toUpperCase()}</div>
          )}
        </div>
        <div>
          <p className="eyebrow">uid {profile.uid}</p>
          <h1 className={`role-name role-${profile.role}`}>{profile.forumNick}</h1>
          <p>{profile.bio || 'No profile text yet.'}</p>
          <div className="profile-meta-line">
            <span>{profile.role}</span>
            <span>registered {new Date(profile.createdAt).toLocaleDateString('ru-RU')}</span>
            <span>{profile.comments.length} comments</span>
            <span>{publishCount} uploads</span>
          </div>
        </div>
      </section>

      {canEdit ? (
        <section className="profile-section">
          <h2>Edit profile</h2>
          <form className="stack-form" onSubmit={saveProfile}>
            <input name="forumNick" defaultValue={profile.forumNick} placeholder="forum nick" />
            <textarea name="bio" defaultValue={profile.bio || ''} placeholder="profile text" rows={4} />
            <label className="file-box">
              <Camera size={18} />
              <span>Avatar</span>
              <input ref={avatarRef} type="file" name="avatar" accept="image/*" />
            </label>
            <button className="primary-action compact" type="submit">
              <Save size={16} />
              Save
            </button>
          </form>
        </section>
      ) : null}

      <section className="profile-section" id="comments">
        <h2>Comments</h2>
        {canComment ? (
          <form className="comment-form" onSubmit={addComment}>
            <input name="text" placeholder="Write a comment" />
            <button className="primary-action compact" type="submit">
              <MessageSquare size={16} />
              Post
            </button>
          </form>
        ) : null}
        <div className="comment-list">
          {profile.comments.map((comment) => {
            const author = commentAuthors[comment.authorId];
            return (
              <div className="comment-row" key={comment.id}>
                <strong className={`role-name role-${author?.role || 'user'}`}>
                  {author?.forumNick || 'unknown'}
                </strong>
                <span>{new Date(comment.createdAt).toLocaleString('ru-RU')}</span>
                {canComment ? (
                  <button
                    className="comment-delete"
                    onClick={() => deleteComment(comment.id)}
                    type="button"
                    aria-label="Delete comment"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
                <p>{comment.text}</p>
              </div>
            );
          })}
        </div>
        {message ? <p className="form-message">{message}</p> : null}
      </section>
    </div>
  );
}
