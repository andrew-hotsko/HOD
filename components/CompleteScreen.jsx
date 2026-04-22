'use client';

import { useState } from 'react';
import { V, HodLabel, HodButton, HodRule, HodStat, HodMark } from './atoms';

const RATINGS = [
  { key: 'easy',   label: 'EASY',   color: 'bone' },
  { key: 'solid',  label: 'SOLID',  color: 'phos-400' },
  { key: 'brutal', label: 'BRUTAL', color: 'alert' },
];

export default function CompleteScreen({ config, stats, onClose, onRate }) {
  const [rating, setRating] = useState(null);
  const pickRating = (key) => {
    setRating(key);
    onRate?.(key);
  };

  const format = config.workout.main.format;
  const isAMRAP = format === 'AMRAP';

  const elapsed = stats?.elapsed ?? 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const roundsDone = stats ? Math.max(0, (stats.round || 1) - 1) : 0;

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      overflow: 'auto',
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px' }}>
        <HodMark size="sm" showDate={false} />
      </div>

      <div style={{
        flex: 1, padding: '40px 20px',
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
      }}>
        <div className="hod-label" style={{ color: V('phos-400'), marginBottom: 12, letterSpacing: '0.28em' }}>
          · HOD COMPLETE
        </div>
        <div className="hod-display" style={{
          fontSize: 72, lineHeight: 0.85, color: V('bone'),
          letterSpacing: '-0.03em', fontWeight: 700,
        }}>
          DONE.
        </div>
        <div style={{
          fontFamily: 'var(--f-ui)', fontSize: 14, color: V('bone-dim'),
          marginTop: 16, maxWidth: 260,
        }}>
          That's the HOD. Log it, hydrate, eat a real meal.
        </div>

        {stats && (
          <>
            <HodRule ticks style={{ margin: '28px 0 16px' }} />

            {/* Headline stat: time on the clock */}
            <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
              <div style={{ flex: 1 }}>
                <HodLabel>TOTAL TIME</HodLabel>
                <div className="hod-display hod-mono" style={{
                  fontSize: 56, color: V('phos-400'), lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums', marginTop: 4,
                  letterSpacing: '-0.02em',
                  textShadow: '0 0 24px var(--phos-glow)',
                }}>
                  {mm}:{ss}
                </div>
              </div>
              {isAMRAP && (
                <div>
                  <HodLabel>ROUNDS</HodLabel>
                  <div className="hod-display hod-mono" style={{
                    fontSize: 56, color: V('bone'), lineHeight: 1,
                    fontVariantNumeric: 'tabular-nums', marginTop: 4,
                    letterSpacing: '-0.02em',
                  }}>
                    {roundsDone}
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        <HodRule ticks style={{ margin: '28px 0 20px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <HodStat label="FORMAT" value={config.workout.main.label} size="sm" />
          <HodStat label="STYLE" value={config.workout.style.label.toUpperCase()} size="sm" />
          <HodStat label="DURATION" value={config.duration} unit="MIN" size="sm" />
          <HodStat label="INTENSITY" value={config.workout.intensity.label.toUpperCase()} size="sm" accent />
        </div>

        <HodRule ticks style={{ margin: '28px 0 14px' }} />

        <HodLabel style={{ marginBottom: 10 }}>HOW'D IT GO?</HodLabel>
        <div style={{ display: 'flex', gap: 8 }}>
          {RATINGS.map(r => {
            const selected = rating === r.key;
            return (
              <button
                key={r.key}
                onClick={() => pickRating(r.key)}
                className="hod-mono"
                style={{
                  flex: 1, height: 48,
                  background: selected ? V(r.color) : 'transparent',
                  color: selected ? V('ink') : V(r.color),
                  border: `1px solid ${V(r.color)}`,
                  fontSize: 12, letterSpacing: '0.22em', fontWeight: 600,
                  transition: 'all 140ms ease',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}>
        <HodButton onClick={onClose} full size="lg">BACK TO TODAY</HodButton>
      </div>
    </div>
  );
}
