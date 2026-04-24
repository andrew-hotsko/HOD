'use client';

import { useEffect, useState } from 'react';
import { V, HodLabel, HodButton, HodRule, HodMark } from './atoms';
import {
  loadVoiceSettings, saveVoiceSettings, voicePreview, cancelVoice,
} from '@/lib/voice';

const PERSONAS = [
  { key: 'neutral', label: 'NEUTRAL', note: 'Factual, short — "Next: thruster, 10 reps."' },
  { key: 'drill',   label: 'DRILL',   note: 'Imperative, stay-hard — "Thruster. 10. Move."' },
];

const RATES = [
  { key: 0.95, label: 'STEADY' },
  { key: 1.10, label: 'NORMAL' },
  { key: 1.25, label: 'FAST' },
];

export default function VoiceScreen({ onDone, onCancel }) {
  const [settings, setSettings] = useState(loadVoiceSettings());

  useEffect(() => {
    // Stop any in-flight preview if the screen unmounts
    return () => cancelVoice();
  }, []);

  const update = (patch) => {
    const next = saveVoiceSettings(patch);
    setSettings(next);
  };

  const toggleEnabled = () => {
    const next = !settings.enabled;
    update({ enabled: next });
    if (next) setTimeout(() => voicePreview(), 100);
  };

  const supported = typeof window !== 'undefined' && !!window.speechSynthesis;

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
      overflow: 'hidden',
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <HodMark size="sm" showDate={false} />
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
      </div>

      <div style={{ padding: '8px 20px 0' }}>
        <div className="hod-label" style={{ color: V('phos-400'), letterSpacing: '0.32em' }}>
          · VOICE COACH
        </div>
        <div className="hod-display" style={{
          fontSize: 44, lineHeight: 0.9, color: V('bone'),
          marginTop: 8, letterSpacing: '-0.02em',
        }}>
          EYES ON THE BAR.
        </div>
        <div style={{
          fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-dim'),
          marginTop: 10, maxWidth: 340,
        }}>
          Spoken minute boundaries, countdowns, and movement calls so you
          can keep your hands on the bar and your eyes off the phone.
        </div>
      </div>

      <HodRule ticks style={{ margin: '22px 20px 6px' }} />

      <div style={{ padding: '12px 20px 0', flex: 1, overflowY: 'auto' }} className="hod-no-scrollbar">
        {!supported && (
          <div style={{
            padding: 12, marginBottom: 16,
            border: `1px solid ${V('alert')}`, background: V('iron-900'),
          }}>
            <div className="hod-mono" style={{ fontSize: 10, color: V('alert'), letterSpacing: '0.22em' }}>
              · UNSUPPORTED
            </div>
            <div style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-dim'), marginTop: 4 }}>
              This browser doesn't expose Web Speech API. Voice coach will stay silent.
            </div>
          </div>
        )}

        {/* Enable toggle */}
        <button
          onClick={toggleEnabled}
          disabled={!supported}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 14,
            padding: '14px 12px', marginBottom: 22,
            background: settings.enabled ? V('iron-800') : 'transparent',
            border: `1px solid ${settings.enabled ? V('phos-500') : V('iron-700')}`,
            textAlign: 'left',
            opacity: supported ? 1 : 0.4,
            transition: 'all 140ms ease',
          }}
        >
          <div style={{ flex: 1 }}>
            <div className="hod-mono" style={{ fontSize: 9, color: V('phos-400'), letterSpacing: '0.22em' }}>
              VOICE COACH
            </div>
            <div className="hod-display" style={{ fontSize: 16, color: V('bone'), letterSpacing: '-0.01em', marginTop: 2 }}>
              {settings.enabled ? 'ON · COACHING LIVE WORKOUTS' : 'OFF · TONES ONLY'}
            </div>
          </div>
          <div
            aria-hidden="true"
            style={{
              width: 36, height: 20, borderRadius: 10,
              background: settings.enabled ? V('phos-500') : V('iron-700'),
              position: 'relative', transition: 'background 160ms ease',
              flexShrink: 0,
            }}
          >
            <div style={{
              position: 'absolute', top: 2, left: settings.enabled ? 18 : 2,
              width: 16, height: 16, borderRadius: 8,
              background: settings.enabled ? V('ink') : V('bone-faint'),
              transition: 'left 160ms ease, background 160ms ease',
            }} />
          </div>
        </button>

        {/* Persona */}
        <HodLabel style={{ marginBottom: 10 }}>PERSONA</HodLabel>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
          {PERSONAS.map((p) => {
            const selected = settings.persona === p.key;
            return (
              <button
                key={p.key}
                onClick={() => update({ persona: p.key })}
                disabled={!settings.enabled || !supported}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  padding: '12px 12px',
                  background: selected ? V('iron-800') : 'transparent',
                  border: `1px solid ${selected ? V('phos-500') : V('iron-700')}`,
                  textAlign: 'left',
                  opacity: settings.enabled && supported ? 1 : 0.4,
                  transition: 'all 140ms ease',
                }}
              >
                <div style={{
                  width: 14, height: 14, borderRadius: 7,
                  border: `1px solid ${selected ? V('phos-500') : V('iron-600')}`,
                  background: selected ? V('phos-500') : 'transparent',
                  flexShrink: 0, marginTop: 4,
                }} />
                <div style={{ flex: 1 }}>
                  <div className="hod-display" style={{ fontSize: 16, color: selected ? V('bone') : V('bone-dim'), letterSpacing: '-0.01em' }}>
                    {p.label}
                  </div>
                  <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.14em', marginTop: 3 }}>
                    {p.note}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Rate */}
        <HodLabel style={{ marginBottom: 10 }}>RATE</HodLabel>
        <div style={{ display: 'flex', gap: 6, marginBottom: 22 }}>
          {RATES.map((r) => {
            const selected = Math.abs(settings.rate - r.key) < 0.01;
            return (
              <button
                key={r.label}
                onClick={() => update({ rate: r.key })}
                disabled={!settings.enabled || !supported}
                className="hod-mono"
                style={{
                  flex: 1, padding: '10px 0',
                  fontSize: 11, letterSpacing: '0.22em', fontWeight: 600,
                  color: selected ? V('ink') : V('bone-dim'),
                  background: selected ? V('phos-500') : 'transparent',
                  border: `1px solid ${selected ? V('phos-500') : V('iron-700')}`,
                  opacity: settings.enabled && supported ? 1 : 0.4,
                  transition: 'all 140ms ease',
                }}
              >
                {r.label}
              </button>
            );
          })}
        </div>

        {/* Preview */}
        <HodButton
          onClick={voicePreview}
          variant="ghost"
          size="md"
          full
          disabled={!settings.enabled || !supported}
        >
          · PREVIEW ·
        </HodButton>
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}>
        <HodButton onClick={onDone} size="md" full>DONE</HodButton>
      </div>
    </div>
  );
}
