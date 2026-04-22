// HOD — Tweaks panel. Wired into host edit-mode toggle.
const { useState: useStateTweaks, useEffect: useEffectTweaks } = React;

function TweaksPanel({ tweaks, setTweaks }) {
  const [visible, setVisible] = useStateTweaks(false);

  useEffectTweaks(() => {
    const handler = (e) => {
      if (e.data?.type === '__activate_edit_mode') setVisible(true);
      if (e.data?.type === '__deactivate_edit_mode') setVisible(false);
    };
    window.addEventListener('message', handler);
    // announce availability AFTER listener is wired
    window.parent.postMessage({ type: '__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const update = (k, v) => {
    setTweaks({ ...tweaks, [k]: v });
    window.parent.postMessage({
      type: '__edit_mode_set_keys',
      edits: { [k]: v },
    }, '*');
  };

  if (!visible) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 16, right: 16, zIndex: 100,
      width: 260, background: V('iron-900'),
      border: `1px solid ${V('iron-700')}`,
      color: V('bone'),
      fontFamily: 'var(--f-mono)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 14px',
        borderBottom: `1px solid ${V('iron-700')}`,
        background: V('iron-950'),
      }}>
        <div className="hod-label" style={{ color: V('phos-400') }}>TWEAKS</div>
        <div className="hod-mono" style={{ fontSize: 9, color: V('bone-faint'), letterSpacing: '0.2em' }}>HOD</div>
      </div>

      <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* ACCENT */}
        <div>
          <div className="hod-label" style={{ marginBottom: 6 }}>ACCENT</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { k: 'hazard', c: '#84cc16', label: 'HAZARD' },
              { k: 'ember',  c: '#ff5a1f', label: 'EMBER' },
              { k: 'iron',   c: '#dc2626', label: 'IRON' },
              { k: 'bone',   c: '#e8e6dd', label: 'BONE' },
            ].map(o => (
              <button key={o.k}
                onClick={() => update('accent', o.k)}
                style={{
                  flex: 1, height: 34,
                  background: tweaks.accent === o.k ? o.c : 'transparent',
                  border: `1px solid ${tweaks.accent === o.k ? o.c : V('iron-700')}`,
                  color: tweaks.accent === o.k ? '#000' : V('bone-dim'),
                  fontFamily: 'var(--f-mono)', fontSize: 9,
                  letterSpacing: '0.15em',
                }}
              >{o.label}</button>
            ))}
          </div>
        </div>

        {/* DISPLAY TYPE */}
        <div>
          <div className="hod-label" style={{ marginBottom: 6 }}>DISPLAY FACE</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { k: 'oswald',    label: 'OSWALD' },
              { k: 'barlow',    label: 'BARLOW' },
              { k: 'anton',     label: 'ANTON' },
            ].map(o => (
              <button key={o.k}
                onClick={() => update('display', o.k)}
                style={{
                  flex: 1, height: 34,
                  background: tweaks.display === o.k ? V('phos-500') : 'transparent',
                  border: `1px solid ${tweaks.display === o.k ? V('phos-500') : V('iron-700')}`,
                  color: tweaks.display === o.k ? V('ink') : V('bone-dim'),
                  fontFamily: 'var(--f-mono)', fontSize: 9,
                  letterSpacing: '0.15em',
                }}
              >{o.label}</button>
            ))}
          </div>
        </div>

        {/* LIVE LAYOUT */}
        <div>
          <div className="hod-label" style={{ marginBottom: 6 }}>LIVE LAYOUT</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { k: 'adaptive', label: 'ADAPTIVE (PER FORMAT)' },
              { k: 'clock',    label: 'CLOCK-DOMINANT' },
              { k: 'rounds',   label: 'ROUNDS-DOMINANT' },
              { k: 'movement', label: 'MOVEMENT-DOMINANT' },
            ].map(o => (
              <button key={o.k}
                onClick={() => update('liveLayout', o.k)}
                style={{
                  height: 30,
                  background: tweaks.liveLayout === o.k ? V('phos-500') : 'transparent',
                  border: `1px solid ${tweaks.liveLayout === o.k ? V('phos-500') : V('iron-700')}`,
                  color: tweaks.liveLayout === o.k ? V('ink') : V('bone-dim'),
                  fontFamily: 'var(--f-mono)', fontSize: 9,
                  letterSpacing: '0.15em',
                  textAlign: 'left', padding: '0 10px',
                }}
              >{o.label}</button>
            ))}
          </div>
        </div>

        {/* TODAY MOMENT */}
        <div>
          <div className="hod-label" style={{ marginBottom: 6 }}>START SCREEN</div>
          <div style={{ display: 'flex', gap: 6 }}>
            {[
              { k: 'briefing', label: 'BRIEFING' },
              { k: 'quiet',    label: 'QUIET' },
            ].map(o => (
              <button key={o.k}
                onClick={() => update('todayMood', o.k)}
                style={{
                  flex: 1, height: 30,
                  background: tweaks.todayMood === o.k ? V('phos-500') : 'transparent',
                  border: `1px solid ${tweaks.todayMood === o.k ? V('phos-500') : V('iron-700')}`,
                  color: tweaks.todayMood === o.k ? V('ink') : V('bone-dim'),
                  fontFamily: 'var(--f-mono)', fontSize: 9,
                  letterSpacing: '0.15em',
                }}
              >{o.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { TweaksPanel });
