'use client';

import { useEffect, useState } from 'react';
import { V, HodLabel, HodButton } from './atoms';
import { loadCue, saveCue } from '@/lib/storage';

export default function MovementCueSheet({ movementName, onClose }) {
  const [cue, setCue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!movementName) return;
    const cached = loadCue(movementName);
    if (cached?.cue) {
      setCue(cached.cue);
      return;
    }
    setLoading(true);
    fetch('/api/cue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: movementName }),
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error('bad-response')))
      .then((data) => {
        if (!data?.cue) throw new Error('empty');
        saveCue(movementName, data.cue);
        setCue(data.cue);
      })
      .catch(() => setError('Could not load cue. Try again.'))
      .finally(() => setLoading(false));
  }, [movementName]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute', inset: 0, zIndex: 45,
        background: 'rgba(5, 6, 5, 0.92)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: V('iron-900'),
          borderTop: `1px solid ${V('phos-500')}`,
          padding: '20px 20px',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
        }}
      >
        <HodLabel style={{ color: V('phos-400'), marginBottom: 6 }}>· FORM CUE</HodLabel>
        <div className="hod-display" style={{
          fontSize: 26, color: V('bone'), letterSpacing: '-0.01em',
          marginBottom: 12, lineHeight: 1.1,
        }}>
          {movementName}
        </div>

        {loading && (
          <div className="hod-mono" style={{ fontSize: 11, color: V('bone-faint'), letterSpacing: '0.22em', padding: '8px 0' }}>
            LOADING FORM CUES
            <span className="hod-blink" style={{ marginLeft: 6 }}>█</span>
          </div>
        )}
        {error && (
          <div className="hod-mono" style={{ fontSize: 11, color: V('alert'), letterSpacing: '0.18em', padding: '8px 0' }}>
            {error}
          </div>
        )}
        {cue && (
          <div style={{
            fontFamily: 'var(--f-ui)', fontSize: 14, color: V('bone'),
            lineHeight: 1.55, whiteSpace: 'pre-wrap',
          }}>
            {cue}
          </div>
        )}

        <HodButton onClick={onClose} variant="ghost" size="md" full style={{ marginTop: 16 }}>
          GOT IT
        </HodButton>
      </div>
    </div>
  );
}
