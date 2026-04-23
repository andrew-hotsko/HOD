'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { V, HodLabel, HodButton } from './atoms';
import { cueCountdown, cueRestComplete } from '@/lib/audio';
import { Quote } from './Quote';
import { randomQuote } from '@/lib/quotes';

export default function RestScreen({
  duration = 120,
  label = 'REST',
  headline = 'RECOVER.',
  nextLabel,
  nextDetail,
  onComplete,
}) {
  const endRef = useRef(Date.now() + duration * 1000);
  const doneRef = useRef(false);
  const [remaining, setRemaining] = useState(duration);
  const quote = useMemo(() => randomQuote('mid'), []);

  useEffect(() => {
    const tick = () => {
      const s = Math.max(0, Math.ceil((endRef.current - Date.now()) / 1000));
      setRemaining(s);
      if (s === 0 && !doneRef.current) {
        doneRef.current = true;
        cueRestComplete();
        onComplete(false);
      }
    };
    tick();
    const t = setInterval(tick, 250);
    return () => clearInterval(t);
  }, [onComplete]);

  useEffect(() => {
    if (remaining === 3 || remaining === 2 || remaining === 1) cueCountdown();
  }, [remaining]);

  const skip = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    onComplete(true);
  };

  const addTime = () => {
    endRef.current += 30000;
    setRemaining(r => r + 30);
  };

  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const urgent = remaining <= 10 && remaining > 0;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 55,
      background: 'rgba(5, 6, 5, 0.96)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
    }} className="hod-grid-bg">
      <div style={{ padding: '20px 20px 0' }}>
        <div className="hod-label" style={{ color: V('phos-400'), letterSpacing: '0.32em' }}>
          · {label}
        </div>
        <div className="hod-display" style={{
          fontSize: 52, lineHeight: 0.9, color: V('bone'),
          marginTop: 8, letterSpacing: '-0.02em',
        }}>
          {headline}
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: '0 20px',
      }}>
        <div className="hod-display hod-mono" style={{
          fontSize: 168, lineHeight: 0.85,
          color: urgent ? V('alert') : V('phos-400'),
          fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.04em',
          textShadow: urgent ? '0 0 40px rgba(230, 57, 70, 0.4)' : '0 0 40px var(--phos-glow)',
          transition: 'color 200ms ease',
        }}>
          {mm}:{ss}
        </div>

        {nextLabel && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <HodLabel style={{ marginBottom: 6 }}>UP NEXT</HodLabel>
            <div className="hod-display" style={{ fontSize: 26, color: V('bone'), letterSpacing: '-0.01em' }}>
              {nextLabel}
            </div>
            {nextDetail && (
              <div className="hod-mono" style={{ fontSize: 13, color: V('bone-dim'), marginTop: 4, letterSpacing: '0.1em' }}>
                {nextDetail}
              </div>
            )}
          </div>
        )}

        <Quote quote={quote} size="md" align="center" style={{ marginTop: 28, maxWidth: 340 }} />
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 10,
      }}>
        <HodButton onClick={addTime} variant="ghost" size="md" style={{ flex: 1 }}>+30s</HodButton>
        <HodButton onClick={skip} size="md" style={{ flex: 2 }}>SKIP REST</HodButton>
      </div>
    </div>
  );
}
