'use client';

import { V } from './atoms';

// Display a short motivational quote. Parent owns the quote object so it can
// stay stable across renders (pick once via useMemo / useRef).
export function Quote({ quote, accent = 'phos-400', size = 'md', align = 'left', style }) {
  if (!quote) return null;
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
