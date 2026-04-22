// HOD atoms — tiny reusable bits (pill, stat, button, tag, divider)
// Tokens live in styles/hod-tokens.css.

// ── Semantic color helpers (read from CSS vars) ───────────
const V = (name) => `var(--${name})`;

// ── Label (eyebrow/meta text) ─────────────────────────────
function HodLabel({ children, style, color = 'bone-faint' }) {
  return (
    <div className="hod-label" style={{ color: V(color), ...style }}>
      {children}
    </div>
  );
}

// ── Tag / chip (selectable) ───────────────────────────────
function HodTag({ children, selected = false, onClick, compact = false, style }) {
  const pad = compact ? '6px 10px' : '9px 14px';
  return (
    <button
      onClick={onClick}
      className="hod-mono"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: pad,
        fontSize: compact ? 11 : 12,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color: selected ? V('ink') : V('bone-dim'),
        background: selected ? V('phos-500') : 'transparent',
        border: `1px solid ${selected ? V('phos-500') : V('iron-700')}`,
        borderRadius: 0,
        transition: 'all 120ms ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Primary button (hollow stencil, fills on press) ───────
function HodButton({ children, onClick, variant = 'primary', size = 'md', full = false, disabled = false, style }) {
  const sizes = {
    sm: { h: 40, fs: 12, pad: '0 16px' },
    md: { h: 52, fs: 14, pad: '0 24px' },
    lg: { h: 72, fs: 20, pad: '0 32px' },
  };
  const s = sizes[size];

  const variants = {
    primary: { bg: V('phos-500'), fg: V('ink'), border: V('phos-500') },
    ghost:   { bg: 'transparent', fg: V('bone'),   border: V('iron-600') },
    danger:  { bg: V('alert'),    fg: V('bone'),   border: V('alert') },
    quiet:   { bg: V('iron-800'), fg: V('bone'),   border: V('iron-700') },
  };
  const v = variants[variant];

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="hod-display"
      style={{
        height: s.h,
        padding: s.pad,
        width: full ? '100%' : undefined,
        fontSize: s.fs,
        letterSpacing: '0.22em',
        color: v.fg,
        background: v.bg,
        border: `1px solid ${v.border}`,
        borderRadius: 0,
        textTransform: 'uppercase',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        opacity: disabled ? 0.4 : 1,
        transition: 'all 120ms ease',
        ...style,
      }}
    >
      {children}
    </button>
  );
}

// ── Horizontal rule (hairline with optional ticks) ────────
function HodRule({ ticks = false, color = 'iron-700', style }) {
  if (!ticks) {
    return <div style={{ height: 1, background: V(color), ...style }} />;
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, ...style }}>
      <div style={{ width: 4, height: 1, background: V(color) }} />
      <div style={{ flex: 1, height: 1, background: V(color) }} />
      <div style={{ width: 4, height: 1, background: V(color) }} />
    </div>
  );
}

// ── Stat block (label + value, tabular) ───────────────────
function HodStat({ label, value, unit, align = 'left', accent = false, size = 'md' }) {
  const sizes = {
    sm: { v: 20 },
    md: { v: 32 },
    lg: { v: 56 },
    xl: { v: 92 },
  };
  return (
    <div style={{ textAlign: align }}>
      <HodLabel>{label}</HodLabel>
      <div
        className="hod-display hod-mono"
        style={{
          fontFamily: "var(--f-display)",
          fontSize: sizes[size].v,
          lineHeight: 1,
          color: accent ? V('phos-400') : V('bone'),
          fontVariantNumeric: 'tabular-nums',
          marginTop: 4,
          display: 'inline-flex', alignItems: 'baseline', gap: 4,
        }}
      >
        {value}
        {unit && (
          <span className="hod-label" style={{ color: V('bone-faint'), fontSize: 10, marginLeft: 4 }}>
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Registration mark (tiny crosshair for corners) ───────
function HodReg({ size = 10, color = 'iron-600', style }) {
  return (
    <svg width={size} height={size} viewBox="0 0 10 10" style={style}>
      <path d="M5 0v10M0 5h10" stroke={V(color)} strokeWidth="1" />
      <circle cx="5" cy="5" r="1.5" fill="none" stroke={V(color)} strokeWidth="1" />
    </svg>
  );
}

// ── Corner brackets (frames content) ─────────────────────
function HodBrackets({ children, color = 'iron-600', inset = 6, style }) {
  const c = V(color);
  const L = 10;
  const b = (pos) => ({
    position: 'absolute', width: L, height: L,
    borderColor: c, borderStyle: 'solid',
    ...pos,
  });
  return (
    <div style={{ position: 'relative', ...style }}>
      <div style={{ ...b({ top: inset, left: inset, borderWidth: '1px 0 0 1px' }) }} />
      <div style={{ ...b({ top: inset, right: inset, borderWidth: '1px 1px 0 0' }) }} />
      <div style={{ ...b({ bottom: inset, left: inset, borderWidth: '0 0 1px 1px' }) }} />
      <div style={{ ...b({ bottom: inset, right: inset, borderWidth: '0 1px 1px 0' }) }} />
      {children}
    </div>
  );
}

// ── HOD brand mark (the date-stamped lockup) ─────────────
function HodMark({ size = 'md', showDate = true, date, accent = true }) {
  const sizes = {
    sm: { hod: 20, meta: 8, gap: 2 },
    md: { hod: 32, meta: 9, gap: 4 },
    lg: { hod: 56, meta: 11, gap: 6 },
    xl: { hod: 92, meta: 13, gap: 8 },
  };
  const s = sizes[size];
  const d = date || new Date();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const yy = String(d.getFullYear()).slice(-2);
  const dow = ['SUN','MON','TUE','WED','THU','FRI','SAT'][d.getDay()];

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start', gap: s.gap, lineHeight: 1 }}>
      <div className="hod-display" style={{
        fontSize: s.hod,
        color: accent ? V('phos-400') : V('bone'),
        letterSpacing: '-0.02em',
        fontWeight: 700,
        display: 'flex', alignItems: 'baseline', gap: s.hod * 0.08,
      }}>
        <span>HOD</span>
        <span style={{ color: V('iron-500'), fontSize: s.hod * 0.5 }}>//</span>
      </div>
      {showDate && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: V('bone-faint') }}>
          <span className="hod-label" style={{ fontSize: s.meta, letterSpacing: '0.22em' }}>
            {mm}.{dd}.{yy}
          </span>
          <span style={{ width: 3, height: 3, background: V('phos-500'), borderRadius: '50%' }} />
          <span className="hod-label" style={{ fontSize: s.meta, letterSpacing: '0.22em' }}>
            {dow}
          </span>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { HodLabel, HodTag, HodButton, HodRule, HodStat, HodReg, HodBrackets, HodMark });
