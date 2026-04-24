'use client';

import { useEffect, useState } from 'react';
import { V, HodLabel, HodRule, HodMark } from './atoms';
import { loadProfile, loadEquipment, ROLE_DEFS, loadFamilyCode, areQuotesEnabled, setQuotesEnabled } from '@/lib/storage';
import { loadVoiceSettings } from '@/lib/voice';

export default function SettingsScreen({ onEditProfile, onEditEquipment, onEditFamily, onEditVoice, onClose }) {
  const [profile, setProfile] = useState(null);
  const [equipment, setEquipment] = useState(null);
  const [familyCode, setFamilyCode] = useState('');
  const [quotesOn, setQuotesOn] = useState(true);
  const [voiceSettings, setVoiceSettings] = useState({ enabled: false, persona: 'neutral' });

  useEffect(() => {
    setProfile(loadProfile());
    setEquipment(loadEquipment());
    setFamilyCode(loadFamilyCode());
    setQuotesOn(areQuotesEnabled());
    setVoiceSettings(loadVoiceSettings());
  }, []);

  const voiceSummary = voiceSettings.enabled
    ? `ON · ${(voiceSettings.persona || 'neutral').toUpperCase()}`
    : 'OFF · TAP TO SET UP';

  const profileSummary = profile
    ? `${profile.name || '(unnamed)'} · ${ROLE_DEFS[profile.role]?.label ?? 'Adult'}`
    : '—';
  const equipmentCount = equipment ? Object.values(equipment).filter(Boolean).length : 0;
  const familySummary = familyCode ? `LINKED · ${familyCode}` : 'NOT LINKED · TAP TO CONNECT';

  const toggleQuotes = () => {
    const next = !quotesOn;
    setQuotesOn(next);
    setQuotesEnabled(next);
  };

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
    }} className="hod-grid-bg">
      <div style={{ padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <HodMark size="sm" showDate={false} />
        <button
          onClick={onClose}
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
        <div className="hod-label" style={{ color: V('phos-400'), letterSpacing: '0.32em' }}>· SETTINGS</div>
        <div className="hod-display" style={{
          fontSize: 48, lineHeight: 0.9, color: V('bone'),
          letterSpacing: '-0.02em', marginTop: 8,
        }}>
          DIAL IT IN.
        </div>
      </div>

      <HodRule ticks style={{ margin: '22px 20px 6px' }} />

      <div style={{ padding: '12px 20px 0', flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Row
          label="PROFILE"
          value={profileSummary}
          onClick={onEditProfile}
        />
        <Row
          label="KIT"
          value={`${equipmentCount} ${equipmentCount === 1 ? 'ITEM' : 'ITEMS'} AVAILABLE`}
          onClick={onEditEquipment}
        />
        <Row
          label="FAMILY"
          value={familySummary}
          onClick={onEditFamily}
        />
        <Row
          label="VOICE"
          value={voiceSummary}
          onClick={onEditVoice}
        />
        <ToggleRow
          label="QUOTES"
          on={quotesOn}
          onText="MOTIVATIONAL LINES SHOWING"
          offText="SILENCED"
          onToggle={toggleQuotes}
        />
      </div>
    </div>
  );
}

function ToggleRow({ label, on, onText, offText, onToggle }) {
  return (
    <button
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 14px',
        background: V('iron-900'),
        border: `1px solid ${V('iron-700')}`,
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hod-mono" style={{ fontSize: 9, color: V('phos-400'), letterSpacing: '0.22em' }}>
          {label}
        </div>
        <div className="hod-display" style={{
          fontSize: 16, color: V('bone'), letterSpacing: '-0.01em', marginTop: 2,
        }}>
          {on ? onText : offText}
        </div>
      </div>
      <div
        aria-hidden="true"
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: on ? V('phos-500') : V('iron-700'),
          position: 'relative',
          transition: 'background 160ms ease',
          flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 2, left: on ? 18 : 2,
          width: 16, height: 16, borderRadius: 8,
          background: on ? V('ink') : V('bone-faint'),
          transition: 'left 160ms ease, background 160ms ease',
        }} />
      </div>
    </button>
  );
}

function Row({ label, value, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '16px 14px',
        background: V('iron-900'),
        border: `1px solid ${V('iron-700')}`,
        textAlign: 'left',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="hod-mono" style={{ fontSize: 9, color: V('phos-400'), letterSpacing: '0.22em' }}>
          {label}
        </div>
        <div className="hod-display" style={{
          fontSize: 16, color: V('bone'), letterSpacing: '-0.01em', marginTop: 2,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {value}
        </div>
      </div>
      <span className="hod-mono" style={{ fontSize: 12, color: V('bone-faint'), letterSpacing: '0.2em' }}>
        EDIT →
      </span>
    </button>
  );
}
