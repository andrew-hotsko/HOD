'use client';

import { useState, useEffect } from 'react';
import { V, HodLabel, HodButton, HodRule, HodMark } from './atoms';
import { DEFAULT_PROFILE, ROLE_DEFS, loadProfile, saveProfile } from '@/lib/storage';

export default function ProfileScreen({ mode = 'onboarding', onDone, onNext, onCancel }) {
  const isEdit = mode === 'edit';
  const [profile, setProfile] = useState({ ...DEFAULT_PROFILE });

  useEffect(() => {
    if (isEdit) setProfile(loadProfile());
  }, [isEdit]);

  const update = (patch) => setProfile((p) => ({ ...p, ...patch }));

  const finish = () => {
    const trimmed = {
      ...profile,
      name: (profile.name || '').trim(),
      notes: (profile.notes || '').trim(),
    };
    saveProfile(trimmed);
    if (isEdit) onDone?.();
    else onNext?.(trimmed);
  };

  const canContinue = (profile.name || '').trim().length > 0;

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      overflow: 'hidden',
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <HodMark size="sm" showDate={false} />
        {isEdit && onCancel && (
          <button
            onClick={onCancel}
            className="hod-mono"
            style={{
              fontSize: 10, color: V('bone-faint'), letterSpacing: '0.22em',
              border: `1px solid ${V('iron-700')}`, padding: '6px 12px',
            }}
          >
            ← BACK
          </button>
        )}
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <div className="hod-label" style={{ color: V('phos-400'), letterSpacing: '0.32em' }}>
          · {isEdit ? 'PROFILE' : 'STEP 1 / 2'}
        </div>
        <div className="hod-display" style={{
          fontSize: 48, lineHeight: 0.9, color: V('bone'),
          letterSpacing: '-0.02em', marginTop: 8,
        }}>
          WHO'S THIS?
        </div>
        <div style={{
          fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-dim'),
          marginTop: 10, maxWidth: 320,
        }}>
          Workouts get tailored to you — loads, vocabulary, safety rules.
          Change anytime from settings.
        </div>
      </div>

      <HodRule ticks style={{ margin: '18px 20px 6px' }} />

      <div style={{ padding: '8px 20px 0', flex: 1, overflowY: 'auto' }} className="hod-no-scrollbar">
        {/* NAME ──────────────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <HodLabel style={{ marginBottom: 8 }}>NAME</HodLabel>
          <input
            type="text"
            value={profile.name}
            onChange={(e) => update({ name: e.target.value })}
            placeholder="What should we call you?"
            maxLength={30}
            className="hod-display"
            style={{
              width: '100%',
              background: V('iron-900'),
              color: V('bone'),
              border: `1px solid ${V('iron-700')}`,
              padding: '14px 14px',
              fontSize: 20,
              letterSpacing: '-0.01em',
              outline: 'none',
            }}
          />
        </div>

        {/* ROLE ──────────────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <HodLabel style={{ marginBottom: 8 }}>ROLE</HodLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(ROLE_DEFS).map(([key, def]) => {
              const selected = profile.role === key;
              return (
                <button
                  key={key}
                  onClick={() => update({ role: key })}
                  style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    padding: '12px 12px',
                    background: selected ? V('iron-800') : 'transparent',
                    border: `1px solid ${selected ? V('phos-500') : V('iron-700')}`,
                    textAlign: 'left',
                    transition: 'all 140ms ease',
                  }}
                >
                  <div style={{
                    width: 14, height: 14,
                    border: `1px solid ${selected ? V('phos-500') : V('iron-600')}`,
                    background: selected ? V('phos-500') : 'transparent',
                    borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  }} />
                  <div style={{ flex: 1 }}>
                    <div className="hod-display" style={{
                      fontSize: 16, color: selected ? V('bone') : V('bone-dim'),
                      letterSpacing: '-0.01em',
                    }}>
                      {def.label}
                    </div>
                    <div className="hod-mono" style={{
                      fontSize: 10, color: V('bone-faint'),
                      letterSpacing: '0.14em', marginTop: 3,
                    }}>
                      {def.hint}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* NOTES ──────────────────────────────────── */}
        <div style={{ marginBottom: 22 }}>
          <HodLabel style={{ marginBottom: 8 }}>ANYTHING TO AVOID? <span style={{ color: V('bone-faint'), letterSpacing: '0.18em' }}>(OPTIONAL)</span></HodLabel>
          <textarea
            value={profile.notes}
            onChange={(e) => update({ notes: e.target.value })}
            placeholder="Shoulder surgery last year · lower back · pregnancy · whatever matters"
            maxLength={200}
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
        </div>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        background: `linear-gradient(to top, ${V('ink')} 70%, transparent)`,
      }}>
        <HodButton
          onClick={finish}
          size="lg"
          full
          disabled={!canContinue}
        >
          {isEdit ? 'SAVE PROFILE' : 'NEXT · YOUR KIT →'}
        </HodButton>
      </div>
    </div>
  );
}
