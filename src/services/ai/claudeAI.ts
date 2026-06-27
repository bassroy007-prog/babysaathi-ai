import { differenceInWeeks, differenceInHours, differenceInMinutes } from 'date-fns';
import { Baby, FeedEntry, SleepEntry, DiaperEntry, GrowthEntry } from '@types/index';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_TOKENS = 1024;

export interface BabyContext {
  baby: Baby | null;
  feeds: FeedEntry[];
  sleep: SleepEntry[];
  diapers: DiaperEntry[];
  growth: GrowthEntry[];
}

// ─── System prompt ─────────────────────────────────────────────────────────────
// Warm Hinglish dadi/nani persona with full baby data injected.

export function buildClaudeSystemPrompt(ctx: BabyContext): string {
  const { baby, feeds, sleep, diapers, growth } = ctx;
  const now = new Date();

  let babyBlock = 'Abhi koi baby profile add nahi ki gayi.';
  if (baby) {
    const ageWeeks = differenceInWeeks(now, baby.birthDate);
    const ageMonths = Math.floor(ageWeeks / 4.33);
    const genderWord = baby.gender === 'male' ? 'ladka' : baby.gender === 'female' ? 'ladki' : 'baby';
    babyBlock = [
      `Naam: ${baby.name} (${genderWord})`,
      `Umar: ${ageWeeks} hafte (${ageMonths} mahine)`,
      `Janam: ${baby.birthDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}`,
      baby.birthWeight ? `Janam ka wajan: ${baby.birthWeight > 50 ? (baby.birthWeight / 1000).toFixed(2) : baby.birthWeight} kg` : null,
      baby.bloodGroup ? `Blood group: ${baby.bloodGroup}` : null,
      baby.pediatricianName ? `Doctor: Dr. ${baby.pediatricianName}` : null,
    ].filter(Boolean).join('\n');
  }

  const recentFeeds = feeds.slice(0, 6);
  const feedBlock = recentFeeds.length
    ? recentFeeds.map((f) => {
        const ago = differenceInHours(now, f.startTime);
        const dur = f.endTime
          ? `${differenceInMinutes(f.endTime, f.startTime)} min`
          : 'chal raha hai';
        const typeStr =
          f.type === 'breastfeed'
            ? `Breast (${f.side ?? 'both'})`
            : f.type === 'formula'
            ? `Formula ${f.amount != null ? f.amount + 'ml' : ''}`
            : `Solid: ${f.foodType ?? ''}`;
        return `• ${typeStr} — ${ago}h pehle, ${dur}`;
      }).join('\n')
    : '• Koi feed log nahi hua abhi';

  const recentSleep = sleep.slice(0, 4);
  const sleepBlock = recentSleep.length
    ? recentSleep.map((s) => {
        const dur = s.endTime
          ? `${(differenceInMinutes(s.endTime, s.startTime) / 60).toFixed(1)}h`
          : 'abhi so raha/rahi hai';
        const ago = differenceInHours(now, s.startTime);
        return `• ${ago}h pehle — ${dur}`;
      }).join('\n')
    : '• Koi sleep log nahi';

  const recentDiapers = diapers.slice(0, 3);
  const diaperBlock = recentDiapers.length
    ? recentDiapers.map((d) => {
        const ago = differenceInHours(now, d.loggedAt);
        return `• ${d.type} — ${ago}h pehle`;
      }).join('\n')
    : '• Koi diaper log nahi';

  const latestGrowth = growth.length ? growth[0] : null;
  const growthBlock = latestGrowth
    ? [
        latestGrowth.weight != null
          ? `Wajan: ${latestGrowth.weight > 50 ? (latestGrowth.weight / 1000).toFixed(2) : latestGrowth.weight} kg`
          : null,
        latestGrowth.height != null ? `Lambai: ${latestGrowth.height} cm` : null,
        latestGrowth.headCircumference != null
          ? `Sar ka size: ${latestGrowth.headCircumference} cm`
          : null,
      ].filter(Boolean).join(', ') || 'Growth data logged'
    : 'Growth abhi tak log nahi hua';

  const lastFeed = recentFeeds[0];
  const hungerWarning =
    lastFeed && differenceInHours(now, lastFeed.startTime) > 3
      ? `⚠️ Pichle feed ko ${differenceInHours(now, lastFeed.startTime)} ghante ho gaye — ${baby?.name ?? 'baby'} ko bhook lag sakti hai!`
      : '';

  return `Tu AI Guru hai — BabySaathi app mein ek warm, wise Indian parenting companion.

TERI PERSONALITY:
- Tu baat karta hai jaise ek samajhdar dadi ya nani — caring, reassuring, practical
- Natural Hinglish bol: Hindi aur English mix karo jaise Indian families actually bolte hain
- Indian traditions naturally reference karo: sarson tel massage, gripe water, kala tika, hing ka nabhiyan pe lep, khichdi weaning, rice ka paani, khadir bark for teething, etc.
- Hamesha doctor ki zaroorat samjhao jab zaroor ho — kabhi diagnosis mat do
- Personal ho: baby ka naam use karo, actual data reference karo
- Short aur warm rakh responses — emojis sparingly but naturally use karo
- Kabhi "I" ya "As an AI" se shuru mat karo — directly answer ya advice se shuru karo
- Serious concern pe hamesha kaho: "Doctor se milna chahiye" 🙏

━━━ BABY KI PROFILE ━━━
${babyBlock}

━━━ AAJKI ACTIVITY ━━━
Feeds (recent):
${feedBlock}

Neend (recent):
${sleepBlock}

Diapers (recent):
${diaperBlock}

Growth (latest):
${growthBlock}
${hungerWarning ? '\n' + hungerWarning : ''}

━━━ GUIDELINES ━━━
• ${baby?.name ?? 'Baby'} ka naam aur umar hamesha use karo
• Jab data ho, usse reference karo ("Main dekh sakti hoon ki ${baby?.name ?? 'baby'} ne aaj...")
• Age ke hisaab se advice do: newborn (0-3m), infant (3-8m), older infant (8-12m), toddler (12m+)
• Dadi/nani ki traditional advice ko respect ke saath acknowledge karo, phir evidence-based guidance do
• Agar bahar ka topic ho, warmly redirect karo
• Max 3-4 short paragraphs — concise raho
• Bold headers use karo jab multiple points ho`;
}

