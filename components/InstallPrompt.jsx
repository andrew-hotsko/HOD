'use client';

import { useEffect, useState } from 'react';
import { V, HodLabel } from './atoms';

const DISMISS_KEY = 'hod.installDismissed';

export default function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [dismissed, setDismissed] = useState(true);
  const [showIOSHelp, setShowIOSHelp] = useState(false);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === '1');
    } catch {
      setDismissed(false);
    }

    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const iOS = /iPad|iPhone|iPod/.test(ua) && !/MSStream/.test(ua);
    setIsIOS(iOS);

    const standalone = typeof window !== 'undefined' && (
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true
    );
    setIsStandalone(standalone);

    const onBIP = (e) => {
      e.preventDefault();
      setDeferred(e);
    };
    window.addEventListener('beforeinstallprompt', onBIP);
    return () => window.removeEventListener('beforeinstallprompt', onBIP);
  }, []);

  const install = async () => {
    if (isIOS) {
      setShowIOSHelp(true);
      return;
    }
    if (!deferred) return;
    deferred.prompt();
    try {
      const { outcome } = await deferred.userChoice;
      if (outcome === 'accepted') setDeferred(null);
    } catch {}
  };

  const dismiss = () => {
    try { localStorage.setItem(DISMISS_KEY, '1'); } catch {}
    setDismissed(true);
  };

  if (isStandalone || dismissed) return null;
  if (!deferred && !isIOS) return null;

  if (showIOSHelp) {
    return (
      <div
        onClick={() => setShowIOSHelp(false)}
        style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(5, 6, 5, 0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            background: V('iron-900'),
            borderTop: `1px solid ${V('phos-500')}`,
            padding: '20px 20px',
            paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
            width: '100%', maxWidth: 402,
          }}
        >
          <HodLabel style={{ color: V('phos-400'), marginBottom: 8 }}>ADD TO HOME SCREEN</HodLabel>
          <div className="hod-display" style={{ fontSize: 22, color: V('bone'), letterSpacing: '-0.01em', marginBottom: 14 }}>
            INSTALL HOD ON iOS.
          </div>
          <ol style={{
            fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-dim'),
            paddingLeft: 18, lineHeight: 1.6, margin: 0,
          }}>
            <li>Tap the <strong style={{ color: V('bone') }}>Share</strong> icon in Safari.</li>
            <li>Scroll and tap <strong style={{ color: V('bone') }}>Add to Home Screen</strong>.</li>
            <li>Tap <strong style={{ color: V('bone') }}>Add</strong>.</li>
          </ol>
          <button
            onClick={dismiss}
            className="hod-mono"
            style={{
              marginTop: 16, width: '100%', padding: '12px 0',
              fontSize: 11, color: V('bone-faint'), letterSpacing: '0.22em',
              border: `1px solid ${V('iron-700')}`,
            }}
          >
            DON'T SHOW AGAIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute', left: 0, right: 0, bottom: 'max(100px, calc(env(safe-area-inset-bottom) + 100px))',
      display: 'flex', justifyContent: 'center', padding: '0 16px',
      zIndex: 30, pointerEvents: 'none',
    }}>
      <div style={{
        pointerEvents: 'auto',
        background: V('iron-900'),
        border: `1px solid ${V('phos-500')}`,
        padding: '10px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
        boxShadow: '0 0 24px -4px var(--phos-glow)',
        maxWidth: 370, width: '100%',
      }}>
        <div style={{
          width: 32, height: 32, flexShrink: 0,
          background: V('phos-500'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="hod-display" style={{ fontSize: 14, color: V('ink'), fontWeight: 700 }}>H</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hod-mono" style={{ fontSize: 9, color: V('phos-400'), letterSpacing: '0.18em' }}>
            INSTALL
          </div>
          <div className="hod-display" style={{ fontSize: 13, color: V('bone'), letterSpacing: '-0.01em' }}>
            Add HOD to home screen
          </div>
        </div>
        <button
          onClick={install}
          className="hod-mono"
          style={{
            fontSize: 10, letterSpacing: '0.22em', fontWeight: 600,
            background: V('phos-500'), color: V('ink'),
            padding: '8px 12px', border: 'none',
          }}
        >
          ADD
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          style={{
            width: 28, height: 28,
            color: V('bone-faint'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="square" />
          </svg>
        </button>
      </div>
    </div>
  );
}
