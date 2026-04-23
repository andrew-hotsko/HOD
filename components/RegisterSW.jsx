'use client';

import { useEffect } from 'react';

// Registers the service worker once after first paint. Only in production —
// dev-mode HMR and SW caching conflict in obvious and annoying ways.
export default function RegisterSW() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('serviceWorker' in navigator)) return;
    if (process.env.NODE_ENV !== 'production') return;
    const register = () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    };
    if (document.readyState === 'complete') register();
    else window.addEventListener('load', register, { once: true });
  }, []);
  return null;
}
