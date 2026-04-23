import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const SYSTEM_PROMPT = `You are a functional-fitness coach writing concise form cues for a garage-gym workout app. The user may glance at your cue mid-workout and needs to remember the movement fast.

For every movement, write 2–3 short bullet points (under 12 words each) covering:
- Setup: starting position, grip, stance
- Key cue: the one thing most people get wrong
- Safety note if applicable (only if there's a common injury risk)

Voice: direct, second-person, present tense. No preamble. No motivational fluff. No "remember to...". Just cues.

Respond in plain text, one bullet per line starting with "• ". Nothing else.`;

export async function POST(request) {
  let body;
  try { body = await request.json(); } catch { body = {}; }
  const name = String(body.name || '').trim().slice(0, 60);
  if (!name) return Response.json({ ok: false, reason: 'bad-request' }, { status: 400 });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: [
        { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
      ],
      messages: [{ role: 'user', content: `Form cues for: ${name}` }],
    });
    const textBlock = response.content.find((b) => b.type === 'text');
    const cue = textBlock?.text?.trim() || '';
    if (!cue) return Response.json({ ok: false, reason: 'empty' }, { status: 502 });
    return Response.json({ ok: true, cue });
  } catch (err) {
    console.error('Cue generation failed:', err?.message || err);
    return Response.json({ ok: false, reason: 'api-error' }, { status: 502 });
  }
}
