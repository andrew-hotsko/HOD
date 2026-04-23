// Short, punchy lines for the moments you're wobbling. Each quote is tagged
// with the workout phases it fits:
//   'pre'  — warmup / pre-commit moments
//   'mid'  — pause / rest-between-sets / don't-quit moments
//   'post' — complete / reflection / set-up-tomorrow moments

export const QUOTES = [
  { text: 'Stay hard.', author: 'Goggins', tags: ['pre', 'mid', 'post'] },
  { text: 'Callus your mind.', author: 'Goggins', tags: ['pre', 'mid', 'post'] },
  { text: 'Get comfortable being uncomfortable.', author: 'Goggins', tags: ['pre', 'mid'] },
  { text: "Who's gonna carry the boats?", author: 'Goggins', tags: ['mid'] },
  { text: 'Discipline equals freedom.', author: 'Jocko', tags: ['pre', 'post'] },
  { text: 'Embrace the suck.', author: null, tags: ['pre', 'mid'] },
  { text: 'The only easy day was yesterday.', author: 'SEAL creed', tags: ['pre', 'post'] },
  { text: 'Nobody cares. Work harder.', author: null, tags: ['pre', 'mid'] },
  { text: "You haven't even started.", author: null, tags: ['mid'] },
  { text: "Don't stop when you're tired. Stop when you're done.", author: null, tags: ['mid'] },
  { text: 'Pain is a messenger. Answer it.', author: null, tags: ['mid'] },
  { text: 'Discipline over motivation.', author: null, tags: ['pre', 'post'] },
  { text: 'Show up anyway.', author: null, tags: ['pre'] },
  { text: "If it doesn't challenge you, it doesn't change you.", author: null, tags: ['pre', 'post'] },
  { text: 'The work is the gift.', author: null, tags: ['pre', 'post'] },
  { text: 'Soft now. Regret later.', author: null, tags: ['pre', 'mid'] },
  { text: 'You vs. yesterday.', author: null, tags: ['pre', 'post'] },
  { text: 'Earn your breath.', author: null, tags: ['pre', 'mid'] },
  { text: 'You can always do one more.', author: null, tags: ['mid'] },
  { text: 'Comfort is the enemy.', author: null, tags: ['pre', 'mid'] },
  { text: 'The suck is the practice.', author: null, tags: ['mid'] },
  { text: 'No one is coming to save you.', author: null, tags: ['pre', 'mid'] },
  { text: 'Be the hardest worker in the room.', author: null, tags: ['pre', 'post'] },
  { text: 'Your body can handle more than your mind believes.', author: null, tags: ['mid'] },
  { text: "If you're not sweating, you haven't started.", author: null, tags: ['mid'] },
  { text: 'Excuses tell the truth.', author: null, tags: ['pre', 'post'] },
  { text: 'Every rep is a vote. Cast it loud.', author: null, tags: ['mid'] },
  { text: 'Tired is a feeling. Finishing is a choice.', author: null, tags: ['mid'] },
  { text: "Don't negotiate with pain.", author: null, tags: ['mid'] },
  { text: 'You wanted this. Now earn it.', author: null, tags: ['pre', 'mid'] },
  { text: 'Stand up.', author: null, tags: ['mid'] },
  { text: 'The mirror is honest.', author: null, tags: ['pre', 'post'] },
  { text: 'Work louder than your doubt.', author: null, tags: ['pre', 'mid'] },
  { text: 'One more round. One more rep.', author: null, tags: ['mid'] },
  { text: 'Hard choices, easy life.', author: null, tags: ['pre', 'post'] },
  { text: 'Finish what you started.', author: null, tags: ['mid'] },
  { text: 'The clock does not care about your mood.', author: null, tags: ['mid'] },
  { text: "You're not sore. You're alive.", author: null, tags: ['post'] },
  { text: 'Meet yourself at the wall.', author: null, tags: ['mid'] },
  { text: 'Grow where it hurts.', author: null, tags: ['mid', 'post'] },
  { text: 'Bleed. Breathe. Begin again.', author: null, tags: ['mid'] },
  { text: 'Comfort robs capability.', author: null, tags: ['pre', 'post'] },
  { text: 'No savior is coming. Move.', author: null, tags: ['pre', 'mid'] },
  { text: 'The bar does not know your mood.', author: null, tags: ['pre', 'mid'] },
  { text: "When it's hard, that's the point.", author: null, tags: ['mid'] },
  { text: 'You are not the exception.', author: null, tags: ['mid'] },
  { text: 'The body is a voter. Outvote your doubt.', author: null, tags: ['mid'] },
  { text: 'Harder than yesterday. Softer than tomorrow never.', author: null, tags: ['pre', 'post'] },
  { text: 'Chase your ghost.', author: null, tags: ['pre', 'mid'] },
  { text: "The only rep that doesn't count is the one you skipped.", author: null, tags: ['mid'] },

  // ── Post-specific reflection lines ──────────────────────
  { text: 'Today you showed up. That counts.', author: null, tags: ['post'] },
  { text: 'Rest is a weapon. Use it.', author: null, tags: ['post'] },
  { text: 'Sleep it off. Come back harder.', author: null, tags: ['post'] },
  { text: 'Done is a door. Walk through.', author: null, tags: ['post'] },
  { text: 'Calluses are earned, not given.', author: null, tags: ['post'] },
  { text: 'You kept the promise. Keep it tomorrow.', author: null, tags: ['post'] },
  { text: 'Food, water, sleep. Then repeat.', author: null, tags: ['post'] },
];

// Simple seeded index so repeated picks in the same render are stable.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pool(tag) {
  if (!tag) return QUOTES;
  const filtered = QUOTES.filter((q) => Array.isArray(q.tags) && q.tags.includes(tag));
  return filtered.length ? filtered : QUOTES;
}

// Pick a random quote, optionally filtered by tag ('pre' | 'mid' | 'post').
export function randomQuote(tag) {
  const list = pool(tag);
  return list[Math.floor(Math.random() * list.length)];
}

// Deterministic pick — same (seed, tag) returns the same quote.
export function quoteBySeed(seed, tag) {
  const list = pool(tag);
  const n = typeof seed === 'string' ? hash(seed) : Math.abs(Number(seed) || 0);
  return list[n % list.length];
}
