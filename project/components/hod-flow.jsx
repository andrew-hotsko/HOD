// HOD — additional flow screens: Warmup, Finisher, Pause overlay, SetRest, HistoryStrip
// Kept in one file to minimize router wiring.

const { useState: useStateFlow, useEffect: useEffectFlow, useRef: useRefFlow } = React;

// ── WARMUP ────────────────────────────────────────────────
// Pre-workout. Simple list with a countdown. Skip or auto-advance.
function WarmupScreen({ config, onDone, onSkip }) {
  const [sec, setSec] = useStateFlow(300); // 5 min
  useEffectFlow(() => {
    if (sec <= 0) { onDone(); return; }
    const t = setTimeout(() => setSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);
  const mm = String(Math.floor(sec/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');

  const items = [
    'Assault Bike — 2 min easy',
    'World\'s greatest stretch ×6',
    'Scap pull-ups ×10',
    'Air squats ×15',
    'Empty bar warmup',
  ];

  return (
    <div style={{ height:'100%', background:V('ink'), display:'flex', flexDirection:'column', paddingTop:54 }} className="hod-grid-bg">
      <div style={{ padding:'12px 20px' }}><HodMark size="sm" showDate={false}/></div>
      <div style={{ padding:'20px 20px 0' }}>
        <div className="hod-label" style={{ color:V('phos-400') }}>PHASE 01 · WARMUP</div>
        <div className="hod-display" style={{ fontSize:56, color:V('bone'), marginTop:8, lineHeight:0.9, letterSpacing:'-0.02em' }}>
          PRIME.
        </div>
      </div>
      <div style={{ padding:'24px 20px 0', flex:1 }}>
        <div style={{ border:`1px solid ${V('iron-700')}`, background:V('iron-900'), padding:16 }}>
          <div className="hod-label" style={{ marginBottom:10 }}>PROTOCOL</div>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {items.map((it,i) => (
              <div key={i} style={{ display:'flex', alignItems:'baseline', gap:10 }}>
                <span className="hod-mono" style={{ fontSize:10, color:V('iron-500'), letterSpacing:'0.1em' }}>{String(i+1).padStart(2,'0')}</span>
                <span className="hod-display" style={{ fontSize:14, color:V('bone') }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ textAlign:'center', padding:'16px 20px 0' }}>
        <div className="hod-label">ADVANCES IN</div>
        <div className="hod-display hod-mono" style={{ fontSize:72, color:V('phos-400'), lineHeight:0.85, fontVariantNumeric:'tabular-nums', textShadow:`0 0 28px ${V('phos-glow')}` }}>
          {mm}:{ss}
        </div>
      </div>
      <div style={{ padding:'16px 16px 36px', display:'flex', gap:10 }}>
        <HodButton onClick={onSkip} variant="ghost" size="md" style={{ flex:1 }}>SKIP</HodButton>
        <HodButton onClick={onDone} size="md" style={{ flex:2 }}>READY · START</HodButton>
      </div>
    </div>
  );
}

// ── FINISHER ──────────────────────────────────────────────
function FinisherScreen({ config, onDone }) {
  const note = config.workout.finisher?.note || '3 min Assault Bike — max cal';
  const [sec, setSec] = useStateFlow(180);
  useEffectFlow(() => {
    if (sec<=0) return;
    const t = setTimeout(() => setSec(s=>s-1),1000);
    return () => clearTimeout(t);
  }, [sec]);
  const mm = String(Math.floor(sec/60)).padStart(2,'0');
  const ss = String(sec%60).padStart(2,'0');
  return (
    <div style={{ height:'100%', background:V('ink'), display:'flex', flexDirection:'column', paddingTop:54 }} className="hod-scanlines">
      <div style={{ padding:'12px 20px' }}><HodMark size="sm" showDate={false}/></div>
      <div style={{ padding:'20px 20px 0' }}>
        <div className="hod-label" style={{ color:V('alert') }}>PHASE 03 · FINISHER</div>
        <div className="hod-display" style={{ fontSize:56, color:V('bone'), marginTop:8, lineHeight:0.9, letterSpacing:'-0.02em' }}>
          BURN OUT.
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'0 20px' }}>
        <div className="hod-display" style={{ fontSize:32, color:V('bone'), textAlign:'center', lineHeight:1.05, letterSpacing:'-0.01em' }}>
          {note}
        </div>
        <div className="hod-display hod-mono" style={{ fontSize:140, color:V('phos-400'), lineHeight:0.85, fontVariantNumeric:'tabular-nums', marginTop:30, textShadow:`0 0 40px ${V('phos-glow')}` }}>
          {mm}:{ss}
        </div>
      </div>
      <div style={{ padding:'12px 16px 36px' }}>
        <HodButton onClick={onDone} size="lg" full>FINISH HOD</HodButton>
      </div>
    </div>
  );
}

// ── PAUSE OVERLAY ─────────────────────────────────────────
// Full-bleed "HOLD" — large resume + exit buttons.
function PauseOverlay({ elapsed, onResume, onExit }) {
  const mm = String(Math.floor(elapsed/60)).padStart(2,'0');
  const ss = String(elapsed%60).padStart(2,'0');
  return (
    <div style={{
      position:'absolute', inset:0, zIndex:50,
      background:'rgba(5,6,5,0.94)',
      backdropFilter:'blur(16px)',
      WebkitBackdropFilter:'blur(16px)',
      display:'flex', flexDirection:'column', paddingTop:54,
    }} className="hod-grid-bg">
      <div style={{ padding:'12px 20px' }}><HodMark size="sm" showDate={false}/></div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 24px' }}>
        <div className="hod-label" style={{ color:V('phos-400'), letterSpacing:'0.32em', marginBottom:16 }}>· HOLD</div>
        <div className="hod-display" style={{ fontSize:96, lineHeight:0.85, color:V('bone'), letterSpacing:'-0.03em' }}>
          PAUSED.
        </div>
        <div style={{ marginTop:32 }}>
          <div className="hod-label">ELAPSED AT PAUSE</div>
          <div className="hod-display hod-mono" style={{ fontSize:56, color:V('bone-dim'), fontVariantNumeric:'tabular-nums', letterSpacing:'-0.02em', marginTop:4 }}>
            {mm}:{ss}
          </div>
        </div>
      </div>
      <div style={{ padding:'16px 16px 36px', display:'flex', flexDirection:'column', gap:10 }}>
        <HodButton onClick={onResume} size="lg" full>RESUME</HodButton>
        <HodButton onClick={onExit} variant="ghost" size="md" full>SCRAP WORKOUT</HodButton>
      </div>
    </div>
  );
}

// ── SET REST SCREEN ──────────────────────────────────────
// Between strength sets. Big rest timer, next-set preview.
function SetRestScreen({ setNum, totalSets, nextLoad, onContinue, duration = 90 }) {
  const [sec, setSec] = useStateFlow(duration);
  useEffectFlow(() => {
    if (sec<=0) return;
    const t = setTimeout(() => setSec(s=>s-1), 1000);
    return () => clearTimeout(t);
  }, [sec]);
  const done = sec <= 0;

  return (
    <div style={{ height:'100%', background:done?V('phos-900'):V('ink'), display:'flex', flexDirection:'column', paddingTop:54, transition:'background 400ms ease' }}>
      <div style={{ padding:'12px 20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline' }}>
          <HodMark size="sm" showDate={false} accent={!done}/>
          <span className="hod-label" style={{ color:done?V('phos-300'):V('bone-faint') }}>
            SET {setNum}/{totalSets} COMPLETE
          </span>
        </div>
      </div>
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', padding:'0 20px' }}>
        <div className="hod-label" style={{ color:done?V('phos-300'):V('phos-400'), marginBottom:8 }}>
          {done ? '· GO NOW' : 'REST'}
        </div>
        <div className="hod-display hod-mono" style={{
          fontSize:200, lineHeight:0.85, fontWeight:700,
          color:done?V('bone'):V('phos-400'),
          fontVariantNumeric:'tabular-nums', letterSpacing:'-0.04em',
          textShadow:`0 0 40px ${done?V('phos-glow'):V('phos-glow')}`,
        }}>
          {String(Math.max(0,sec)).padStart(2,'0')}
        </div>
        <div style={{ marginTop:40, padding:'16px 20px', border:`1px solid ${V('iron-700')}`, background:V('iron-900'), minWidth:260 }}>
          <HodLabel style={{ marginBottom:4 }}>NEXT SET</HodLabel>
          <div className="hod-display" style={{ fontSize:28, color:V('bone') }}>5 REPS</div>
          {nextLoad && <div className="hod-mono" style={{ fontSize:14, color:V('phos-400'), marginTop:2 }}>{nextLoad}</div>}
        </div>
      </div>
      <div style={{ padding:'12px 16px 36px' }}>
        <HodButton onClick={onContinue} size="lg" full variant={done?'primary':'ghost'}>
          {done ? 'START SET' : 'SKIP REST'}
        </HodButton>
      </div>
    </div>
  );
}

// ── HISTORY STRIP (for Today screen) ─────────────────────
// Week-strip of recent days. Filled = completed HOD.
function HistoryStrip({ history }) {
  // history: array of last 14 days, boolean "completed"
  const today = new Date();
  const days = Array.from({ length: 14 }).map((_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return {
      date: d,
      dow: ['S','M','T','W','T','F','S'][d.getDay()],
      dd: d.getDate(),
      done: history[i] || false,
      today: i === 13,
    };
  });
  const streak = (() => {
    let s = 0;
    for (let i = history.length - 1; i >= 0; i--) {
      if (history[i]) s++;
      else break;
    }
    return s;
  })();

  return (
    <div style={{ padding:'0 20px', marginBottom:20 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:8 }}>
        <HodLabel>14 DAYS</HodLabel>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <span style={{ width:6, height:6, background:V('phos-500'), boxShadow:`0 0 6px ${V('phos-glow')}` }}/>
          <span className="hod-mono" style={{ fontSize:10, color:V('bone-dim'), letterSpacing:'0.18em' }}>
            {streak} DAY STREAK
          </span>
        </div>
      </div>
      <div style={{ display:'flex', gap:3 }}>
        {days.map((d,i) => (
          <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:3 }}>
            <div style={{
              width:'100%', aspectRatio:'1', maxWidth:20,
              background: d.done ? V('phos-500') : 'transparent',
              border: `1px solid ${d.today ? V('phos-400') : d.done ? V('phos-500') : V('iron-700')}`,
              position:'relative',
            }}>
              {d.today && !d.done && (
                <div style={{ position:'absolute', inset:3, border:`1px dashed ${V('phos-400')}` }}/>
              )}
            </div>
            <span className="hod-mono" style={{ fontSize:8, color: d.today ? V('phos-400') : V('iron-500'), letterSpacing:'0.1em' }}>
              {d.dd}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { WarmupScreen, FinisherScreen, PauseOverlay, SetRestScreen, HistoryStrip });
