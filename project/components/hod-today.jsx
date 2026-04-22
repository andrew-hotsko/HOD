// HOD — Today screen
// The opening beat. Date stamp, today's brief, dial-in controls, big START.
// Leans "briefing / orders for the day."

const { useState: useStateToday, useEffect: useEffectToday, useMemo: useMemoToday } = React;

function TodayScreen({ onStart, tweaks }) {
  // Dial-in state — three fields the user locks before generating
  const [intensity, setIntensity] = useStateToday('HARD');
  const [style, setStyle] = useStateToday('CROSSFIT');
  const [duration, setDuration] = useStateToday(30);

  // Generated preview updates live so the user sees what their picks produce
  const workout = useMemoToday(
    () => generateHOD({ intensity, style, duration }),
    [intensity, style, duration]
  );

  const today = new Date();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const yy = String(today.getFullYear()).slice(-2);
  const dow = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][today.getDay()];

  const handleStart = () => onStart({ intensity, style, duration, workout });

  return (
    <div style={{
      height: '100%', background: V('ink'), color: V('bone'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 54, // space under status bar
    }} className="hod-grid-bg hod-no-scrollbar">

      {/* ── HEADER: brand mark + profile ──────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '8px 20px 0',
      }}>
        <HodMark size="sm" showDate={false} />
        <div style={{
          width: 32, height: 32,
          border: `1px solid ${V('iron-700')}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="hod-mono" style={{ fontSize: 11, color: V('bone-dim'), letterSpacing: '0.05em' }}>H</span>
        </div>
      </div>

      {/* ── DATE STAMP ───────────────────────────────────── */}
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
          <div className="hod-mono" style={{
            fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em',
          }}>
            DAY {Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 86400000).toString().padStart(3, '0')}/365
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
              fontSize: 11, color: V('bone-faint'), letterSpacing: '0.18em',
              marginTop: 2,
            }}>
              {mm} · {yy} · W{Math.ceil((today.getDate()) / 7)}
            </div>
          </div>
        </div>
      </div>

      {/* ── TODAY'S SPEC (live preview of the workout) ──── */}
      <div style={{ padding: '24px 20px 0', flex: 1, overflowY: 'auto' }} className="hod-no-scrollbar">
        {tweaks?.showHistory !== false && <HistoryStrip history={tweaks?.history || [true,true,false,true,true,true,false,true,true,true,true,false,true,false]} />}
        <HodLabel style={{ marginBottom: 10 }}>TODAY · YOUR HOD</HodLabel>

        <div style={{
          border: `1px solid ${V('iron-700')}`,
          background: V('iron-900'),
          padding: '18px 16px',
          position: 'relative',
        }}>
          {/* corner registration marks */}
          <HodReg style={{ position: 'absolute', top: -5, left: -5 }} />
          <HodReg style={{ position: 'absolute', top: -5, right: -5 }} />
          <HodReg style={{ position: 'absolute', bottom: -5, left: -5 }} />
          <HodReg style={{ position: 'absolute', bottom: -5, right: -5 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div className="hod-label" style={{ color: V('phos-400') }}>
              {workout.style.label.toUpperCase()} · {workout.format}
            </div>
            <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em' }}>
              {duration} MIN
            </div>
          </div>

          <div className="hod-display" style={{
            fontSize: 26, marginTop: 6, color: V('bone'),
            letterSpacing: '-0.01em', lineHeight: 1.05,
          }}>
            {workout.main.headline}
          </div>

          <div style={{
            fontFamily: 'var(--f-ui)',
            fontSize: 12, color: V('bone-dim'), marginTop: 6,
          }}>
            {workout.main.description}
          </div>

          <HodRule ticks style={{ margin: '14px 0 12px' }} />

          {/* Movement list preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {workout.main.items.slice(0, 4).map((item, i) => (
              <MovementRow key={i} item={item} idx={i} />
            ))}
            {workout.main.items.length > 4 && (
              <div className="hod-mono" style={{ fontSize: 11, color: V('bone-faint'), letterSpacing: '0.12em', paddingLeft: 22 }}>
                + {workout.main.items.length - 4} MORE
              </div>
            )}
          </div>
        </div>

        {/* ── PICKERS ─────────────────────────────────── */}
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

      {/* ── START BUTTON ──────────────────────────────── */}
      <div style={{
        padding: '12px 16px 36px',
        background: `linear-gradient(to top, ${V('ink')} 60%, transparent)`,
      }}>
        <StartButton onClick={handleStart} />
      </div>
    </div>
  );
}

// Compact movement row for the Today preview
function MovementRow({ item, idx }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
      <div className="hod-mono" style={{
        width: 18, fontSize: 10, color: V('iron-500'), letterSpacing: '0.1em',
      }}>
        {String(idx + 1).padStart(2, '0')}
      </div>
      <div className="hod-display" style={{ flex: 1, fontSize: 14, color: V('bone') }}>
        {item.name}
      </div>
      <div className="hod-mono" style={{ fontSize: 12, color: V('bone-dim') }}>
        {item.schemeReps ? item.schemeReps.join('-') :
         item.reps ? `${item.reps} ${item.unit}` :
         item.unit}
      </div>
      {item.load && item.load !== '—' && (
        <div className="hod-mono" style={{ fontSize: 11, color: V('phos-400'), minWidth: 62, textAlign: 'right' }}>
          {item.load}
        </div>
      )}
    </div>
  );
}

// Big START button — "arm / fire" vibe
function StartButton({ onClick }) {
  const [armed, setArmed] = useStateToday(false);
  useEffectToday(() => {
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
        position: 'relative', overflow: 'hidden',
        fontFamily: 'var(--f-display)',
        boxShadow: armed ? '0 0 32px -4px rgba(132, 204, 22, 0.5)' : 'none',
        transition: 'box-shadow 400ms ease',
      }}
    >
      {/* tick marks on left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <div style={{ width: 12, height: 1, background: V('ink') }} />
        <div style={{ width: 8,  height: 1, background: V('ink') }} />
        <div style={{ width: 12, height: 1, background: V('ink') }} />
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: '0.3em', lineHeight: 1 }}>
          BEGIN HOD
        </div>
        <div className="hod-mono" style={{
          fontSize: 9, color: V('ink'), opacity: 0.7, letterSpacing: '0.18em', marginTop: 4,
        }}>
          PRESS TO GENERATE
        </div>
      </div>

      {/* tick marks on right */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3, alignItems: 'flex-end' }}>
        <div style={{ width: 12, height: 1, background: V('ink') }} />
        <div style={{ width: 8,  height: 1, background: V('ink') }} />
        <div style={{ width: 12, height: 1, background: V('ink') }} />
      </div>
    </button>
  );
}

Object.assign(window, { TodayScreen });
