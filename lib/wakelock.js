'use client';

import { useEffect, useRef } from 'react';

// Screen Wake Lock API wrapper.
// Browser auto-releases the lock whenever the tab is hidden, so we listen for
// visibility changes and re-acquire when the user returns.
export function useWakeLock(active = true) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!active) return;
    if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) return;

    let cancelled = false;

    const acquire = async () => {
      try {
        const lock = await navigator.wakeLock.request('screen');
        if (cancelled) {
          lock.release().catch(() => {});
          return;
        }
        sentinelRef.current = lock;
        lock.addEventListener('release', () => {
          if (sentinelRef.current === lock) sentinelRef.current = null;
        });
      } catch {
        // Permission denied, battery saver, etc — silent fail
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === 'visible' && !sentinelRef.current) {
        acquire();
      }
    };

    acquire();
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisibility);
      const lock = sentinelRef.current;
      sentinelRef.current = null;
      if (lock) lock.release().catch(() => {});
    };
  }, [active]);
}
