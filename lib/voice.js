'use client';

// Voice coach — thin wrapper around Web Speech API with persona-aware
// phrasings. Zero dependencies, works offline, respects the existing audio
// mute. Sits alongside the tone cues in lib/audio.js rather than replacing
// them — the two layers play together.

import { isAudioMuted } from './audio';

const KEY = 'hod.voice';

const DEFAULTS = {
  enabled: false,
  persona: 'neutral',   // 'neutral' | 'drill'
  rate: 1.1,            // 0.8 – 1.4
};

function read() {
  if (typeof localStorage === 'undefined') return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULTS };
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

function write(next) {
  if (typeof localStorage === 'undefined') return next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

export function loadVoiceSettings() { return read(); }

export function saveVoiceSettings(patch) {
  return write({ ...read(), ...patch });
}

export function isVoiceEnabled() {
  return read().enabled;
}

// ── Core speak ────────────────────────────────────────────
// interrupt=true cancels anything currently playing before speaking. Use for
// time-sensitive calls like countdown numbers; use false for queued
// announcements that should follow what's already playing.
export function speak(text, { interrupt = false } = {}) {
  if (!text) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  const s = read();
  if (!s.enabled) return;
  if (isAudioMuted()) return;

  try {
    if (interrupt) window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    u.rate = Math.min(1.4, Math.max(0.8, Number(s.rate) || 1.1));
    u.pitch = 1;
    u.volume = 1;
    window.speechSynthesis.speak(u);
  } catch {
    // Silently drop — browser/OS may not support TTS
  }
}

export function cancelVoice() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    try { window.speechSynthesis.cancel(); } catch {}
  }
}

// ── Persona phrasings ─────────────────────────────────────
const P = {
  neutral: {
    countdown:    { 3: 'Three', 2: 'Two', 1: 'One' },
    timeUp:       'Time.',
    pause:        'Paused.',
    resume:       'Resume.',
    restStart:    (s) => `Rest. ${s} seconds.`,
    restDone:     'Back to it.',
    minute:       (mv, reps) => `Next: ${mv}${reps ? `, ${reps} reps` : ''}.`,
    nextMovement: (mv, reps) => `${mv}${reps ? `, ${reps} reps` : ''}.`,
    finishCall:   'Done.',
  },
  drill: {
    countdown:    { 3: 'Three.', 2: 'Two.', 1: 'Move.' },
    timeUp:       'Time. Put it down.',
    pause:        'Holding.',
    resume:       'Up. Move.',
    restStart:    (s) => `Rest. ${s} seconds. Earn it.`,
    restDone:     'Up. Back to work.',
    minute:       (mv, reps) => `${mv}.${reps ? ` ${reps}.` : ''} Move.`,
    nextMovement: (mv, reps) => `${mv}.${reps ? ` ${reps}.` : ''} Go.`,
    finishCall:   'Done. You earned it.',
  },
};

function phrasings() {
  const s = read();
  return P[s.persona] || P.neutral;
}

// ── Cue helpers ───────────────────────────────────────────
export function voiceCountdown(n) {
  const p = phrasings();
  speak(p.countdown[n], { interrupt: true });
}

export function voiceTimeUp() {
  speak(phrasings().timeUp, { interrupt: true });
}

export function voicePause() {
  speak(phrasings().pause, { interrupt: true });
}

export function voiceResume() {
  speak(phrasings().resume, { interrupt: true });
}

export function voiceRestStart(seconds) {
  speak(phrasings().restStart(seconds));
}

export function voiceRestDone() {
  speak(phrasings().restDone, { interrupt: true });
}

export function voiceMinute(movementName, reps) {
  speak(phrasings().minute(movementName, reps));
}

export function voiceNextMovement(movementName, reps) {
  speak(phrasings().nextMovement(movementName, reps));
}

export function voiceFinish() {
  speak(phrasings().finishCall, { interrupt: true });
}

// Preview line used by the settings screen
export function voicePreview() {
  const p = phrasings();
  speak(p.minute('Thruster', 10), { interrupt: true });
}
