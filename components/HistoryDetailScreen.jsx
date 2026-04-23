'use client';

import { useEffect, useState } from 'react';
import { V, HodLabel, HodButton, HodRule, HodStat, HodMark } from './atoms';
import { loadWorkoutRecord } from '@/lib/storage';

const RATING_LABELS = {
  easy:   { label: 'EASY',   color: 'bone-dim' },
  solid:  { label: 'SOLID',  color: 'phos-400' },
  brutal: { label: 'BRUTAL', color: 'alert' },
};

export default function HistoryDetailScreen({ iso, onClose }) {
  const [record, setRecord] = useState(null);

  useEffect(() => {
    setRecord(loadWorkoutRecord(iso));
  }, [iso]);

  const d = new Date(iso + 'T12:00:00'); // noon to dodge TZ edges
  const dd  = String(d.getDate()).padStart(2, '0');
  const mm  = String(d.getMonth() + 1).padStart(2, '0');
  const yy  = String(d.getFullYear()).slice(-2);
  const dow = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'][d.getDay()];

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

      <div style={{ padding: '12px 20px 0' }}>
        <div style={{
          display: 'flex', alignItems: 'baseline', gap: 8,
          borderBottom: `1px dashed ${V('iron-700')}`,
          paddingBottom: 10,
        }}>
          <div className="hod-label" style={{ color: V('phos-400') }}>· LOG ENTRY</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: 14 }}>
          <div className="hod-display" style={{
            fontSize: 60, lineHeight: 0.85, color: V('bone'),
            fontWeight: 700, letterSpacing: '-0.03em',
          }}>
            {dd}
          </div>
          <div style={{ flex: 1, paddingBottom: 4 }}>
            <div className="hod-display" style={{ fontSize: 16, color: V('phos-400'), letterSpacing: '0.08em' }}>
              {dow}
            </div>
            <div className="hod-mono" style={{ fontSize: 10, color: V('bone-faint'), letterSpacing: '0.18em', marginTop: 2 }}>
              {mm} · {yy}
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '20px 20px 0', flex: 1, overflowY: 'auto' }} className="hod-no-scrollbar">
        {!record ? (
          <EmptyState />
        ) : (
          <Detail record={record} />
        )}
      </div>

      <div style={{
        padding: '12px 16px',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}>
        <HodButton onClick={onClose} variant="ghost" size="md" full>CLOSE</HodButton>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div style={{ textAlign: 'center', padding: '40px 12px' }}>
      <div className="hod-display" style={{ fontSize: 32, color: V('bone-faint'), lineHeight: 1 }}>
        NO RECORD.
      </div>
      <div style={{ fontFamily: 'var(--f-ui)', fontSize: 13, color: V('bone-faint'), marginTop: 10 }}>
        Either this day wasn't logged, or it's from before history detail was added.
      </div>
    </div>
  );
}

function Detail({ record }) {
  const { workout, stats, params, rating } = record;
  const elapsed = stats?.elapsed ?? 0;
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  const roundsDone = stats ? Math.max(0, (stats.round || 1) - 1) : 0;
  const isAMRAP = workout.main.format === 'AMRAP';
  const ratingMeta = rating ? RATING_LABELS[rating] : null;

  return (
    <>
      <div style={{
        border: `1px solid ${V('iron-700')}`,
        background: V('iron-900'),
        padding: '16px 16px',
      }}>
        <div className="hod-label" style={{ color: V('phos-400') }}>
          {workout.style?.label?.toUpperCase() || params.style} · {workout.main.format}
        </div>
        <div className="hod-display" style={{
          fontSize: 26, color: V('bone'), marginTop: 6,
          letterSpacing: '-0.01em', lineHeight: 1.05,
        }}>
          {workout.main.headline}
        </div>
        <div style={{ fontFamily: 'var(--f-ui)', fontSize: 12, color: V('bone-dim'), marginTop: 6 }}>
          {workout.main.description}
        </div>
      </div>

      <HodRule ticks style={{ margin: '18px 0' }} />

      <HodLabel style={{ marginBottom: 10 }}>MOVEMENTS</HodLabel>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {workout.main.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            <div className="hod-mono" style={{ width: 18, fontSize: 10, color: V('iron-500'), letterSpacing: '0.1em' }}>
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="hod-display" style={{ flex: 1, fontSize: 14, color: V('bone') }}>
              {item.name}
            </div>
            <div className="hod-mono" style={{ fontSize: 12, color: V('bone-dim') }}>
              {item.schemeReps ? item.schemeReps.join('-') :
               item.reps ? `${item.reps} ${item.unit}` : item.unit}
            </div>
            {item.load && item.load !== '—' && (
              <div className="hod-mono" style={{ fontSize: 11, color: V('phos-400'), minWidth: 62, textAlign: 'right' }}>
                {item.load}
              </div>
            )}
          </div>
        ))}
      </div>

      {stats && (
        <>
          <HodRule ticks style={{ margin: '20px 0 14px' }} />
          <div style={{ display: 'flex', gap: 18, alignItems: 'flex-end' }}>
            <HodStat label="TOTAL TIME" value={`${mm}:${ss}`} size="lg" accent />
            {isAMRAP && <HodStat label="ROUNDS" value={roundsDone} size="lg" />}
          </div>
        </>
      )}

      <HodRule ticks style={{ margin: '20px 0 14px' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <HodStat label="DURATION" value={params.duration} unit="MIN" size="sm" />
        <HodStat label="INTENSITY" value={params.intensity} size="sm" accent />
        {ratingMeta && (
          <HodStat label="FELT LIKE" value={ratingMeta.label} size="sm" accent={ratingMeta.color === 'phos-400'} />
        )}
      </div>

      {record.notes && (
        <>
          <HodRule ticks style={{ margin: '20px 0 12px' }} />
          <HodLabel style={{ marginBottom: 8 }}>NOTES</HodLabel>
          <div style={{
            fontFamily: 'var(--f-ui)', fontSize: 14, color: V('bone'),
            lineHeight: 1.55, padding: '12px 14px',
            background: V('iron-900'), border: `1px solid ${V('iron-700')}`,
            whiteSpace: 'pre-wrap',
          }}>
            {record.notes}
          </div>
        </>
      )}
    </>
  );
}
