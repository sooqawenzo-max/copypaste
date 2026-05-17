'use client';

import { FormEvent, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MessageCircle, Send } from 'lucide-react';
import { FileComment, PublicUser } from '@/lib/types';

type Props = {
  fileId: string;
  comments: FileComment[];
  currentUser: PublicUser | null;
  authors: Record<string, PublicUser>;
};

function authorName(user?: PublicUser) {
  return user?.forumNick || user?.username || 'unknown';
}

function Avatar({ user }: { user?: PublicUser }) {
  if (!user) return <span className="avatar-fallback comment-avatar">?</span>;
  return user.avatar ? (
    <Image
      className="avatar-img comment-avatar"
      src={`/api/profiles/${user.uid}/avatar`}
      alt=""
      width={30}
      height={30}
    />
  ) : (
    <span className="avatar-fallback comment-avatar">
      {authorName(user).slice(0, 1).toUpperCase()}
    </span>
  );
}

export function PostComments({ fileId, comments, currentUser, authors }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage('');

    const form = new FormData(event.currentTarget);
    const response = await fetch(`/api/files/${fileId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: form.get('text') })
    });
    const body = await response.json().catch(() => ({}));

    setBusy(false);
    if (!response.ok) {
      setMessage(body.error || 'Comment failed');
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <section className="post-comments" id="comments">
      <h2>
        <MessageCircle size={22} />
        Comments
      </h2>

      <div className="post-comment-list">
        {comments.length ? (
          comments.map((comment) => {
            const author = authors[comment.authorId];
            return (
              <article className="post-comment" key={comment.id}>
                <Avatar user={author} />
                <div>
                  <div className="post-comment-head">
                    <Link
                      className={`role-name role-${author?.role || 'user'}`}
                      href={author ? `/u/${author.uid}` : '#'}
                    >
                      {authorName(author)}
                    </Link>
                    <time dateTime={comment.createdAt}>
                      {new Date(comment.createdAt).toLocaleString('ru-RU')}
                    </time>
                  </div>
                  <p>{comment.text}</p>
                </div>
              </article>
            );
          })
        ) : (
          <p className="comment-empty">No comments yet.</p>
        )}
      </div>

      {currentUser ? (
        <form className="post-comment-form" onSubmit={submit}>
          <input name="text" placeholder="Write a comment" maxLength={1200} />
          <button className="primary-action compact" type="submit" disabled={busy}>
            <Send size={15} />
            Post
          </button>
        </form>
      ) : (
        <Link className="mini-link" href="/login">
          Login to comment
        </Link>
      )}
      {message ? <p className="form-message danger-text">{message}</p> : null}
    </section>
  );
}
