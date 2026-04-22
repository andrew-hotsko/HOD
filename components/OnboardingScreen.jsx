'use client';

import { useState } from 'react';
import { V, HodLabel, HodButton, HodRule, HodMark } from './atoms';
import { DEFAULT_EQUIPMENT, saveEquipment } from '@/lib/storage';

const EQUIPMENT_ITEMS = [
  { key: 'barbell', label: 'Barbell', note: 'With plate pairs: 10 / 25 / 35 / 45 lb' },
  { key: 'rack',    label: 'Squat rack' },
  { key: 'bench',   label: 'Bench', note: 'Incline / decline' },
  { key: 'bike',    label: 'Assault Bike' },
  { key: 'cable',   label: 'Cable pulley' },
  { key: 'kb',      label: 'Kettlebell', note: 'Adjustable 8–40 lb' },
  { key: 'db',      label: 'Dumbbells', note: 'Adjustable 2.5–52.5 lb pairs' },
  { key: 'pullup',  label: 'Pull-up bar' },
  { key: 'vest',    label: 'Weighted vest', note: '50 lb' },
];

export default function OnboardingScreen({ onDone }) {
  const [eq, setEq] = useState({ ...DEFAULT_EQUIPMENT });

  const toggle = (key) => setEq(prev => ({ ...prev, [key]: !prev[key] }));

  const finish = () => {
    saveEquipment(eq);
    onDone();
  };

  const selectedCount = Object.values(eq).filter(Boolean).length;

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      overflow: 'hidden',
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px' }}>
        <HodMark size="sm" showDate={false} />
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <div className="hod-label" style={{ color: V('phos-400'), letterSpacing: '0.32em' }}>
          · INTAKE
        </div>
        <div className="hod-display" style={{
          fontSize: 48, lineHeight: 0.9, color: V('bone'),
          letterSpacing: '-0.02em', marginTop: 8,
        }}>
          YOUR KIT.
        </div>
        <div style={{
          fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-dim'),
          marginTop: 10, maxWidth: 320,
        }}>
          What's in your garage? We'll only prescribe movements you can actually do.
        </div>
      </div>

      <HodRule ticks style={{ margin: '18px 20px 6px' }} />

      <div style={{ padding: '8px 20px 0', flex: 1, overflowY: 'auto' }} className="hod-no-scrollbar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {EQUIPMENT_ITEMS.map(item => (
            <button
              key={item.key}
              onClick={() => toggle(item.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 0',
                borderBottom: `1px dashed ${V('iron-700')}`,
                textAlign: 'left',
              }}
            >
              <div style={{
                width: 18, height: 18,
                border: `1px solid ${eq[item.key] ? V('phos-500') : V('iron-600')}`,
                background: eq[item.key] ? V('phos-500') : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 140ms ease',
                flexShrink: 0,
              }}>
                {eq[item.key] && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                    <path d="M1 5l3 3 7-7" stroke={V('ink')} strokeWidth="2" strokeLinecap="square" />
                  </svg>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div className="hod-display" style={{
                  fontSize: 18, color: eq[item.key] ? V('bone') : V('bone-faint'),
                  letterSpacing: '-0.01em',
                }}>
                  {item.label}
                </div>
                {item.note && (
                  <div className="hod-mono" style={{
                    fontSize: 10, color: V('bone-faint'),
                    letterSpacing: '0.14em', marginTop: 2,
                  }}>
                    {item.note}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        <div style={{ marginTop: 20, paddingBottom: 12 }}>
          <HodLabel style={{ color: V('bone-faint') }}>
            {selectedCount} {selectedCount === 1 ? 'ITEM' : 'ITEMS'} SELECTED · CAN EDIT LATER
          </HodLabel>
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, ${V('ink')} 70%, transparent)`,
      }}>
        <HodButton onClick={finish} size="lg" full disabled={selectedCount === 0}>
          START · BEGIN HOD
        </HodButton>
      </div>
    </div>
  );
}
