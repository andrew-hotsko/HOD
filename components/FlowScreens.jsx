'use client';

import { useState, useEffect } from 'react';
import { V, HodLabel, HodButton, HodMark } from './atoms';
import { useWakeLock } from '@/lib/wakelock';
import { loadEquipment } from '@/lib/storage';

function buildWarmupProtocol(eq) {
  const items = [];
  items.push(eq.bike  ? 'Assault Bike — 2 min easy' : 'Jumping jacks — 2 min');
  items.push("World's greatest stretch ×6");
  items.push(eq.pullup ? 'Scap pull-ups ×10' : 'Band pull-aparts ×15');
  items.push('Air squats ×15');
  items.push(eq.barbell ? 'Empty bar warmup' : eq.db ? 'Light DB complex ×10' : 'Push-up + reach ×10');
  return items;
}

// ── WARMUP ────────────────────────────────────────────────
export function WarmupScreen({ onDone, onSkip }) {
  const [sec, setSec] = useState(300); // 5 min
  useWakeLock(true);

  useEffect(() => {
    if (sec <= 0) { onDone(); return; }
    const t = setTimeout(() => setSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');

  const [items, setItems] = useState([
    'Assault Bike — 2 min easy',
    "World's greatest stretch ×6",
    'Scap pull-ups ×10',
    'Air squats ×15',
    'Empty bar warmup',
  ]);
  useEffect(() => { setItems(buildWarmupProtocol(loadEquipment())); }, []);

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px' }}>
        <HodMark size="sm" showDate={false} />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div className="hod-label" style={{ color: V('phos-400') }}>PHASE 01 · WARMUP</div>
        <div className="hod-display" style={{
          fontSize: 56, color: V('bone'), marginTop: 8,
          lineHeight: 0.9, letterSpacing: '-0.02em',
        }}>
          PRIME.
        </div>
      </div>

      <div style={{ padding: '24px 20px 0', flex: 1 }}>
        <div style={{
          border: `1px solid ${V('iron-700')}`,
          background: V('iron-900'),
          padding: 16,
        }}>
          <HodLabel style={{ marginBottom: 10 }}>PROTOCOL</HodLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span className="hod-mono" style={{ fontSize: 10, color: V('iron-500'), letterSpacing: '0.1em' }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="hod-display" style={{ fontSize: 14, color: V('bone') }}>{it}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center', padding: '16px 20px 0' }}>
        <div className="hod-label">ADVANCES IN</div>
        <div className="hod-display hod-mono" style={{
          fontSize: 72, color: V('phos-400'), lineHeight: 0.85,
          fontVariantNumeric: 'tabular-nums',
          textShadow: '0 0 28px var(--phos-glow)',
        }}>
          {mm}:{ss}
        </div>
      </div>

      <div style={{
        padding: '16px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 10,
      }}>
        <HodButton onClick={onSkip} variant="ghost" size="md" style={{ flex: 1 }}>SKIP</HodButton>
        <HodButton onClick={onDone} size="md" style={{ flex: 2 }}>READY · START</HodButton>
      </div>
    </div>
  );
}

// ── FINISHER ──────────────────────────────────────────────
export function FinisherScreen({ config, onDone }) {
  const note = config.workout.finisher?.note || '3 min Assault Bike — max cal';
  const [sec, setSec] = useState(180);
  useWakeLock(true);

  useEffect(() => {
    if (sec <= 0) return;
    const t = setTimeout(() => setSec(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sec]);

  const mm = String(Math.floor(sec / 60)).padStart(2, '0');
  const ss = String(sec % 60).padStart(2, '0');

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
    }} className="hod-scanlines">
      <div style={{ padding: '12px 20px' }}>
        <HodMark size="sm" showDate={false} />
      </div>

      <div style={{ padding: '20px 20px 0' }}>
        <div className="hod-label" style={{ color: V('alert') }}>PHASE 03 · FINISHER</div>
        <div className="hod-display" style={{
          fontSize: 56, color: V('bone'), marginTop: 8,
          lineHeight: 0.9, letterSpacing: '-0.02em',
        }}>
          BURN OUT.
        </div>
      </div>

      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        justifyContent: 'center', alignItems: 'center', padding: '0 20px',
      }}>
        <div className="hod-display" style={{
          fontSize: 32, color: V('bone'),
          textAlign: 'center', lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>
          {note}
        </div>
        <div className="hod-display hod-mono" style={{
          fontSize: 140, color: V('phos-400'), lineHeight: 0.85,
          fontVariantNumeric: 'tabular-nums', marginTop: 30,
          textShadow: '0 0 40px var(--phos-glow)',
        }}>
          {mm}:{ss}
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}>
        <HodButton onClick={onDone} size="lg" full>FINISH HOD</HodButton>
      </div>
    </div>
  );
}
