// HOD — Generate screen (stamp-lock moment)
// Three fields lock in sequence, then the workout prints line-by-line like a
// receipt. ~1.8s total. Then auto-advance to Live.

const { useState: useStateGen, useEffect: useEffectGen } = React;

function GenerateScreen({ config, onReady }) {
  // Phases: 0-2 = stamp fields, 3 = print workout, 4 = ready
  const [phase, setPhase] = useStateGen(0);
  const [printedLines, setPrintedLines] = useStateGen(0);

  const { intensity, style, duration, workout } = config;
  const intenseLabel = INTENSITIES.find(i => i.key === intensity).label.toUpperCase();
  const styleLabel = STYLES[style].label.toUpperCase();

  const fields = [
    { label: 'INTENSITY', value: intenseLabel },
    { label: 'STYLE', value: styleLabel },
    { label: 'DURATION', value: `${duration} MIN` },
  ];

  useEffectGen(() => {
    const timers = [];
    // Stamp fields at 0, 280, 560ms
    timers.push(setTimeout(() => setPhase(1), 280));
    timers.push(setTimeout(() => setPhase(2), 560));
    timers.push(setTimeout(() => setPhase(3), 900));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Print lines one by one in phase 3
  useEffectGen(() => {
    if (phase < 3) return;
    const total = workout.main.items.length;
    if (printedLines >= total) {
      const t = setTimeout(() => onReady(), 650);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setPrintedLines(n => n + 1), 140);
    return () => clearTimeout(t);
  }, [phase, printedLines]);

  return (
    <div style={{
      height: '100%', background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 54,
    }} className="hod-grid-bg">

      <div style={{ padding: '12px 20px' }}>
        <HodMark size="sm" showDate={false} />
      </div>

      {/* LOCKING FIELDS */}
      <div style={{ padding: '20px 20px 0' }}>
        <div className="hod-label" style={{ color: V('phos-400'), marginBottom: 12 }}>
          · GENERATING HOD
          <span className="hod-blink" style={{ marginLeft: 6, color: V('phos-500') }}>█</span>
        </div>

        {fields.map((f, i) => (
          <StampField
            key={f.label}
            label={f.label}
            value={f.value}
            locked={phase > i}
          />
        ))}
      </div>

      <HodRule ticks style={{ margin: '24px 20px' }} />

      {/* WORKOUT PRINTOUT */}
      <div style={{ padding: '0 20px', flex: 1 }}>
        <div style={{
          opacity: phase >= 3 ? 1 : 0.25,
          transition: 'opacity 300ms ease',
        }}>
          <HodLabel style={{ color: V('phos-400') }}>
            {phase >= 3 ? workout.main.label : '...'}
          </HodLabel>
          <div className="hod-display" style={{
            fontSize: 30, color: V('bone'), marginTop: 6,
            letterSpacing: '-0.01em', lineHeight: 1,
          }}>
            {phase >= 3 ? workout.main.headline : '— — —'}
          </div>

          {phase >= 3 && (
            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {workout.main.items.map((item, i) => (
                <div
                  key={i}
                  style={{
                    opacity: i < printedLines ? 1 : 0,
                    transform: i < printedLines ? 'translateY(0)' : 'translateY(4px)',
                    transition: 'all 180ms ease',
                    display: 'flex', alignItems: 'baseline', gap: 12,
                  }}
                >
                  <span className="hod-mono" style={{
                    fontSize: 10, color: V('iron-500'), letterSpacing: '0.1em',
                  }}>
                    {String(i+1).padStart(2, '0')}
                  </span>
                  <span className="hod-display" style={{ fontSize: 16, color: V('bone'), flex: 1 }}>
                    {item.name}
                  </span>
                  <span className="hod-mono" style={{ fontSize: 12, color: V('bone-dim') }}>
                    {item.schemeReps ? item.schemeReps.join('-') : item.reps ? `${item.reps} ${item.unit}` : item.unit}
                  </span>
                  {item.load && item.load !== '—' && (
                    <span className="hod-mono" style={{ fontSize: 11, color: V('phos-400') }}>
                      {item.load}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
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

Object.assign(window, { GenerateScreen });
