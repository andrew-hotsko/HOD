'use client';

import { useState, useEffect } from 'react';
import { V, HodLabel, HodButton, HodRule, HodMark } from './atoms';
import { loadFamilyCode, saveFamilyCode, normalizeFamilyCode } from '@/lib/storage';

function randomCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 to avoid confusion
  let out = '';
  for (let i = 0; i < 6; i++) out += letters[Math.floor(Math.random() * letters.length)];
  return out;
}

export default function FamilyCodeScreen({ onDone, onCancel }) {
  const [code, setCode] = useState('');
  const [initial, setInitial] = useState('');

  useEffect(() => {
    const c = loadFamilyCode();
    setCode(c);
    setInitial(c);
  }, []);

  const finish = () => {
    const saved = saveFamilyCode(code);
    onDone?.(saved);
  };

  const disconnect = () => {
    saveFamilyCode('');
    onDone?.('');
  };

  const clean = normalizeFamilyCode(code);
  const canSave = clean !== initial;
  const isLinked = clean.length >= 3;

  return (
    <div style={{
      flex: 1, background: V('ink'),
      display: 'flex', flexDirection: 'column',
      paddingTop: 'max(20px, env(safe-area-inset-top))',
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
          · FAMILY CODE
        </div>
        <div className="hod-display" style={{
          fontSize: 44, lineHeight: 0.9, color: V('bone'),
          letterSpacing: '-0.02em', marginTop: 8,
        }}>
          STAY IN SYNC.
        </div>
        <div style={{
          fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-dim'),
          marginTop: 10, maxWidth: 320,
        }}>
          Pick a short code and share it with family. Everyone with the same
          code sees each other's workouts on the Today screen.
        </div>
      </div>

      <HodRule ticks style={{ margin: '22px 20px 8px' }} />

      <div style={{ padding: '12px 20px 0', flex: 1, overflowY: 'auto' }} className="hod-no-scrollbar">
        <HodLabel style={{ marginBottom: 10 }}>CODE</HodLabel>
        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(normalizeFamilyCode(e.target.value))}
            placeholder="HOTSKO"
            maxLength={10}
            autoCapitalize="characters"
            className="hod-display hod-mono"
            style={{
              flex: 1,
              background: V('iron-900'),
              color: V('bone'),
              border: `1px solid ${V('iron-700')}`,
              padding: '14px 14px',
              fontSize: 24,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              outline: 'none',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <button
            onClick={() => setCode(randomCode())}
            className="hod-mono"
            style={{
              fontSize: 10, letterSpacing: '0.22em',
              background: 'transparent', color: V('phos-400'),
              border: `1px solid ${V('iron-700')}`,
              padding: '0 14px',
            }}
            aria-label="Generate a random code"
          >
            ROLL
          </button>
        </div>
        <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em', marginTop: 8 }}>
          3–10 LETTERS OR NUMBERS · SHARED BY ALL FAMILY DEVICES
        </div>

        {isLinked && initial && (
          <div style={{ marginTop: 28 }}>
            <HodLabel style={{ marginBottom: 6 }}>LINKED TO</HodLabel>
            <div className="hod-display" style={{
              fontSize: 28, color: V('phos-400'), letterSpacing: '0.06em',
            }}>
              {initial}
            </div>
          </div>
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
        display: 'flex', gap: 10,
      }}>
        {initial && (
          <HodButton onClick={disconnect} variant="ghost" size="md" style={{ flex: 1 }}>
            DISCONNECT
          </HodButton>
        )}
        <HodButton
          onClick={finish}
          size="md"
          style={{ flex: initial ? 2 : 1, width: initial ? undefined : '100%' }}
          disabled={!canSave || (clean && clean.length < 3)}
          full={!initial}
        >
          {clean ? (initial ? 'UPDATE CODE' : 'LINK FAMILY') : 'DONE'}
        </HodButton>
      </div>
    </div>
  );
}
