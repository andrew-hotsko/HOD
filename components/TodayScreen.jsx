'use client';

import { useState, useEffect, useMemo } from 'react';
import { V, HodLabel, HodTag, HodRule, HodReg, HodMark } from './atoms';
import { INTENSITIES, STYLES, DURATIONS, generateHOD } from '@/lib/generator';
import { primeAudio } from '@/lib/audio';
import { loadEquipment } from '@/lib/storage';

export default function TodayScreen({ onStart, history, onOpenDay, yesterdayRecord, onRepeatYesterday, onOpenSettings }) {
  const [intensity, setIntensity] = useState('HARD');
  const [style, setStyle] = useState('CROSSFIT');
  const [duration, setDuration] = useState(30);

  // Live preview using the JS generator (equipment-aware so we never
  // suggest movements the user doesn't have gear for).
  const [equipment, setEquipment] = useState(null);
  useEffect(() => { setEquipment(loadEquipment()); }, []);
  const preview = useMemo(
    () => generateHOD({ intensity, style, duration, equipment }),
    [intensity, style, duration, equipment]
  );

  const today = new Date();
  const dd  = String(today.getDate()).padStart(2, '0');
  const mm  = String(today.getMonth() + 1).padStart(2, '0');
  const yy  = String(today.getFullYear()).slice(-2);
  const dow = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][today.getDay()];
  const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000);
  const weekNum = Math.ceil(today.getDate() / 7);

  const handleStart = () => {
    primeAudio();
    onStart({ intensity, style, duration });
  };

  return (
    <div
      style={{
        flex: 1,
        background: V('ink'),
        color: V('bone'),
        display: 'flex',
        flexDirection: 'column',
        paddingTop: 'max(20px, env(safe-area-inset-top))',
        overflow: 'hidden',
      }}
      className="hod-grid-bg hod-no-scrollbar"
    >
      {/* ── HEADER ──────────────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '8px 20px 0',
      }}>
        <HodMark size="sm" showDate={false} />
        <button
          onClick={onOpenSettings}
          aria-label="Edit kit"
          style={{
            width: 32, height: 32,
            border: `1px solid ${V('iron-700')}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: V('bone-dim'),
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="2.2" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 1v2M8 13v2M1 8h2M13 8h2M3 3l1.4 1.4M11.6 11.6L13 13M3 13l1.4-1.4M11.6 4.4L13 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="square" />
          </svg>
        </button>
      </div>

      {/* ── DATE STAMP ──────────────────────────────────────── */}
      <div style={{ padding: '20px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          borderBottom: `1px dashed ${V('iron-700')}`,
          paddingBottom: 14,
        }}>
          <div className="hod-label" style={{ color: V('phos-400'), fontSize: 10 }}>
            ORDERS FOR
          </div>
          <div style={{ flex: 1 }} />
          <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em' }}>
            DAY {String(dayOfYear).padStart(3, '0')}/365
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 18 }}>
          <div className="hod-display" style={{
            fontSize: 72, lineHeight: 0.85, color: V('bone'),
            fontWeight: 700, letterSpacing: '-0.03em',
          }}>
            {dd}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div className="hod-display" style={{
              fontSize: 18, color: V('phos-400'),
              letterSpacing: '0.08em', fontWeight: 600,
            }}>
              {dow}
            </div>
            <div className="hod-mono" style={{
              fontSize: 11, color: V('bone-faint'), letterSpacing: '0.18em', marginTop: 2,
            }}>
              {mm} · {yy} · W{weekNum}
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLLABLE CONTENT ──────────────────────────────── */}
      <div style={{ padding: '24px 20px 0', flex: 1, overflowY: 'auto' }} className="hod-no-scrollbar">

        <HistoryStrip history={history} onOpenDay={onOpenDay} />

        {yesterdayRecord && onRepeatYesterday && (
          <button
            onClick={() => { primeAudio(); onRepeatYesterday(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 12px', marginBottom: 18,
              background: V('iron-900'),
              border: `1px solid ${V('iron-700')}`,
              textAlign: 'left',
            }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
              <path d="M2 7a5 5 0 018.5-3.5L12 5M12 2v3h-3M12 7a5 5 0 01-8.5 3.5L2 9M2 12V9h3" stroke={V('phos-400')} strokeWidth="1.4" strokeLinecap="square" />
            </svg>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hod-mono" style={{ fontSize: 9, color: V('phos-400'), letterSpacing: '0.22em' }}>
                REPEAT YESTERDAY
              </div>
              <div className="hod-display" style={{ fontSize: 14, color: V('bone'), letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {yesterdayRecord.workout?.main?.headline || 'Previous workout'}
              </div>
            </div>
            <span className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.2em' }}>
              →
            </span>
          </button>
        )}

        <HodLabel style={{ marginBottom: 10 }}>TODAY · YOUR HOD</HodLabel>

        {/* Workout preview card */}
        <div style={{
          border: `1px solid ${V('iron-700')}`,
          background: V('iron-900'),
          padding: '18px 16px',
          position: 'relative',
        }}>
          <HodReg style={{ position: 'absolute', top: -5, left: -5 }} />
          <HodReg style={{ position: 'absolute', top: -5, right: -5 }} />
          <HodReg style={{ position: 'absolute', bottom: -5, left: -5 }} />
          <HodReg style={{ position: 'absolute', bottom: -5, right: -5 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="hod-label" style={{ color: V('phos-400') }}>
              {preview.style.label.toUpperCase()} · {preview.format}
            </div>
            <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em' }}>
              {duration} MIN
            </div>
          </div>

          <div className="hod-display" style={{
            fontSize: 26, marginTop: 6, color: V('bone'),
            letterSpacing: '-0.01em', lineHeight: 1.05,
          }}>
            {preview.main.headline}
          </div>

          <div style={{ fontFamily: 'var(--f-ui)', fontSize: 12, color: V('bone-dim'), marginTop: 6 }}>
            {preview.main.description}
          </div>

          <HodRule ticks style={{ margin: '14px 0 12px' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {preview.main.items.slice(0, 4).map((item, i) => (
              <MovementRow key={i} item={item} idx={i} />
            ))}
            {preview.main.items.length > 4 && (
              <div className="hod-mono" style={{ fontSize: 11, color: V('bone-faint'), letterSpacing: '0.12em', paddingLeft: 22 }}>
                + {preview.main.items.length - 4} MORE
              </div>
            )}
          </div>
        </div>

        {/* ── INTENSITY PICKER ───────────────────────────── */}
        <div style={{ marginTop: 24 }}>
          <HodLabel style={{ marginBottom: 10 }}>INTENSITY</HodLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {INTENSITIES.map(i => (
              <HodTag
                key={i.key}
                selected={intensity === i.key}
                onClick={() => setIntensity(i.key)}
                compact
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {i.label}
              </HodTag>
            ))}
          </div>
        </div>

        {/* ── STYLE PICKER ───────────────────────────────── */}
        <div style={{ marginTop: 18 }}>
          <HodLabel style={{ marginBottom: 10 }}>STYLE</HodLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {Object.entries(STYLES).map(([key, s]) => (
              <HodTag
                key={key}
                selected={style === key}
                onClick={() => setStyle(key)}
                compact
              >
                {s.label}
              </HodTag>
            ))}
          </div>
        </div>

        {/* ── DURATION PICKER ────────────────────────────── */}
        <div style={{ marginTop: 18, marginBottom: 16 }}>
          <HodLabel style={{ marginBottom: 10 }}>DURATION</HodLabel>
          <div style={{ display: 'flex', gap: 6 }}>
            {DURATIONS.map(d => (
              <HodTag
                key={d}
                selected={duration === d}
                onClick={() => setDuration(d)}
                compact
                style={{ flex: 1, justifyContent: 'center' }}
              >
                {d}<span style={{ opacity: 0.6, marginLeft: 2 }}>MIN</span>
              </HodTag>
            ))}
          </div>
        </div>
      </div>

      {/* ── BEGIN HOD BUTTON ────────────────────────────────── */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, ${V('ink')} 60%, transparent)`,
      }}>
        <StartButton onClick={handleStart} />
      </div>
    </div>
  );
}

function MovementRow({ item, idx }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <div className="hod-mono" style={{ width: 18, fontSize: 10, color: V('iron-500'), letterSpacing: '0.1em' }}>
        {String(idx + 1).padStart(2, '0')}
      </div>
      <div className="hod-display" style={{ flex: 1, fontSize: 14, color: V('bone') }}>
        {item.name}
      </div>
      <div className="hod-mono" style={{ fontSize: 12, color: V('bone-dim') }}>
        {item.schemeReps ? item.schemeReps.join('-') :
         item.reps ? `${item.reps} ${item.unit}` : item.unit}
      </div>
      {item.load && item.load !== '—' && (
        <div className="hod-mono" style={{ fontSize: 11, color: V('phos-400'), minWidth: 62, textAlign: 'right' }}>
          {item.load}
        </div>
      )}
    </div>
  );
}

function StartButton({ onClick }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setArmed(true), 200);
    return () => clearTimeout(t);
  }, []);

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%', height: 72,
        background: V('phos-500'),
        color: V('ink'),
        border: `1px solid ${V('phos-400')}`,
        borderRadius: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        overflow: 'hidden',
        fontFamily: 'var(--f-display)',
        boxShadow: armed ? '0 0 32px -4px rgba(132, 204, 22, 0.5)' : 'none',
        transition: 'box-shadow 400ms ease',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ width: 12, height: 1, background: V('ink') }} />
        <div style={{ width: 8,  height: 1, background: V('ink') }} />
        <div style={{ width: 12, height: 1, background: V('ink') }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.3em', lineHeight: 1 }}>
          BEGIN HOD
        </div>
        <div className="hod-mono" style={{ fontSize: 9, color: V('ink'), opacity: 0.7, letterSpacing: '0.18em', marginTop: 4 }}>
          PRESS TO GENERATE
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
        <div style={{ width: 12, height: 1, background: V('ink') }} />
        <div style={{ width: 8,  height: 1, background: V('ink') }} />
        <div style={{ width: 12, height: 1, background: V('ink') }} />
      </div>
    </button>
  );
}

export function HistoryStrip({ history, onOpenDay }) {
  const days = history || [];

  const streak = (() => {
    let s = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i]?.done) s++;
      else break;
    }
    return s;
  })();

  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 }}>
        <HodLabel>14 DAYS</HodLabel>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, background: V('phos-500'), boxShadow: `0 0 6px var(--phos-glow)`, display: 'inline-block' }} />
          <span className="hod-mono" style={{ fontSize: 10, color: V('bone-dim'), letterSpacing: '0.18em' }}>
            {streak} DAY STREAK
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        {days.map((d, i) => {
          const clickable = d.done && onOpenDay;
          return (
            <button
              key={i}
              onClick={clickable ? () => onOpenDay(d.iso) : undefined}
              disabled={!clickable}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                background: 'transparent', padding: 0,
                cursor: clickable ? 'pointer' : 'default',
              }}
              aria-label={clickable ? `Open workout detail for ${d.iso}` : undefined}
            >
              <div style={{
                width: '100%', aspectRatio: '1', maxWidth: 20,
                background: d.done ? V('phos-500') : 'transparent',
                border: `1px solid ${d.isToday ? V('phos-400') : d.done ? V('phos-500') : V('iron-700')}`,
                position: 'relative',
              }}>
                {d.isToday && !d.done && (
                  <div style={{ position: 'absolute', inset: 3, border: `1px dashed ${V('phos-400')}` }} />
                )}
              </div>
              <span className="hod-mono" style={{ fontSize: 8, color: d.isToday ? V('phos-400') : V('iron-500'), letterSpacing: '0.1em' }}>
                {d.date ? d.date.getDate() : ''}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
