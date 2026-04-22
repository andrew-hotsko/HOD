// HOD — Complete / Done screen (minimal — close the ritual)
const { useEffect: useEffectDone } = React;

function CompleteScreen({ config, onClose }) {
  return (
    <div style={{
      height: '100%', background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 54,
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px' }}>
        <HodMark size="sm" showDate={false} />
      </div>

      <div style={{ flex: 1, padding: '40px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
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

        <HodRule ticks style={{ margin: '32px 0 20px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <HodStat label="FORMAT" value={config.workout.main.label} size="sm" />
          <HodStat label="STYLE" value={config.workout.style.label.toUpperCase()} size="sm" />
          <HodStat label="DURATION" value={config.duration} unit="MIN" size="sm" />
          <HodStat label="INTENSITY" value={config.workout.intensity.label.toUpperCase()} size="sm" accent />
        </div>
      </div>

      <div style={{ padding: '12px 16px 36px' }}>
        <HodButton onClick={onClose} full size="lg">BACK TO TODAY</HodButton>
      </div>
    </div>
  );
}

Object.assign(window, { CompleteScreen });
