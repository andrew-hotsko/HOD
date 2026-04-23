'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { V, HodLabel, HodButton } from './atoms';
import { Quote } from './Quote';
import { randomQuote } from '@/lib/quotes';
import { MOVES } from '@/lib/generator';
import { useWakeLock } from '@/lib/wakelock';
import {
  cueMinuteStart, cueCountdown, cueFinish, cueTap,
  isAudioMuted, setAudioMuted,
} from '@/lib/audio';
import RestScreen from './RestScreen';
import MovementCueSheet from './MovementCueSheet';

// Formats that end when time runs out (show REMAINING, auto-finish at 0)
const TIME_BOUNDED = ['AMRAP', 'EMOM', 'TABATA', 'STATIONS', 'INTERVALS', 'BLOCKS'];
// Formats that end after one pass through the items (FINISH on last NEXT)
const ONE_PASS = ['FORTIME', 'CHIPPER', 'SETS'];

export default function LiveScreen({ config, onFinish, onExit, variant = 'adaptive' }) {
  const { workout } = config;
  const format = workout.main.format;
  const isTimeBounded = TIME_BOUNDED.includes(format);
  const isOnePass = ONE_PASS.includes(format);

  const [elapsed, setElapsed] = useState(0);
  const [paused, setPaused] = useState(false);
  const [round, setRound] = useState(1);
  const [itemIdx, setItemIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [resting, setResting] = useState(false);
  const [itemsCompleted, setItemsCompleted] = useState(0);
  const [swapOpen, setSwapOpen] = useState(false);
  const [items, setItems] = useState(workout.main.items);
  const [timeUp, setTimeUp] = useState(false);
  const [muted, setMuted] = useState(false);
  const [cueFor, setCueFor] = useState(null);
  const pausedAtRef = useRef(null);
  const startRef = useRef(Date.now());
  const finishedRef = useRef(false);

  useWakeLock(true);

  useEffect(() => { setMuted(isAudioMuted()); }, []);
  const toggleMute = () => {
    const next = !muted;
    setMuted(next);
    setAudioMuted(next);
  };

  // Clock tick
  useEffect(() => {
    if (paused || timeUp) {
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
  }, [paused, timeUp]);

  const totalSec = (workout.main.minutes || 10) * 60;
  const remaining = Math.max(0, totalSec - elapsed);
  const progress = Math.min(1, elapsed / totalSec);

  // Audio cues + EMOM auto-advance on minute boundaries
  useEffect(() => {
    if (paused || timeUp || finishedRef.current || elapsed === 0) return;
    if (format === 'EMOM' && elapsed % 60 === 0 && elapsed < totalSec) {
      cueMinuteStart();
      // Auto-advance to next movement at the top of every minute
      setItemIdx(idx => {
        const n = idx + 1;
        if (n >= items.length) {
          setRound(r => r + 1);
          return 0;
        }
        return n;
      });
      setItemsCompleted(n => n + 1);
    }
    if (isTimeBounded && !timeUp) {
      const r = totalSec - elapsed;
      if (r === 3 || r === 2 || r === 1) cueCountdown();
    }
  }, [elapsed, paused, timeUp, format, isTimeBounded, totalSec, items.length]);

  useEffect(() => {
    if (timeUp) cueFinish();
  }, [timeUp]);

  const finish = (reason) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    onFinish({
      elapsed,
      round,
      itemsCompleted,
      totalItems: items.length,
      reason,
    });
  };

  // Auto-finish when time runs out for time-bounded workouts
  useEffect(() => {
    if (!isTimeBounded || timeUp) return;
    if (elapsed >= totalSec) {
      setTimeUp(true);
      setTimeout(() => finish('time'), 1800);
    }
  }, [elapsed, isTimeBounded, totalSec, timeUp]);

  const currentItem = items[itemIdx] || items[0];

  const layout = variant === 'adaptive'
    ? (format === 'EMOM' || format === 'TABATA' ? 'clock'
       : format === 'AMRAP' ? 'rounds'
       : 'movement')
    : variant;

  const isLastItem = itemIdx === items.length - 1;
  const hasSets = Array.isArray(currentItem.schemeReps) && format === 'SETS' && !currentItem.accessory;
  const isLastSet = !hasSets || setIdx >= currentItem.schemeReps.length - 1;
  const nextWillFinish = isOnePass && isLastItem && isLastSet;

  const next = () => {
    setItemsCompleted(n => n + 1);

    // Strength sets: start a rest timer between sets of the same item
    if (hasSets && !isLastSet) {
      cueTap();
      setResting(true);
      return;
    }

    if (nextWillFinish) {
      cueFinish();
      finish('complete');
      return;
    }
    cueTap();
    if (itemIdx < items.length - 1) {
      setItemIdx(itemIdx + 1);
      setSetIdx(0);
    } else {
      // Time-bounded: wrap and increment round
      setItemIdx(0);
      setSetIdx(0);
      setRound(r => r + 1);
    }
  };

  const handleRestComplete = () => {
    setResting(false);
    setSetIdx(s => s + 1);
  };

  const prev = () => {
    if (!isOnePass || resting || paused || timeUp || finishedRef.current) return;
    if (itemIdx === 0 && setIdx === 0) return;
    if (hasSets && setIdx > 0) {
      setSetIdx(s => s - 1);
    } else if (itemIdx > 0) {
      setItemIdx(i => i - 1);
      setSetIdx(0);
    }
    cueTap();
  };

  // Swipe gesture handling on the main content area
  const touchRef = useRef(null);
  const onTouchStart = (e) => {
    if (paused || resting || timeUp || swapOpen) return;
    const t = e.touches[0];
    touchRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
  };
  const onTouchEnd = (e) => {
    const s = touchRef.current;
    touchRef.current = null;
    if (!s) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - s.x;
    const dy = t.clientY - s.y;
    if (Date.now() - s.time > 600) return;
    if (Math.abs(dx) < 50) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.6) return;
    if (dx < 0) next();
    else prev();
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={toggleMute}
            aria-label={muted ? 'Unmute audio' : 'Mute audio'}
            style={{
              width: 32, height: 28,
              border: `1px solid ${V('iron-700')}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: muted ? V('iron-500') : V('bone-dim'),
            }}
          >
            {muted ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 5v4h3l4 3V2L4 5H1z" fill="currentColor" />
                <path d="M10 5l3 3M13 5l-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="square" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M1 5v4h3l4 3V2L4 5H1z" fill="currentColor" />
                <path d="M10 4.5c1 .8 1 3.2 0 4M12 3c2 1.5 2 5.5 0 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="square" fill="none" />
              </svg>
            )}
          </button>
          <button
            onClick={() => finish('manual')}
            className="hod-mono"
            style={{
              fontSize: 10, color: V('bone-faint'), letterSpacing: '0.22em',
              border: `1px solid ${V('iron-700')}`, padding: '6px 10px',
            }}
          >
            END
          </button>
        </div>
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
      <div
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 0', overflow: 'hidden', touchAction: 'pan-y' }}
      >
        {layout === 'clock'    && <ClockLayout    workout={workout} elapsed={elapsed} remaining={remaining} currentItem={currentItem} itemIdx={itemIdx} items={items} onOpenCue={setCueFor} />}
        {layout === 'rounds'   && <RoundsLayout   workout={workout} round={round}     currentItem={currentItem} itemIdx={itemIdx} items={items} onOpenCue={setCueFor} />}
        {layout === 'movement' && <MovementLayout workout={workout}                    currentItem={currentItem} itemIdx={itemIdx} items={items} isLastOnePass={nextWillFinish} setIdx={hasSets ? setIdx : null} totalSets={hasSets ? currentItem.schemeReps.length : null} onOpenCue={setCueFor} />}
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

        <TimerDisplay elapsed={elapsed} remaining={remaining} showRemaining={isTimeBounded} />

        <button
          onClick={next}
          style={{
            flex: 1, height: 52,
            background: nextWillFinish ? V('phos-300') : V('phos-500'),
            color: V('ink'),
            border: `1px solid ${V('phos-400')}`,
            fontFamily: 'var(--f-display)',
            fontSize: 16, letterSpacing: '0.22em', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {nextWillFinish ? 'FINISH' : (hasSets && !isLastSet) ? 'REST' : 'NEXT'}
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M1 7h12M8 2l5 5-5 5" fill="none" stroke={V('ink')} strokeWidth="2" strokeLinecap="square" />
          </svg>
        </button>
      </div>

      {/* Form cue sheet */}
      {cueFor && (
        <MovementCueSheet movementName={cueFor} onClose={() => setCueFor(null)} />
      )}

      {/* Rest overlay (strength sets) */}
      {resting && (
        <RestScreen
          duration={150}
          label={`REST · SET ${setIdx + 1}/${currentItem.schemeReps.length} DONE`}
          headline="RECOVER."
          nextLabel={currentItem.name}
          nextDetail={`SET ${setIdx + 2} · ${currentItem.schemeReps[setIdx + 1]} REPS${currentItem.load && currentItem.load !== '—' ? ` · ${currentItem.load}` : ''}`}
          onComplete={handleRestComplete}
        />
      )}

      {/* Pause overlay */}
      {paused && !timeUp && (
        <PauseOverlay
          elapsed={elapsed}
          onResume={() => setPaused(false)}
          onExit={() => { setPaused(false); onExit ? onExit() : finish('manual'); }}
        />
      )}

      {/* Time's up overlay */}
      {timeUp && <TimeUpOverlay elapsed={elapsed} round={round} isAMRAP={format === 'AMRAP'} />}

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

// Footer clock — shows REMAINING for time-bounded, ELAPSED for one-pass
function TimerDisplay({ elapsed, remaining, showRemaining }) {
  const t = showRemaining ? remaining : elapsed;
  const mm = String(Math.floor(t / 60)).padStart(2, '0');
  const ss = String(t % 60).padStart(2, '0');
  const label = showRemaining ? 'REMAINING' : 'ELAPSED';
  const urgent = showRemaining && remaining > 0 && remaining <= 10;

  return (
    <div style={{
      flex: 1.2, height: 52,
      background: V('ink'),
      border: `1px solid ${urgent ? V('alert') : V('iron-700')}`,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      transition: 'border-color 180ms ease',
    }}>
      <span className="hod-label" style={{ color: urgent ? V('alert') : V('bone-faint'), fontSize: 9 }}>
        {label}
      </span>
      <span className="hod-display hod-mono" style={{
        fontSize: 28, color: urgent ? V('alert') : V('bone'), letterSpacing: '-0.01em',
        fontVariantNumeric: 'tabular-nums', lineHeight: 1,
      }}>
        {mm}:{ss}
      </span>
    </div>
  );
}

function TimeUpOverlay({ elapsed, round, isAMRAP }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(5,6,5,0.95)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      animation: 'hod-stamp 500ms ease-out',
    }} className="hod-scanlines">
      <div className="hod-label" style={{ color: V('phos-400'), marginBottom: 16, letterSpacing: '0.32em' }}>
        · TIME
      </div>
      <div className="hod-display" style={{
        fontSize: 128, color: V('phos-400'), lineHeight: 0.85,
        letterSpacing: '-0.04em', fontWeight: 700,
        textShadow: '0 0 40px var(--phos-glow)',
      }}>
        DONE.
      </div>
      {isAMRAP && (
        <div style={{ marginTop: 32, textAlign: 'center' }}>
          <div className="hod-label">YOU COMPLETED</div>
          <div className="hod-display hod-mono" style={{
            fontSize: 72, color: V('bone'), lineHeight: 1, fontVariantNumeric: 'tabular-nums',
          }}>
            {round - 1} {round - 1 === 1 ? 'ROUND' : 'ROUNDS'}
          </div>
        </div>
      )}
      <div style={{ marginTop: 24 }}>
        <div className="hod-label">TOTAL TIME</div>
        <div className="hod-display hod-mono" style={{
          fontSize: 40, color: V('bone-dim'), lineHeight: 1,
          fontVariantNumeric: 'tabular-nums', textAlign: 'center',
        }}>
          {mm}:{ss}
        </div>
      </div>
    </div>
  );
}

function PauseOverlay({ elapsed, onResume, onExit }) {
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const quote = useMemo(() => randomQuote(), []);
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
        <Quote quote={quote} size="lg" accent="alert" style={{ marginTop: 20, maxWidth: 340 }} />
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
function ClockLayout({ workout, elapsed, remaining, currentItem, onOpenCue }) {
  const secInMin = elapsed % 60;
  const minLeft = 59 - secInMin;
  const totalMinLeft = Math.ceil(remaining / 60);
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
        <div className="hod-mono" style={{ fontSize: 11, color: V('bone-faint'), letterSpacing: '0.2em', marginTop: 4 }}>
          {totalMinLeft} MIN REMAINING IN WORKOUT
        </div>
      </div>
      <div style={{ marginTop: 'auto', padding: '24px 0 12px', borderTop: `1px solid ${V('iron-700')}` }}>
        <HodLabel style={{ marginBottom: 8 }}>NOW ON</HodLabel>
        <MovementNameButton name={currentItem.name} onClick={onOpenCue} fontSize={34} />
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

function MovementNameButton({ name, onClick, fontSize = 44, color }) {
  if (!onClick) {
    return (
      <div className="hod-display" style={{
        fontSize, lineHeight: 0.95, color: color || V('bone'),
        letterSpacing: '-0.02em',
      }}>{name}</div>
    );
  }
  return (
    <button
      onClick={() => onClick(name)}
      className="hod-display"
      style={{
        fontSize, lineHeight: 0.95, color: color || V('bone'),
        letterSpacing: '-0.02em', textAlign: 'left', padding: 0,
        background: 'transparent', border: 'none',
        display: 'inline-flex', alignItems: 'baseline', gap: 8,
      }}
      aria-label={`Show form cue for ${name}`}
    >
      {name}
      <span className="hod-mono" style={{ fontSize: 9, color: V('bone-faint'), letterSpacing: '0.22em' }}>?</span>
    </button>
  );
}

// ── ROUNDS LAYOUT (AMRAP) ────────────────────────────────
function RoundsLayout({ workout, round, currentItem, itemIdx, items, onOpenCue }) {
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
        <MovementNameButton name={currentItem.name} onClick={onOpenCue} fontSize={34} />
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
function MovementLayout({ workout, currentItem, itemIdx, items, isLastOnePass, setIdx, totalSets, onOpenCue }) {
  const hasSets = setIdx != null && totalSets != null;
  const reps = hasSets
    ? `${currentItem.schemeReps[setIdx]}`
    : currentItem.schemeReps
      ? currentItem.schemeReps.join('-')
      : currentItem.reps ? `${currentItem.reps}` : '';

  return (
    <>
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <HodLabel style={{ color: V('phos-400'), marginTop: 8 }}>
            {hasSets ? `SET ${setIdx + 1} OF ${totalSets}` : `MOVEMENT ${itemIdx + 1} OF ${items.length}`}
          </HodLabel>
          {isLastOnePass && (
            <HodLabel style={{ color: V('phos-300'), marginTop: 8 }}>· LAST ONE</HodLabel>
          )}
        </div>
        <div style={{ marginTop: 10 }}>
          <MovementNameButton name={currentItem.name} onClick={onOpenCue} fontSize={44} />
        </div>

        {/* Progress pips — sets for strength, items for one-pass */}
        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
          {hasSets
            ? Array.from({ length: totalSets }).map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3,
                  background: i < setIdx ? V('phos-500') : i === setIdx ? V('phos-300') : V('iron-700'),
                }} />
              ))
            : items.map((_, i) => (
                <div key={i} style={{
                  flex: 1, height: 3,
                  background: i < itemIdx ? V('phos-500') : i === itemIdx ? V('phos-300') : V('iron-700'),
                }} />
              ))
          }
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
            {currentItem.progression && (
              <div className="hod-mono" style={{
                fontSize: 9, color: currentItem.progression.deltaLb > 0 ? V('phos-400') : V('alert'),
                letterSpacing: '0.18em', marginTop: 4,
              }}>
                {currentItem.progression.reason} · {currentItem.progression.deltaLb > 0 ? '+' : ''}{currentItem.progression.deltaLb} LB
              </div>
            )}
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
            <div className="hod-mono" style={{ fontSize: 11, color: V('phos-400'), letterSpacing: '0.18em' }}>
              — HIT FINISH WHEN DONE —
            </div>
          )}
        </div>
      </div>
    </>
  );
}
