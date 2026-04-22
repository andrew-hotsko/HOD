'use client';

// Web Audio synthesized cues — no sample files, zero-latency, tiny.
// Mute state is persisted in localStorage.

const MUTE_KEY = 'hod.muted';
let ctx = null;

function getContext() {
  if (typeof window === 'undefined') return null;
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  try {
    ctx = new AudioCtx();
  } catch {
    return null;
  }
  return ctx;
}

export function isAudioMuted() {
  if (typeof localStorage === 'undefined') return false;
  return localStorage.getItem(MUTE_KEY) === '1';
}

export function setAudioMuted(muted) {
  if (typeof localStorage === 'undefined') return;
  if (muted) localStorage.setItem(MUTE_KEY, '1');
  else localStorage.removeItem(MUTE_KEY);
}

// Call on a user gesture (e.g. BEGIN HOD button) to unlock audio on mobile.
export function primeAudio() {
  getContext();
}

function tone({ freq, duration = 0.12, volume = 0.25, type = 'sine', at = 0 }) {
  if (isAudioMuted()) return;
  const c = getContext();
  if (!c) return;
  const start = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(c.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// Single short beep — EMOM minute boundary, "next up" cue.
export function cueMinuteStart() {
  tone({ freq: 880, duration: 0.14, volume: 0.3, type: 'square' });
}

// Countdown tick — one per second in the final 3s of a time block.
export function cueCountdown() {
  tone({ freq: 660, duration: 0.08, volume: 0.22, type: 'square' });
}

// Long final beep — time's up / workout done.
export function cueFinish() {
  tone({ freq: 523, duration: 0.35, volume: 0.28, type: 'triangle', at: 0 });
  tone({ freq: 659, duration: 0.35, volume: 0.28, type: 'triangle', at: 0.09 });
  tone({ freq: 784, duration: 0.6,  volume: 0.28, type: 'triangle', at: 0.18 });
}

// Rest-complete ping — used between sets.
export function cueRestComplete() {
  tone({ freq: 880, duration: 0.1, volume: 0.3, type: 'square', at: 0 });
  tone({ freq: 1175, duration: 0.16, volume: 0.3, type: 'square', at: 0.1 });
}

// Soft tap — movement advance / swap confirm.
export function cueTap() {
  tone({ freq: 440, duration: 0.05, volume: 0.15, type: 'sine' });
}
