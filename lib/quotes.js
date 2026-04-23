// Short, punchy lines for the moments you're wobbling — pre-workout,
// during pause, mid-rest, post-workout. Mix of attributed classics and
// unattributed punches in the stay-hard voice.

export const QUOTES = [
  { text: 'Stay hard.', author: 'Goggins' },
  { text: 'Callus your mind.', author: 'Goggins' },
  { text: 'Get comfortable being uncomfortable.', author: 'Goggins' },
  { text: "Who's gonna carry the boats?", author: 'Goggins' },
  { text: 'Discipline equals freedom.', author: 'Jocko' },
  { text: 'Embrace the suck.', author: null },
  { text: 'The only easy day was yesterday.', author: 'SEAL creed' },
  { text: 'Nobody cares. Work harder.', author: null },
  { text: "You haven't even started.", author: null },
  { text: "Don't stop when you're tired. Stop when you're done.", author: null },
  { text: 'Pain is a messenger. Answer it.', author: null },
  { text: 'Discipline over motivation.', author: null },
  { text: 'Show up anyway.', author: null },
  { text: "If it doesn't challenge you, it doesn't change you.", author: null },
  { text: 'The work is the gift.', author: null },
  { text: 'Soft now. Regret later.', author: null },
  { text: 'You vs. yesterday.', author: null },
  { text: 'Earn your breath.', author: null },
  { text: 'You can always do one more.', author: null },
  { text: 'Comfort is the enemy.', author: null },
  { text: 'The suck is the practice.', author: null },
  { text: 'No one is coming to save you.', author: null },
  { text: 'Be the hardest worker in the room.', author: null },
  { text: 'Your body can handle more than your mind believes.', author: null },
  { text: "If you're not sweating, you haven't started.", author: null },
  { text: 'Excuses tell the truth.', author: null },
  { text: 'Every rep is a vote. Cast it loud.', author: null },
  { text: 'Tired is a feeling. Finishing is a choice.', author: null },
  { text: "Don't negotiate with pain.", author: null },
  { text: 'You wanted this. Now earn it.', author: null },
  { text: 'Stand up.', author: null },
  { text: 'The mirror is honest.', author: null },
  { text: 'Work louder than your doubt.', author: null },
  { text: 'One more round. One more rep.', author: null },
  { text: 'Hard choices, easy life.', author: null },
  { text: 'Finish what you started.', author: null },
  { text: 'The clock does not care about your mood.', author: null },
  { text: "You're not sore. You're alive.", author: null },
  { text: 'Meet yourself at the wall.', author: null },
  { text: 'Grow where it hurts.', author: null },
  { text: 'Bleed. Breathe. Begin again.', author: null },
  { text: 'Comfort robs capability.', author: null },
  { text: 'No savior is coming. Move.', author: null },
  { text: 'The bar does not know your mood.', author: null },
  { text: "When it's hard, that's the point.", author: null },
  { text: 'You are not the exception.', author: null },
  { text: 'The body is a voter. Outvote your doubt.', author: null },
  { text: 'Harder than yesterday. Softer than tomorrow never.', author: null },
  { text: 'Chase your ghost.', author: null },
  { text: "The only rep that doesn't count is the one you skipped.", author: null },
];

// Simple seeded index so repeated picks in the same render are stable.
function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function randomQuote() {
  return QUOTES[Math.floor(Math.random() * QUOTES.length)];
}

// Deterministic pick — same seed returns the same quote.
// Useful when you want "today's quote" consistency across renders.
export function quoteBySeed(seed) {
  const n = typeof seed === 'string' ? hash(seed) : Math.abs(Number(seed) || 0);
  return QUOTES[n % QUOTES.length];
}
