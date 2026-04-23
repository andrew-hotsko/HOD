'use client';

import { useState, useEffect, useMemo } from 'react';
import { V, HodLabel, HodButton, HodRule, HodStat, HodMark } from './atoms';
import { loadPR, savePR } from '@/lib/storage';
import { Quote } from './Quote';
import { randomQuote } from '@/lib/quotes';

const MAX_NOTES = 300;

const RATINGS = [
  { key: 'easy',   label: 'EASY',   color: 'bone' },
  { key: 'solid',  label: 'SOLID',  color: 'phos-400' },
  { key: 'brutal', label: 'BRUTAL', color: 'alert' },
];

export default function CompleteScreen({ config, stats, onClose, onRate, onNote }) {
  const [rating, setRating] = useState(null);
  const [shared, setShared] = useState(false);
  const [notes, setNotes] = useState('');
  const quote = useMemo(() => randomQuote('post'), []);
  const pickRating = (key) => {
    setRating(key);
    onRate?.(key);
  };
  const commitNotes = () => {
    onNote?.(notes.trim());
  };

  const elapsedSec = stats?.elapsed ?? 0;
  const elMM = String(Math.floor(elapsedSec / 60)).padStart(2, '0');
  const elSS = String(elapsedSec % 60).padStart(2, '0');
  const isAMRAPShare = config.workout.main.format === 'AMRAP';
  const roundsDoneShare = stats ? Math.max(0, (stats.round || 1) - 1) : 0;

  const shareText = [
    `HOD — ${elMM}:${elSS}`,
    `${config.workout.style.label.toUpperCase()} · ${config.workout.main.format} · ${config.duration} MIN`,
    isAMRAPShare ? `${roundsDoneShare} round${roundsDoneShare === 1 ? '' : 's'}` : null,
    `Intensity: ${config.workout.intensity.label}`,
  ].filter(Boolean).join('\n');

  const handleShare = async () => {
    const payload = { title: 'HOD', text: shareText };
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      // User canceled or share failed; fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(shareText);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch {}
  };

  // PR logging — only for SETS format, items[0] is always the heavy lift
  const isSets = config.workout.main.format === 'SETS';
  const heavyLift = isSets ? config.workout.main.items[0] : null;
  const reps = heavyLift?.schemeReps?.[0] ?? null;
  const suggestedNum = heavyLift?.load ? parseInt(String(heavyLift.load).match(/\d+/)?.[0] ?? '0', 10) : 0;
  const [liftInput, setLiftInput] = useState(suggestedNum ? String(suggestedNum) : '');
  const [previousPR, setPreviousPR] = useState(null);
  const [logged, setLogged] = useState(null); // { isPR: bool, value: num }

  useEffect(() => {
    if (heavyLift) setPreviousPR(loadPR(heavyLift.name));
  }, [heavyLift?.name]);

  const logLift = () => {
    const val = parseInt(liftInput, 10);
    if (!val || !heavyLift) return;
    const prev = loadPR(heavyLift.name);
    const isPR = !prev || val > prev.load;
    const today = new Date();
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    if (isPR) {
      const saved = savePR(heavyLift.name, { load: val, reps, date: todayStr });
      setPreviousPR(saved);
    }
    setLogged({ isPR, value: val, prevLoad: prev?.load ?? null });
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

        <Quote quote={quote} size="md" style={{ marginTop: 20, maxWidth: 340 }} />

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

        {heavyLift && (
          <>
            <HodRule ticks style={{ margin: '28px 0 14px' }} />
            <HodLabel style={{ marginBottom: 10 }}>
              LOG LIFT · {heavyLift.name.toUpperCase()}
            </HodLabel>
            <div style={{
              display: 'flex', alignItems: 'stretch', gap: 10,
              border: `1px solid ${logged?.isPR ? V('phos-500') : V('iron-700')}`,
              background: V('iron-900'),
              padding: 10,
              transition: 'border-color 200ms ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                <input
                  type="number"
                  inputMode="numeric"
                  value={liftInput}
                  onChange={(e) => { setLiftInput(e.target.value); setLogged(null); }}
                  placeholder="0"
                  className="hod-display hod-mono"
                  style={{
                    flex: 1, minWidth: 0,
                    fontSize: 32, color: V('bone'),
                    background: 'transparent', border: 'none', outline: 'none',
                    fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em',
                    padding: '4px 6px',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <span className="hod-label" style={{ color: V('bone-faint'), fontSize: 9 }}>LB</span>
                  {reps && (
                    <span className="hod-mono" style={{ fontSize: 9, color: V('bone-faint'), letterSpacing: '0.18em' }}>
                      ×{reps}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={logLift}
                disabled={!liftInput || parseInt(liftInput, 10) === 0}
                className="hod-mono"
                style={{
                  padding: '0 16px',
                  fontSize: 11, letterSpacing: '0.22em', fontWeight: 600,
                  background: logged?.isPR ? V('phos-500') : V('ink'),
                  color: logged?.isPR ? V('ink') : V('bone'),
                  border: `1px solid ${logged?.isPR ? V('phos-500') : V('iron-700')}`,
                  transition: 'all 200ms ease',
                  opacity: (!liftInput || parseInt(liftInput, 10) === 0) ? 0.4 : 1,
                }}
              >
                {logged?.isPR ? 'NEW PR' : logged ? 'LOGGED' : 'LOG'}
              </button>
            </div>
            {previousPR && !logged && (
              <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.2em', marginTop: 6 }}>
                PREV PR · {previousPR.load} LB · {previousPR.date}
              </div>
            )}
            {logged?.isPR && (
              <div className="hod-mono" style={{ fontSize: 10, color: V('phos-400'), letterSpacing: '0.22em', marginTop: 6 }}>
                + {logged.prevLoad != null ? `${logged.value - logged.prevLoad} LB OVER PREV` : 'FIRST LOGGED PR'}
              </div>
            )}
            {logged && !logged.isPR && logged.prevLoad != null && (
              <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.2em', marginTop: 6 }}>
                LOGGED · PR HOLDS AT {logged.prevLoad} LB
              </div>
            )}
          </>
        )}

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

        <HodRule ticks style={{ margin: '24px 0 12px' }} />

        <HodLabel style={{ marginBottom: 8 }}>
          NOTES <span style={{ color: V('bone-faint'), letterSpacing: '0.18em' }}>(OPTIONAL)</span>
        </HodLabel>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
          onBlur={commitNotes}
          placeholder="Shoulder felt tight · grip failed on round 3 · anything to remember"
          rows={3}
          className="hod-ui"
          style={{
            width: '100%',
            background: V('iron-900'),
            color: V('bone'),
            border: `1px solid ${V('iron-700')}`,
            padding: '12px 14px',
            fontSize: 13,
            fontFamily: 'var(--f-ui)',
            lineHeight: 1.5,
            outline: 'none',
            resize: 'none',
          }}
        />
        {notes.length > 0 && (
          <div className="hod-mono" style={{ fontSize: 9, color: V('bone-faint'), letterSpacing: '0.18em', marginTop: 4, textAlign: 'right' }}>
            {notes.length}/{MAX_NOTES}
          </div>
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 10,
      }}>
        <HodButton onClick={handleShare} variant="ghost" size="lg" style={{ flex: 1 }}>
          {shared ? 'COPIED' : 'SHARE'}
        </HodButton>
        <HodButton onClick={onClose} full size="lg" style={{ flex: 2 }}>BACK TO TODAY</HodButton>
      </div>
    </div>
  );
}
