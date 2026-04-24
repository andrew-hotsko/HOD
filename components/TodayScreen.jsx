'use client';

import { useState, useEffect, useMemo } from 'react';
import { V, HodLabel, HodTag, HodRule, HodReg, HodMark } from './atoms';
import { INTENSITIES, STYLES, DURATIONS, generateHOD } from '@/lib/generator';
import { primeAudio } from '@/lib/audio';
import { loadEquipment, loadRecentWorkoutSummaries, loadProfile, loadFamilyCode, todayISO, weeklyStats } from '@/lib/storage';

const TWEAK_OPTIONS = [
  { key: 'shoulder', label: 'SHOULDER' },
  { key: 'knee',     label: 'KNEE' },
  { key: 'lowback',  label: 'LOW BACK' },
  { key: 'wrist',    label: 'WRIST' },
  { key: 'hip',      label: 'HIP' },
  { key: 'neck',     label: 'NECK' },
];

export default function TodayScreen({ onStart, history, onOpenDay, yesterdayRecord, onRepeatYesterday, onOpenSettings, onMarkRestDay, todayIsDone, todayIsRestDay }) {
  const [intensity, setIntensity] = useState('HARD');
  const [style, setStyle] = useState('CROSSFIT');
  const [duration, setDuration] = useState(30);
  const [tweaks, setTweaks] = useState([]);
  const [partnerMode, setPartnerMode] = useState(false);
  const [confirmRest, setConfirmRest] = useState(false);

  // Live preview using the JS generator (equipment-aware so we never
  // suggest movements the user doesn't have gear for).
  const [equipment, setEquipment] = useState(null);
  const [recentCount, setRecentCount] = useState(0);
  const [profileName, setProfileName] = useState('');
  const [familyFeed, setFamilyFeed] = useState(null); // null = not loaded / no code; [] = loaded empty
  const [familyWod, setFamilyWod] = useState(null);
  const [week, setWeek] = useState(null);
  useEffect(() => {
    setEquipment(loadEquipment());
    setRecentCount(loadRecentWorkoutSummaries(7).length);
    setWeek(weeklyStats());
    const name = (loadProfile().name || '').trim();
    setProfileName(name);
    const code = loadFamilyCode();
    if (code) {
      fetch(`/api/feed?code=${encodeURIComponent(code)}`)
        .then((r) => r.ok ? r.json() : { items: [] })
        .then((data) => setFamilyFeed(Array.isArray(data.items) ? data.items : []))
        .catch(() => setFamilyFeed([]));
      const today = todayISO();
      fetch(`/api/wod?code=${encodeURIComponent(code)}&date=${today}`)
        .then((r) => r.ok ? r.json() : { wod: null })
        .then((data) => {
          if (data.wod && data.wod.author && data.wod.author !== name) {
            setFamilyWod(data.wod);
          }
        })
        .catch(() => {});
    }
  }, []);
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
    onStart({ intensity, style, duration, tweaks, partnerMode });
  };

  const handleStartFamilyWod = () => {
    if (!familyWod?.params) return;
    primeAudio();
    onStart({
      intensity: familyWod.params.intensity,
      style: familyWod.params.style,
      duration: familyWod.params.duration,
      tweaks,
      partnerMode: !!familyWod.partnered,
    });
  };

  const toggleTweak = (key) => {
    setTweaks((prev) => prev.includes(key) ? prev.filter(t => t !== key) : [...prev, key]);
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
            ORDERS FOR{profileName ? ` · ${profileName.toUpperCase()}` : ''}
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

        {week && (week.workouts > 0 || week.restCount > 0) && (
          <WeeklyStrip stats={week} />
        )}

        {familyFeed && familyFeed.length > 0 && (
          <FamilyFeedStrip items={familyFeed} />
        )}

        {familyWod && (
          <FamilyWodCard wod={familyWod} onStart={handleStartFamilyWod} />
        )}

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

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
          <HodLabel>TODAY · YOUR HOD</HodLabel>
          {recentCount > 0 && (
            <span className="hod-mono" style={{ fontSize: 9, color: V('phos-400'), letterSpacing: '0.22em' }}>
              · ADAPTS TO LAST {recentCount}
            </span>
          )}
        </div>

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
            {preview.main.items.map((item, i) => (
              <MovementRow key={i} item={item} idx={i} />
            ))}
          </div>
          {preview.finisher?.note && (
            <div style={{
              marginTop: 12, paddingTop: 10,
              borderTop: `1px dashed ${V('iron-700')}`,
            }}>
              <div className="hod-mono" style={{ fontSize: 9, color: V('alert'), letterSpacing: '0.22em', marginBottom: 3 }}>
                · FINISHER
              </div>
              <div style={{ fontFamily: 'var(--f-ui)', fontSize: 12, color: V('bone-dim') }}>
                {preview.finisher.note}
              </div>
            </div>
          )}
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
        <div style={{ marginTop: 18 }}>
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

        {/* ── TWEAKS (today-only body signals) ─────────── */}
        <div style={{ marginTop: 18 }}>
          <HodLabel style={{ marginBottom: 10 }}>
            ANY TWEAKS TODAY?{tweaks.length > 0 && <span style={{ color: V('alert'), marginLeft: 6 }}>· {tweaks.length}</span>}
          </HodLabel>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TWEAK_OPTIONS.map(t => (
              <HodTag
                key={t.key}
                selected={tweaks.includes(t.key)}
                onClick={() => toggleTweak(t.key)}
                compact
              >
                {t.label}
              </HodTag>
            ))}
          </div>
          {tweaks.length > 0 && (
            <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em', marginTop: 6 }}>
              AI WILL AVOID AGGRAVATING MOVEMENTS
            </div>
          )}
        </div>

        {/* ── PARTNER MODE ─────────────────────────────── */}
        <div style={{ marginTop: 18, marginBottom: 16 }}>
          <HodLabel style={{ marginBottom: 10 }}>PARTNER MODE</HodLabel>
          <button
            onClick={() => setPartnerMode(!partnerMode)}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 12px',
              background: partnerMode ? V('iron-800') : 'transparent',
              border: `1px solid ${partnerMode ? V('phos-500') : V('iron-700')}`,
              textAlign: 'left',
              transition: 'all 140ms ease',
            }}
          >
            <div style={{
              width: 14, height: 14, borderRadius: 7,
              border: `1px solid ${partnerMode ? V('phos-500') : V('iron-600')}`,
              background: partnerMode ? V('phos-500') : 'transparent',
              flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
              <div className="hod-display" style={{
                fontSize: 14, color: partnerMode ? V('bone') : V('bone-dim'),
                letterSpacing: '-0.01em',
              }}>
                {partnerMode ? '2-PERSON WORKOUT' : 'SOLO WORKOUT'}
              </div>
              <div className="hod-mono" style={{
                fontSize: 9, color: V('bone-faint'),
                letterSpacing: '0.18em', marginTop: 2,
              }}>
                {partnerMode
                  ? 'AI PICKS A "YOU GO I GO" FORMAT'
                  : 'TAP IF WORKING OUT WITH SOMEONE'}
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* ── BEGIN HOD BUTTON ────────────────────────────────── */}
      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, ${V('ink')} 60%, transparent)`,
      }}>
        <StartButton onClick={handleStart} />
        {onMarkRestDay && !todayIsDone && !todayIsRestDay && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            {!confirmRest ? (
              <button
                onClick={() => setConfirmRest(true)}
                className="hod-mono"
                style={{
                  fontSize: 10, color: V('bone-faint'), letterSpacing: '0.22em',
                  background: 'transparent', border: 'none', padding: '6px 10px',
                }}
              >
                · OR MARK TODAY AS REST DAY
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center', alignItems: 'center' }}>
                <span className="hod-mono" style={{ fontSize: 10, color: V('bone-dim'), letterSpacing: '0.18em' }}>
                  STREAK STAYS INTACT.
                </span>
                <button
                  onClick={() => { onMarkRestDay(); setConfirmRest(false); }}
                  className="hod-mono"
                  style={{
                    fontSize: 10, letterSpacing: '0.22em', fontWeight: 600,
                    color: V('ink'), background: V('phos-500'),
                    border: `1px solid ${V('phos-500')}`, padding: '6px 12px',
                  }}
                >
                  CONFIRM REST
                </button>
                <button
                  onClick={() => setConfirmRest(false)}
                  className="hod-mono"
                  style={{
                    fontSize: 10, letterSpacing: '0.22em',
                    color: V('bone-faint'), background: 'transparent',
                    border: `1px solid ${V('iron-700')}`, padding: '6px 10px',
                  }}
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        )}
        {todayIsRestDay && (
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <span className="hod-mono" style={{ fontSize: 10, color: V('phos-400'), letterSpacing: '0.22em' }}>
              · REST DAY LOGGED · STREAK PRESERVED
            </span>
          </div>
        )}
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

function timeAgo(ts) {
  const now = Date.now();
  const diff = Math.max(0, now - ts);
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function WeeklyStrip({ stats }) {
  const mins = Math.floor(stats.totalElapsed / 60);
  const hh = Math.floor(mins / 60);
  const mm = mins % 60;
  const timeStr = hh > 0 ? `${hh}H ${mm}M` : `${mm}M`;
  const mostly = stats.mostlyRating ? stats.mostlyRating.toUpperCase() : null;
  const tiles = [
    { label: 'WORKOUTS', value: stats.workouts, accent: stats.workouts > 0 },
    { label: 'REST', value: stats.restCount, accent: false },
    { label: 'TIME', value: timeStr, accent: stats.totalElapsed > 0 },
  ];
  if (stats.prs > 0) tiles.push({ label: 'NEW PR', value: stats.prs, accent: true });
  else if (mostly) tiles.push({ label: 'FELT', value: mostly, accent: mostly === 'SOLID' });
  else if (stats.topFormat) tiles.push({ label: 'TOP FORMAT', value: stats.topFormat, accent: false });

  return (
    <div style={{ marginBottom: 20 }}>
      <HodLabel style={{ marginBottom: 8 }}>· THIS WEEK</HodLabel>
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${tiles.length}, 1fr)`,
        gap: 6,
      }}>
        {tiles.map((t, i) => (
          <div key={i} style={{
            padding: '10px 8px',
            background: V('iron-900'),
            border: `1px solid ${V('iron-700')}`,
            textAlign: 'center',
          }}>
            <div className="hod-display hod-mono" style={{
              fontSize: 20, color: t.accent ? V('phos-400') : V('bone'),
              fontVariantNumeric: 'tabular-nums', lineHeight: 1,
              letterSpacing: '-0.01em',
            }}>
              {t.value}
            </div>
            <div className="hod-mono" style={{
              fontSize: 8, color: V('bone-faint'),
              letterSpacing: '0.18em', marginTop: 4,
            }}>
              {t.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FamilyWodCard({ wod, onStart }) {
  const { author, params, headline, partnered } = wod;
  return (
    <div style={{ marginBottom: 20 }}>
      <HodLabel style={{ color: V('phos-400'), marginBottom: 8 }}>
        · {partnered ? 'PARTNER WOD' : 'FAMILY WOD'} · FROM {author ? author.toUpperCase() : 'FAMILY'}
      </HodLabel>
      <button
        onClick={onStart}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 14px',
          background: V('iron-900'),
          border: `2px solid ${V('phos-500')}`,
          boxShadow: `0 0 20px -4px var(--phos-glow)`,
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 36, height: 36, flexShrink: 0,
          background: V('phos-500'),
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M9 2v14M2 9h14" stroke={V('ink')} strokeWidth="2.5" strokeLinecap="square" />
          </svg>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hod-display" style={{
            fontSize: 18, color: V('bone'), letterSpacing: '-0.01em',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {headline || `${params.style} · ${params.duration} MIN`}
          </div>
          <div className="hod-mono" style={{
            fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em', marginTop: 3,
          }}>
            {params.style.toUpperCase()} · {params.intensity} · {params.duration} MIN · SCALED FOR YOU
          </div>
        </div>
        <span className="hod-mono" style={{
          fontSize: 10, color: V('phos-400'), letterSpacing: '0.22em', fontWeight: 600,
        }}>
          DO IT →
        </span>
      </button>
    </div>
  );
}

function FamilyFeedStrip({ items }) {
  const today = todayISO();
  const todayItems = items.filter((it) => {
    const d = new Date(it.ts || 0);
    return todayISO(d) === today;
  });
  const shown = (todayItems.length > 0 ? todayItems : items).slice(0, 4);
  const headerLabel = todayItems.length > 0
    ? `· TODAY IN THE GARAGE · ${todayItems.length} DONE`
    : '· RECENT FAMILY ACTIVITY';

  return (
    <div style={{ marginBottom: 20 }}>
      <HodLabel style={{ color: V('phos-400'), marginBottom: 8 }}>{headerLabel}</HodLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {shown.map((it, i) => (
          <div
            key={it.id || i}
            style={{
              display: 'flex', alignItems: 'baseline', gap: 8,
              padding: '8px 10px',
              background: V('iron-900'),
              border: `1px solid ${V('iron-700')}`,
            }}
          >
            <span style={{
              width: 6, height: 6, background: V('phos-500'),
              boxShadow: `0 0 6px var(--phos-glow)`, flexShrink: 0,
              alignSelf: 'center',
            }} />
            <span className="hod-display" style={{
              fontSize: 13, color: V('bone'), letterSpacing: '-0.01em',
            }}>
              {(it.name || 'Someone').toUpperCase()}
            </span>
            <span className="hod-mono" style={{
              flex: 1, fontSize: 11, color: V('bone-dim'),
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            }}>
              · {it.headline || 'workout'} {it.elapsed ? `· ${String(Math.floor(it.elapsed / 60)).padStart(2, '0')}:${String(it.elapsed % 60).padStart(2, '0')}` : ''}
            </span>
            <span className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.1em', flexShrink: 0 }}>
              {timeAgo(it.ts || Date.now())}
            </span>
          </div>
        ))}
      </div>
    </div>
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
          const clickable = d.done && !d.isRest && onOpenDay;
          // Rest-only day: phosphor outline with a dashed inner stripe (not filled)
          // Workout day: solid phosphor fill
          // Today with nothing: phosphor dashed inset
          // Past empty: iron outline
          const border = d.isToday
            ? V('phos-400')
            : d.done
              ? V('phos-500')
              : V('iron-700');
          const bg = d.done && !d.isRest ? V('phos-500') : 'transparent';
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
              aria-label={clickable ? `Open workout detail for ${d.iso}` : d.isRest ? `Rest day on ${d.iso}` : undefined}
            >
              <div style={{
                width: '100%', aspectRatio: '1', maxWidth: 20,
                background: bg,
                border: `1px solid ${border}`,
                position: 'relative',
              }}>
                {d.isToday && !d.done && (
                  <div style={{ position: 'absolute', inset: 3, border: `1px dashed ${V('phos-400')}` }} />
                )}
                {d.isRest && !d.isToday && (
                  <div style={{
                    position: 'absolute', inset: 2,
                    borderTop: `1px dashed ${V('phos-500')}`,
                    borderBottom: `1px dashed ${V('phos-500')}`,
                  }} />
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
