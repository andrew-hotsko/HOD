'use client';

import { useState, useEffect } from 'react';
import { V } from './atoms';
import { areQuotesEnabled } from '@/lib/storage';

// Display a short motivational quote. Parent owns the quote object so it can
// stay stable across renders (pick once via useMemo / useRef). Hidden when
// the user has silenced quotes from Settings.
export function Quote({ quote, accent = 'phos-400', size = 'md', align = 'left', style }) {
  const [enabled, setEnabled] = useState(true);
  useEffect(() => { setEnabled(areQuotesEnabled()); }, []);
  if (!quote || !enabled) return null;
  const sizes = {
    sm: { text: 12, author: 9, gap: 3 },
    md: { text: 14, author: 9, gap: 4 },
    lg: { text: 18, author: 10, gap: 6 },
  };
  const s = sizes[size] || sizes.md;
  return (
    <div style={{ textAlign: align, ...style }}>
      <div style={{
        fontFamily: 'var(--f-ui)',
        fontSize: s.text,
        color: V('bone'),
        lineHeight: 1.35,
        fontStyle: 'italic',
      }}>
        &ldquo;{quote.text}&rdquo;
      </div>
      {quote.author && (
        <div className="hod-mono" style={{
          fontSize: s.author,
          color: V(accent),
          letterSpacing: '0.22em',
          marginTop: s.gap,
          textTransform: 'uppercase',
        }}>
          — {quote.author}
        </div>
      )}
    </div>
  );
}
