'use client';

import Image from 'next/image';
import { useState } from 'react';
import { X } from 'lucide-react';
import { StoredAsset } from '@/lib/types';

type Props = {
  fileId: string;
  title: string;
  screenshots: StoredAsset[];
};

export function ScreenshotGallery({ fileId, title, screenshots }: Props) {
  const [active, setActive] = useState<StoredAsset | null>(null);

  if (!screenshots.length) return null;

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
            <Image
              src={`/api/files/${fileId}/image?shot=${shot.id}`}
              alt={`${title} screenshot ${index + 1}`}
              width={980}
              height={560}
              className="config-image"
            />
          </button>
        ))}
      </div>
      {active ? (
        <div className="image-modal" role="dialog" aria-modal="true">
          <button
            className="modal-close"
            onClick={() => setActive(null)}
            aria-label="Close screenshot"
            type="button"
          >
            <X size={20} />
          </button>
          <Image
            src={`/api/files/${fileId}/image?shot=${active.id}`}
            alt={`${title} full screenshot`}
            width={1600}
            height={920}
            className="modal-image"
          />
        </div>
      ) : null}
    </>
  );
}
