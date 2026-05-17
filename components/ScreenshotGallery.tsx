'use client';

import { MouseEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { StoredAsset } from '@/lib/types';

type Props = {
  fileId: string;
  title: string;
  screenshots: StoredAsset[];
};

function imageUrl(fileId: string, shot: StoredAsset) {
  return shot.id.endsWith('-legacy-shot')
    ? `/api/files/${fileId}/image`
    : `/api/files/${fileId}/image?shot=${shot.id}`;
}

export function ScreenshotGallery({ fileId, title, screenshots }: Props) {
  const [active, setActive] = useState<StoredAsset | null>(null);

  useEffect(() => {
    if (!active) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setActive(null);
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', closeOnEscape);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', closeOnEscape);
    };
  }, [active]);

  function keepModalOpen(event: MouseEvent<HTMLImageElement>) {
    event.stopPropagation();
  }

  if (!screenshots.length) return null;

  const modalRoot = typeof document === 'undefined' ? null : document.body;
  const modal = active && modalRoot
    ? createPortal(
        <div
          className="image-modal"
          role="dialog"
          aria-modal="true"
          onClick={() => setActive(null)}
        >
          <button
            className="modal-close"
            onClick={() => setActive(null)}
            aria-label="Close screenshot"
            type="button"
          >
            <X size={20} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(fileId, active)}
            alt=""
            aria-hidden="true"
            className="modal-blur-bg"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl(fileId, active)}
            alt={`${title} full screenshot`}
            className="modal-image"
            onClick={keepModalOpen}
          />
        </div>,
        modalRoot
      )
    : null;

  return (
    <>
      <div className="screenshot-grid">
        {screenshots.map((shot, index) => (
          <button
            className="screenshot-thumb"
            key={shot.id}
            onClick={() => setActive(shot)}
            type="button"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(fileId, shot)}
              alt=""
              aria-hidden="true"
              className="screenshot-blur-bg"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl(fileId, shot)}
              alt={`${title} screenshot ${index + 1}`}
              className="config-image"
            />
          </button>
        ))}
      </div>
      {modal}
    </>
  );
}