// ─── XHR-based streaming (reliable in React Native) ───────────────────────────

export interface StreamOptions {
  messages: { role: 'user' | 'assistant'; content: string }[];
  systemPrompt: string;
  apiKey: string;
  onChunk: (chunk: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: string) => void;
}

export function streamClaudeMessage(opts: StreamOptions): () => void {
  const { messages, systemPrompt, apiKey, onChunk, onComplete, onError } = opts;
  let fullText = '';
  let lastProcessed = 0;
  let aborted = false;

  const xhr = new XMLHttpRequest();
  xhr.open('POST', API_URL, true);
  xhr.setRequestHeader('x-api-key', apiKey);
  xhr.setRequestHeader('anthropic-version', '2023-06-01');
  xhr.setRequestHeader('content-type', 'application/json');

  xhr.onprogress = () => {
    if (aborted) return;
    const raw = xhr.responseText;
    const newText = raw.slice(lastProcessed);
    lastProcessed = raw.length;

    for (const line of newText.split('\n')) {
      if (!line.startsWith('data: ')) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === '[DONE]') continue;
      try {
        const parsed = JSON.parse(jsonStr) as {
          type: string;
          delta?: { type: string; text?: string };
        };
        if (
          parsed.type === 'content_block_delta' &&
          parsed.delta?.type === 'text_delta' &&
          parsed.delta.text
        ) {
          fullText += parsed.delta.text;
          onChunk(parsed.delta.text);
        }
      } catch {
        // partial JSON — will be retried on next progress event
      }
    }
  };

  xhr.onload = () => {
    if (aborted) return;
    if (xhr.status >= 200 && xhr.status < 300) {
      onComplete(fullText);
    } else {
      // Parse error body
      let errMsg = `API error ${xhr.status}`;
      try {
        const body = JSON.parse(xhr.responseText) as { error?: { message?: string } };
        if (body.error?.message) errMsg = body.error.message;
      } catch {
        //
      }
      onError(errMsg);
    }
  };

  xhr.onerror = () => {
    if (!aborted) onError('Network error — internet connection check karo');
  };

  xhr.ontimeout = () => {
    if (!aborted) onError('Request timed out — thodi der baad try karo');
  };

  xhr.timeout = 60_000;

  xhr.send(
    JSON.stringify({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
      stream: true,
    })
  );

  return () => {
    aborted = true;
    xhr.abort();
  };
}

// ─── Build conversation history for the API call ──────────────────────────────
// Trims to last N messages to keep token usage bounded.

export function buildApiMessages(
  chatMessages: { role: 'user' | 'assistant'; content: string }[],
  maxMessages = 20
): { role: 'user' | 'assistant'; content: string }[] {
  const trimmed = chatMessages.slice(-maxMessages);
  // Anthropic requires the first message to be from 'user'
  const firstUser = trimmed.findIndex((m) => m.role === 'user');
  return firstUser > 0 ? trimmed.slice(firstUser) : trimmed;
}
