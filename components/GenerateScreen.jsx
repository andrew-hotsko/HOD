'use client';

import { useState, useEffect } from 'react';
import { V, HodLabel, HodButton, HodRule, HodMark } from './atoms';
import { INTENSITIES, STYLES } from '@/lib/generator';

export default function GenerateScreen({ config, onReady }) {
  // Phases: 0-2 = stamp fields locking, 3 = print workout, 4 = all printed (waiting on user)
  const [phase, setPhase] = useState(0);
  const [printedLines, setPrintedLines] = useState(0);

  const { intensity, style, duration } = config;
  const intenseLabel = INTENSITIES.find(i => i.key === intensity)?.label.toUpperCase() || intensity;
  const styleLabel   = STYLES[style]?.label.toUpperCase() || style;

  const fields = [
    { label: 'INTENSITY', value: intenseLabel },
    { label: 'STYLE',     value: styleLabel },
    { label: 'DURATION',  value: `${duration} MIN` },
  ];

  // Stamp the three fields in sequence
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 280),
      setTimeout(() => setPhase(2), 560),
      setTimeout(() => setPhase(3), 900),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  // Once in phase 3, print workout lines one by one — then STOP.
  // User controls when to advance to Live by tapping READY · START.
  useEffect(() => {
    if (phase < 3) return;
    const workout = config.workout;
    if (!workout) return;
    const total = workout.main.items.length;
    if (printedLines >= total) {
      setPhase(4);
      return;
    }
    const t = setTimeout(() => setPrintedLines(n => n + 1), 180);
    return () => clearTimeout(t);
  }, [phase, printedLines, config.workout]);

  const workout = config.workout;
  const ready = phase >= 4;

  return (
    <div style={{
      flex: 1,
      background: V('ink'),
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      overflow: 'hidden',
    }} className="hod-grid-bg">

      <div style={{ padding: '12px 20px' }}>
        <HodMark size="sm" showDate={false} />
      </div>

      {/* LOCKING FIELDS */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="hod-label" style={{ color: V('phos-400'), marginBottom: 12 }}>
          {ready ? '· BRIEFING' : '· GENERATING HOD'}
          {!ready && <span className="hod-blink" style={{ marginLeft: 6, color: V('phos-500') }}>█</span>}
        </div>

        {fields.map((f, i) => (
          <StampField key={f.label} label={f.label} value={f.value} locked={phase > i} />
        ))}
      </div>

      <HodRule ticks style={{ margin: '20px 20px 12px' }} />

      {/* WORKOUT PRINTOUT — scrollable so long workouts don't clip */}
      <div
        className="hod-no-scrollbar"
        style={{ padding: '0 20px', flex: 1, overflowY: 'auto', minHeight: 0 }}
      >
        <div style={{
          opacity: phase >= 3 ? 1 : 0.25,
          transition: 'opacity 300ms ease',
          paddingBottom: 16,
        }}>
          {phase >= 3 && !workout && (
            <div className="hod-label" style={{ color: V('phos-400') }}>
              ANALYZING
              <span className="hod-blink" style={{ marginLeft: 6 }}>█</span>
            </div>
          )}

          {phase >= 3 && workout && (
            <>
              <HodLabel style={{ color: V('phos-400') }}>{workout.main.label}</HodLabel>
              <div className="hod-display" style={{
                fontSize: 30, color: V('bone'), marginTop: 6,
                letterSpacing: '-0.01em', lineHeight: 1,
              }}>
                {workout.main.headline}
              </div>
              {workout.main.description && (
                <div style={{
                  fontFamily: 'var(--f-ui)', fontSize: 13,
                  color: V('bone-dim'), marginTop: 6,
                }}>
                  {workout.main.description}
                </div>
              )}

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {workout.main.items.map((item, i) => (
                  <div
                    key={i}
                    style={{
                      opacity: i < printedLines ? 1 : 0,
                      transform: i < printedLines ? 'translateY(0)' : 'translateY(4px)',
                      transition: 'all 220ms ease',
                      display: 'flex', alignItems: 'baseline', gap: 12,
                    }}
                  >
                    <span className="hod-mono" style={{ fontSize: 10, color: V('iron-500'), letterSpacing: '0.1em' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span className="hod-display" style={{ fontSize: 16, color: V('bone'), flex: 1 }}>
                      {item.name}
                    </span>
                    <span className="hod-mono" style={{ fontSize: 12, color: V('bone-dim') }}>
                      {item.schemeReps ? item.schemeReps.join('-') :
                       item.reps ? `${item.reps} ${item.unit}` : item.unit}
                    </span>
                    {item.load && item.load !== '—' && (
                      <span className="hod-mono" style={{ fontSize: 11, color: V('phos-400') }}>
                        {item.load}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {workout.finisher?.note && (
                <div style={{
                  marginTop: 20, paddingTop: 14,
                  borderTop: `1px dashed ${V('iron-700')}`,
                  opacity: ready ? 1 : 0,
                  transition: 'opacity 300ms ease',
                }}>
                  <HodLabel style={{ color: V('alert'), marginBottom: 4 }}>· FINISHER</HodLabel>
                  <div style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-dim') }}>
                    {workout.finisher.note}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* READY BUTTON — user taps when mentally prepped, no more auto-advance */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, ${V('ink')} 70%, transparent)`,
      }}>
        <HodButton
          onClick={onReady}
          size="lg"
          full
          disabled={!ready}
        >
          {ready ? 'READY · START LIVE' : (workout ? 'PRINTING...' : 'GENERATING...')}
        </HodButton>
        {ready && (
          <div className="hod-mono" style={{
            textAlign: 'center', fontSize: 9, color: V('bone-faint'),
            letterSpacing: '0.22em', marginTop: 8,
          }}>
            STUDY THE PLAN · SCROLL IF NEEDED · TAP TO BEGIN
          </div>
        )}
      </div>
    </div>
  );
}

function StampField({ label, value, locked }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 14,
      padding: '10px 0',
      borderBottom: `1px dashed ${V('iron-700')}`,
    }}>
      <div className="hod-mono" style={{
        fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em',
        width: 80,
      }}>
        {label}
      </div>
      <div style={{ flex: 1 }}>
        <div
          className="hod-display"
          style={{
            fontSize: 22,
            color: locked ? V('phos-400') : V('iron-600'),
            letterSpacing: '0.04em',
            animation: locked ? 'hod-stamp 320ms ease-out' : 'none',
            transformOrigin: 'left center',
          }}
        >
          {locked ? value : '—'}
        </div>
      </div>
      <div style={{
        width: 10, height: 10,
        border: `1px solid ${locked ? V('phos-500') : V('iron-600')}`,
        background: locked ? V('phos-500') : 'transparent',
        transition: 'all 200ms ease',
      }} />
    </div>
  );
}
