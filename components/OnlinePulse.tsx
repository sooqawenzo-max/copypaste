'use client';

import { useEffect } from 'react';

export function OnlinePulse({ enabled }: { enabled: boolean }) {
  useEffect(() => {
    if (!enabled) return;

    const touch = () => {
      fetch('/api/auth/seen', {
        method: 'POST',
        cache: 'no-store',
        keepalive: true
      }).catch(() => undefined);
    };

    touch();
    const timer = window.setInterval(touch, 60_000);
    return () => window.clearInterval(timer);
  }, [enabled]);

  return null;
}
