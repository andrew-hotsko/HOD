'use client';

import { useState, useEffect, useRef } from 'react';
import { V, HodLabel, HodButton } from './atoms';
import { MOVES } from '@/lib/generator';

export default function LiveScreen({ config, onFinish, onExit, variant = 'adaptive' }) {
  const { workout } = config;
  const format = workout.main.format;

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(1);
  const [itemIdx, setItemIdx] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  const [items, setItems] = useState(workout.main.items);
  const pausedAtRef = useRef(null);
  const startRef = useRef(Date.now());

  useEffect(() => {
    if (paused) {
      pausedAtRef.current = elapsed;
      return;
    }
    if (pausedAtRef.current !== null) {
      startRef.current = Date.now() - pausedAtRef.current * 1000;
      pausedAtRef.current = null;
    }
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startRef.current) / 1000));
    }, 100);
    return () => clearInterval(t);
  }, [paused]);

  const totalSec = (workout.main.minutes || 10) * 60;
  const remaining = Math.max(0, totalSec - elapsed);
  const progress = Math.min(1, elapsed / totalSec);

  const currentItem = items[itemIdx] || items[0];

  const layout = variant === 'adaptive'
    ? (format === 'EMOM' || format === 'TABATA' ? 'clock'
       : format === 'AMRAP' ? 'rounds'
       : 'movement')
    : variant;

  const next = () => {
    if (itemIdx < items.length - 1) setItemIdx(itemIdx + 1);
    else { setItemIdx(0); setRound(r => r + 1); }
  };

  const swap = () => {
    const cur = items[itemIdx];
    const pool = MOVES.filter(m => m.name !== cur.name);
    const pick = pool[Math.floor(Math.random() * pool.length)];
    if (!pick) return;
    const updated = [...items];
    updated[itemIdx] = { ...cur, name: pick.name, unit: pick.unit };
    setItems(updated);
    setSwapOpen(false);
  };

  return (
    <div style={{
      flex: 1,
      background: V('ink'),
      display: 'flex',
      flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      position: 'relative',
    }} className="hod-scanlines">

      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 20px 12px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%', background: V('alert'),
            boxShadow: `0 0 10px var(--alert)`,
            animation: 'hod-pulse 1.4s ease-in-out infinite',
          }} />
          <span className="hod-label" style={{ color: V('alert'), letterSpacing: '0.22em' }}>LIVE</span>
          <span className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em', marginLeft: 4 }}>
            {workout.main.label}
          </span>
        </div>
        <button
          onClick={onFinish}
          className="hod-mono"
          style={{
            fontSize: 10, color: V('bone-faint'), letterSpacing: '0.22em',
            border: `1px solid ${V('iron-700')}`, padding: '6px 10px',
          }}
        >
          END
        </button>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: V('iron-800'), margin: '0 16px', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: `${progress * 100}%`,
          background: V('phos-500'),
          transition: 'width 200ms linear',
          boxShadow: '0 0 8px var(--phos-glow)',
        }} />
        {Array.from({ length: Math.max(1, Math.floor(totalSec / 60)) }).map((_, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: `${((i + 1) * 60 / totalSec) * 100}%`,
            top: -1, bottom: -1, width: 1,
            background: V('iron-600'),
          }} />
        ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 0', overflow: 'hidden' }}>
        {layout === 'clock'    && <ClockLayout    workout={workout} elapsed={elapsed} currentItem={currentItem} itemIdx={itemIdx} items={items} />}
        {layout === 'rounds'   && <RoundsLayout   workout={workout} round={round}     currentItem={currentItem} itemIdx={itemIdx} items={items} />}
        {layout === 'movement' && <MovementLayout workout={workout}                   currentItem={currentItem} itemIdx={itemIdx} items={items} />}
      </div>

      {/* Footer */}
      <div style={{
        borderTop: `1px solid ${V('iron-700')}`,
        background: V('iron-950'),
        padding: '14px 16px',
        paddingBottom: 'max(14px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 10, alignItems: 'stretch',
      }}>
        <button
          onClick={() => setPaused(true)}
          style={{
            width: 56, height: 52,
            background: 'transparent',
            border: `1px solid ${V('iron-700')}`,
            color: V('bone'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Pause"
        >
          <svg width="18" height="22" viewBox="0 0 22 24">
            <rect x="2" y="2" width="7" height="20" fill={V('bone')} />
            <rect x="13" y="2" width="7" height="20" fill={V('bone')} />
          </svg>
        </button>

        <button
          onClick={() => setSwapOpen(true)}
          style={{
            width: 56, height: 52,
            background: 'transparent',
            border: `1px solid ${V('iron-700')}`,
            color: V('bone'),
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          aria-label="Swap movement"
        >
          <svg width="20" height="18" viewBox="0 0 20 18" fill="none">
            <path d="M2 5h14M12 1l4 4-4 4M18 13H4M8 17l-4-4 4-4" stroke={V('bone')} strokeWidth="1.6" strokeLinecap="square" />
          </svg>
        </button>

        <ElapsedClock elapsed={elapsed} />

        <button
          onClick={next}
          style={{
            flex: 1, height: 52,
            background: V('phos-500'),
            color: V('ink'),
            border: `1px solid ${V('phos-400')}`,
            fontFamily: 'var(--f-display)',
            fontSize: 16, letterSpacing: '0.22em', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          NEXT
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M1 7h12M8 2l5 5-5 5" fill="none" stroke={V('ink')} strokeWidth="2" strokeLinecap="square" />
          </svg>
        </button>
      </div>

      {/* Pause overlay */}
      {paused && (
        <PauseOverlay
          elapsed={elapsed}
          onResume={() => setPaused(false)}
          onExit={() => { setPaused(false); onExit ? onExit() : onFinish(); }}
        />
      )}

      {/* Swap sheet */}
      {swapOpen && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 40,
          background: 'rgba(5,6,5,0.9)', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
        }}>
          <div style={{
            background: V('iron-900'),
            borderTop: `1px solid ${V('phos-500')}`,
            padding: '20px 20px',
            paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          }}>
            <HodLabel style={{ color: V('phos-400'), marginBottom: 8 }}>
              SWAP MOVEMENT {itemIdx + 1}
            </HodLabel>
            <div className="hod-display" style={{ fontSize: 22, color: V('bone'), marginBottom: 16 }}>
              Replace <span style={{ color: V('phos-400') }}>{currentItem.name}</span>?
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <HodButton onClick={() => setSwapOpen(false)} variant="ghost" size="md" style={{ flex: 1 }}>CANCEL</HodButton>
              <HodButton onClick={swap} size="md" style={{ flex: 2 }}>REROLL</HodButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ElapsedClock({ elapsed }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div style={{
      flex: 1.2, height: 52,
      background: V('ink'),
      border: `1px solid ${V('iron-700')}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    }}>
      <span className="hod-label" style={{ color: V('bone-faint'), fontSize: 9 }}>ELAPSED</span>
      <span className="hod-display hod-mono" style={{
        fontSize: 28, color: V('bone'), letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>
        {mm}:{ss}
      </span>
    </div>
  );
}

function PauseOverlay({ elapsed, onResume, onExit }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 50,
      background: 'rgba(5,6,5,0.94)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px' }}>
        <div className="hod-display" style={{ fontSize: 20, color: V('phos-400'), letterSpacing: '-0.02em', fontWeight: 700 }}>
          HOD//
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 24px' }}>
        <div className="hod-label" style={{ color: V('phos-400'), letterSpacing: '0.32em', marginBottom: 16 }}>· HOLD</div>
        <div className="hod-display" style={{ fontSize: 96, lineHeight: 0.85, color: V('bone'), letterSpacing: '-0.03em' }}>
          PAUSED.
        </div>
        <div style={{ marginTop: 32 }}>
          <div className="hod-label">ELAPSED AT PAUSE</div>
          <div className="hod-display hod-mono" style={{
            fontSize: 56, color: V('bone-dim'), fontVariantNumeric: 'tabular-nums',
            letterSpacing: '-0.02em', marginTop: 4,
          }}>
            {mm}:{ss}
          </div>
        </div>
      </div>
      <div style={{
        padding: '16px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex', flexDirection: 'column', gap: 10,
      }}>
        <HodButton onClick={onResume} size="lg" full>RESUME</HodButton>
        <HodButton onClick={onExit} variant="ghost" size="md" full>SCRAP WORKOUT</HodButton>
      </div>
    </div>
  );
}

// ── CLOCK LAYOUT (EMOM / TABATA) ─────────────────────────
function ClockLayout({ workout, elapsed, currentItem }) {
  const secInMin = elapsed % 60;
  const minLeft = 59 - secInMin;
  return (
    <>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <HodLabel style={{ color: V('phos-400'), marginBottom: 4 }}>SECONDS LEFT IN MINUTE</HodLabel>
      </div>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <div className="hod-display hod-mono" style={{
          fontSize: 200, lineHeight: 0.85, fontWeight: 700,
          color: minLeft <= 5 ? V('alert') : V('phos-400'),
          letterSpacing: '-0.04em',
          textShadow: minLeft <= 5
            ? '0 0 40px rgba(230, 57, 70, 0.4)'
            : '0 0 40px var(--phos-glow)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {String(minLeft).padStart(2, '0')}
        </div>
      </div>
      <div style={{ marginTop: 'auto', padding: '24px 0 12px', borderTop: `1px solid ${V('iron-700')}` }}>
        <HodLabel style={{ marginBottom: 8 }}>NOW ON</HodLabel>
        <div className="hod-display" style={{ fontSize: 34, color: V('bone'), lineHeight: 1, letterSpacing: '-0.01em' }}>
          {currentItem.name}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          <div className="hod-mono" style={{ fontSize: 13, color: V('bone-dim') }}>
            {currentItem.reps ? `${currentItem.reps} ${currentItem.unit}` : currentItem.unit}
          </div>
          {currentItem.load && currentItem.load !== '—' && (
            <div className="hod-mono" style={{ fontSize: 13, color: V('phos-400') }}>
              {currentItem.load}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ── ROUNDS LAYOUT (AMRAP) ────────────────────────────────
function RoundsLayout({ workout, round, currentItem, itemIdx, items }) {
  return (
    <>
      <div style={{ textAlign: 'center', marginTop: 8 }}>
        <HodLabel style={{ color: V('phos-400') }}>ROUND</HodLabel>
      </div>
      <div style={{ textAlign: 'center', marginTop: 6 }}>
        <div className="hod-display hod-mono" style={{
          fontSize: 200, lineHeight: 0.85, fontWeight: 700,
          color: V('phos-400'),
          letterSpacing: '-0.04em',
          textShadow: '0 0 40px var(--phos-glow)',
          fontVariantNumeric: 'tabular-nums',
        }}>
          {String(round).padStart(2, '0')}
        </div>
      </div>
      <div style={{ marginTop: 'auto', padding: '20px 0 12px', borderTop: `1px solid ${V('iron-700')}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <HodLabel>NOW</HodLabel>
          <HodLabel style={{ color: V('bone-faint') }}>{itemIdx + 1}/{items.length}</HodLabel>
        </div>
        <div className="hod-display" style={{ fontSize: 34, color: V('bone'), lineHeight: 1, letterSpacing: '-0.01em' }}>
          {currentItem.name}
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
          <div className="hod-mono" style={{ fontSize: 13, color: V('bone-dim') }}>
            {currentItem.reps ? `${currentItem.reps} ${currentItem.unit}` : currentItem.unit}
          </div>
          {currentItem.load && currentItem.load !== '—' && (
            <div className="hod-mono" style={{ fontSize: 13, color: V('phos-400') }}>
              {currentItem.load}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
          {items.map((_, i) => (
            <div key={i} style={{
              flex: 1, height: 2,
              background: i < itemIdx ? V('phos-500') : i === itemIdx ? V('phos-300') : V('iron-700'),
            }} />
          ))}
        </div>
      </div>
    </>
  );
}

// ── MOVEMENT LAYOUT (FORTIME / SETS / CHIPPER) ───────────
function MovementLayout({ workout, currentItem, itemIdx, items }) {
  const reps = currentItem.schemeReps
    ? currentItem.schemeReps.join('-')
    : currentItem.reps ? `${currentItem.reps}` : '';

  return (
    <>
      <div>
        <HodLabel style={{ color: V('phos-400'), marginTop: 8 }}>
          MOVEMENT {itemIdx + 1} OF {items.length}
        </HodLabel>
        <div className="hod-display" style={{
          fontSize: 44, lineHeight: 0.95, marginTop: 10,
          color: V('bone'), letterSpacing: '-0.02em',
        }}>
          {currentItem.name}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', gap: 20, alignItems: 'flex-end' }}>
        {reps && (
          <div>
            <HodLabel style={{ marginBottom: 2 }}>REPS</HodLabel>
            <div className="hod-display hod-mono" style={{
              fontSize: reps.length > 4 ? 56 : 92,
              lineHeight: 0.85, color: V('phos-400'),
              fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em',
              textShadow: '0 0 30px var(--phos-glow)',
            }}>
              {reps}
            </div>
            <div className="hod-mono" style={{ fontSize: 11, color: V('bone-faint'), letterSpacing: '0.18em', marginTop: 4 }}>
              {currentItem.unit?.toUpperCase()}
            </div>
          </div>
        )}
        {currentItem.load && currentItem.load !== '—' && (
          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <HodLabel style={{ marginBottom: 2 }}>LOAD</HodLabel>
            <div className="hod-display hod-mono" style={{ fontSize: 32, color: V('bone'), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
              {currentItem.load}
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', padding: '0 0 12px' }}>
        <HodLabel style={{ marginBottom: 8 }}>UP NEXT</HodLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {items.slice(itemIdx + 1, itemIdx + 3).map((item, i) => (
            <div key={i} className="hod-display" style={{
              fontSize: 14, color: i === 0 ? V('bone-dim') : V('iron-500'),
              display: 'flex', justifyContent: 'space-between',
            }}>
              <span>{item.name}</span>
              <span className="hod-mono" style={{ fontSize: 11 }}>
                {item.schemeReps ? item.schemeReps.join('-') :
                 item.reps ? `${item.reps} ${item.unit}` : item.unit}
              </span>
            </div>
          ))}
          {items.slice(itemIdx + 1).length === 0 && (
            <div className="hod-mono" style={{ fontSize: 11, color: V('iron-500'), letterSpacing: '0.18em' }}>
              — END OF BLOCK —
            </div>
          )}
        </div>
      </div>
    </>
  );
}
