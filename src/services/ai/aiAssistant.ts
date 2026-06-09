import { format, differenceInWeeks, differenceInHours, differenceInMinutes } from 'date-fns';
import { ChatMessage, Baby, DashboardStats, AIInsight, FeedEntry, SleepEntry, DiaperEntry } from '@types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface RecentLogs {
  feeds: FeedEntry[];
  sleep: SleepEntry[];
  diapers: DiaperEntry[];
}

// ─── System Prompt Builder ────────────────────────────────────────────────────
// Builds the full "dadi/nani" persona context sent on every call.

export function buildSystemPrompt(baby: Baby | null, logs: RecentLogs): string {
  const now = new Date();

  // ── Baby profile block ──
  let babyBlock = 'No baby profile added yet.';
  if (baby) {
    const ageWeeks = differenceInWeeks(now, baby.birthDate);
    const ageMonths = Math.floor(ageWeeks / 4.33);
    const genderWord = baby.gender === 'male' ? 'boy' : baby.gender === 'female' ? 'girl' : 'baby';
    babyBlock = [
      `Baby name: ${baby.name}`,
      `Age: ${ageWeeks} weeks (${ageMonths} months), ${baby.gender} ${genderWord}`,
      `Date of birth: ${format(baby.birthDate, 'dd MMM yyyy')}`,
      baby.birthWeight ? `Birth weight: ${baby.birthWeight} kg` : null,
      baby.bloodGroup ? `Blood group: ${baby.bloodGroup}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  // ── Recent activity block (last 5 of each type) ──
  const recentFeeds = logs.feeds.slice(0, 5);
  const recentSleep = logs.sleep.slice(0, 5);
  const recentDiapers = logs.diapers.slice(0, 3);

  const feedLines = recentFeeds.length
    ? recentFeeds.map(f => {
        const ago = differenceInHours(now, f.startTime);
        const dur = f.endTime
          ? `${differenceInMinutes(f.endTime, f.startTime)} min`
          : 'ongoing';
        const type = f.type === 'breastfeed'
          ? `Breastfeed (${f.side ?? 'both'})`
          : f.type === 'formula'
          ? `Formula ${f.amountMl ?? ''}ml`
          : `Solid (${f.foodType ?? ''})`;
        return `  • ${type} — ${ago}h ago, ${dur}`;
      }).join('\n')
    : '  • No feeds logged yet today';

  const sleepLines = recentSleep.length
    ? recentSleep.map(s => {
        const dur = s.endTime
          ? `${differenceInMinutes(s.endTime, s.startTime)} min`
          : 'currently sleeping';
        const ago = differenceInHours(now, s.startTime);
        return `  • ${ago}h ago — ${dur}`;
      }).join('\n')
    : '  • No sleep logged yet today';

  const diaperLines = recentDiapers.length
    ? recentDiapers.map(d => {
        const ago = differenceInHours(now, d.loggedAt);
        return `  • ${d.type} — ${ago}h ago`;
      }).join('\n')
    : '  • No diapers logged yet today';

  const lastFeedHoursAgo = recentFeeds.length
    ? differenceInHours(now, recentFeeds[0].startTime)
    : null;
  const lastFeedNote = lastFeedHoursAgo !== null && lastFeedHoursAgo > 3
    ? `⚠️ Last feed was ${lastFeedHoursAgo} hours ago — baby may be hungry soon.`
    : '';

  return `You are AI Guru — a warm, wise Indian parenting companion inside the BabySaathi app.
Your personality: Like a knowledgeable dadi/nani (grandmother) — caring, reassuring, practical.
You speak in natural Hinglish: mix Hindi and English the way Indian parents actually talk.
You reference Indian practices naturally: sarson ka tel massage, gripe water, kala tika, namkeen paani for colic, rice ka paani for first foods, khichdi weaning, etc.
You always know when to say "doctor se milna chahiye" (please see a doctor) — never give medical diagnoses.
You are personal — you always use the baby's name (not "baby") and reference their actual data.
You keep responses warm, concise, and practical. Use emojis sparingly but naturally.
Never start a response with "I" or "As an AI". Start directly with the advice or answer.

━━━ BABY PROFILE ━━━
${babyBlock}

━━━ RECENT ACTIVITY (last few logs) ━━━
Feeds (last 5):
${feedLines}

Sleep (last 5):
${sleepLines}

Diapers (last 3):
${diaperLines}

${lastFeedNote}

━━━ INSTRUCTIONS ━━━
• Always personalise responses with ${baby?.name ?? "the baby"}'s actual name and age.
• When activity data is available, reference it ("I can see ${baby?.name ?? 'baby'} fed 3 times today...").
• Adjust advice for age: newborn (0-3m), infant (3-8m), older infant (8-12m), toddler (12m+).
• For Indian parents: acknowledge grandparent advice respectfully, then give evidence-based guidance.
• End medical questions with a gentle reminder to consult a paediatrician.
• If asked about something outside parenting/baby care, redirect warmly.`;
}

// ─── Response Generator (context-aware rule engine + prompt-ready) ────────────

function buildResponse(
  userMessage: string,
  baby: Baby | null,
  stats: DashboardStats | null,
  logs: RecentLogs
): string {
  const msg = userMessage.toLowerCase();
  const name = baby?.name ?? 'baby';
  const now = new Date();
  const ageWeeks = baby ? differenceInWeeks(now, baby.birthDate) : 0;
  const ageMonths = Math.floor(ageWeeks / 4.33);

  const lastFeed = logs.feeds[0];
  const lastSleep = logs.sleep[0];
  const todayFeedCount = logs.feeds.filter(
    f => differenceInHours(now, f.startTime) < 24
  ).length;
  const todaySleepMin = logs.sleep
    .filter(s => differenceInHours(now, s.startTime) < 24 && s.endTime)
    .reduce((sum, s) => sum + differenceInMinutes(s.endTime!, s.startTime), 0);
  const todaySleepHrs = (todaySleepMin / 60).toFixed(1);

  // ── Cry / rona ──
  if (/(cry|crying|rona|rota|rot[aā]|rone|kyun ror?|kyon ror?)/.test(msg)) {
    const cryCount = stats?.cryEvents ?? 0;
    return `Arre ${name} ka rona bahut common hai, par har baar alag reason hota hai! 🤗

Aaj ${cryCount > 0 ? `${cryCount} cry events` : 'kuch'} detect hue. Check karo:

🍼 **Bhook (Hunger)** — ${lastFeed ? `Last feed ${differenceInHours(now, lastFeed.startTime)}h pehle tha. ${differenceInHours(now, lastFeed.startTime) > 2.5 ? 'Shayad bhookha hai!' : 'Abhi zyada time nahi hua.'}` : 'Last feed ka record nahi mila.'} Rhythmic, repetitive rona + sucking motion = bhook.

😴 **Thakaan (Overtiredness)** — ${todaySleepHrs}h aaj soye. ${parseFloat(todaySleepHrs) < 12 ? 'Thoda kam soye — shayad overtired hain.' : 'Sleep theek hai.'} Whiny, intermittent rona = neend chahiye.

💨 **Gas / Colic** — Aaj ${logs.diapers.length} diaper changes hue. Legs ko tummy ki taraf fold karo, clockwise massage karo.

😣 **Discomfort** — Diaper check karo, temperature theek hai? Room na zyada garam na zyada thanda.

Agar rona bahut high-pitched aur sudden ho — doctor se milna chahiye. 🙏

*AI Guru ki advice educational hai — serious concern pe paediatrician ko dikhao.*`;
  }

  // ── Sleep / neend ──
  if (/(sleep|nap|neend|neend|sona|soye|so r)/.test(msg)) {
    const needed = ageWeeks < 13 ? '14–17' : ageWeeks < 44 ? '12–15' : '11–14';
    const remaining = Math.max(0, (ageWeeks < 13 ? 16 : 14) - parseFloat(todaySleepHrs));
    return `😴 **${name} ki neend (${ageWeeks}w / ${ageMonths}m)**

Aaj ${todaySleepHrs}h soye ${logs.sleep.length} session mein.
${remaining > 0 ? `Aur ~${remaining.toFixed(1)}h baaki hai aaj ke goal ke liye.` : `✅ Aaj ka sleep goal reach ho gaya!`}

Is age ke liye chahiye: **${needed} hours/day**

**Tips:**
• Consistent bedtime routine banao — massage → song → feed → dark room
• Sleepy cues pakdo: yawning, eye rubbing, fussy hona
• White noise ya lori lagao (Chanda Mama, Aa Ja Nindiya)
• Room thoda dark aur cool rakho
${ageWeeks < 24 ? '• Daytime naps ignore mat karo — overtired baby zyada rone lagta hai' : '• 6m+ ke baad daytime nap slowly consolidate hogi'}

**Dadi tip:** Sarson tel se halka massage so jaane se pehle bahut helpful hota hai. 🌿

*Hamesha baby ko peeth ke bal sulao (back-to-sleep) — SIDS prevention ke liye.*`;
  }

  // ── Feeding / doodh ──
  if (/(feed|milk|doodh|formula|breast|nursing|khila|pilar?|solid|khana)/.test(msg)) {
    return `🍼 **${name} ki feeding (${ageWeeks}w / ${ageMonths}m)**

Aaj **${todayFeedCount} feeds** logged.${todayFeedCount < 6 ? ' ⚠️ Thoda kam — monitor karo.' : todayFeedCount >= 8 ? ' ✅ Bahut achha!' : ''}
${lastFeed ? `Last feed: ${differenceInHours(now, lastFeed.startTime)}h pehle (${lastFeed.type}).` : 'Aaj ka pehla feed abhi tak log nahi hua.'}

**Is age ke liye:**
${ageWeeks < 26
  ? `• Breastfeed: har **2–3 ghante** mein, din mein 8–12 baar\n• Formula: **60–90ml** per feed\n• Demand feeding — ${name} jab maange tab do`
  : ageWeeks < 52
  ? `• Solids shuru karo! **Dal ka paani, chawal ka paani, ragi porridge, kela mash**\n• Ek time mein ek naya food, 3 din wait karo allergy check ke liye\n• Breast/formula abhi bhi main rahega`
  : `• Table food — parivar ka khana (kam namak/masala)\n• Teen baar khana + 2 snacks\n• Cow milk 1 saal ke baad shuru kar sakte ho`}

**Dadi tip:** Khichdi ek perfect first food hai — dal + chawal, easily digestible. 🍲

*Force mat karo — hunger cues follow karo.*`;
  }

  // ── Vaccine / teeka ──
  if (/(vaccine|vaccination|teeka|टीका|immunization|shot)/.test(msg)) {
    const next = stats?.nextVaccine;
    return `💉 **${name} ka Vaccination**

${next ? `📅 **Agla teeka:** ${next.vaccineName} — ${format(new Date(next.scheduledDate), 'dd MMM yyyy')}` : '✅ Koi upcoming vaccine nahi dikhta abhi.'}

**India National Immunization Schedule:**
• Birth: BCG, OPV 0, Hep B
• 6 weeks: Pentavalent 1, PCV 1, Rotavirus 1
• 10 weeks: Pentavalent 2, PCV 2, Rotavirus 2
• 14 weeks: Pentavalent 3, PCV 3, Rotavirus 3
• 9 months: Measles-Rubella, JE 1
• 18 months: MR booster, DTP booster

**Teeke ke baad:**
• Fever normal hai (24–48h) — paracetamol de sakte ho agar discomfort ho
• Injection site pe thodi redness/swelling normal hai — warm compress
• Bahut zyada crying, high fever (>39°C) ya rash → doctor immediately

*Government health centers mein teeke free hain! 🇮🇳*`;
  }

  // ── Growth ──
  if (/(growth|weight|height|vikas|badh|bada|size|measure)/.test(msg)) {
    const latestWeight = stats?.lastWeight;
    return `📏 **${name} ki growth (${ageWeeks}w / ${ageMonths}m)**

${latestWeight ? `Latest weight: **${latestWeight} kg**` : 'Abhi tak weight log nahi hua — Growth Tracker mein add karo!'}

**Normal growth at ${ageMonths} months:**
${ageWeeks < 13
  ? '• Weight: **150–200g/week** gain\n• Height: ~2.5cm/month\n• Head: ~1.5cm/month'
  : ageWeeks < 26
  ? '• Weight gain thoda slow ho jaata hai — 100–150g/week\n• Height: ~2cm/month'
  : '• Weight: ~500g/month\n• Height: ~1.5cm/month'}

WHO growth charts follow karo — zyada important hai **trend** than single number.

**Dadi tip:** "Mota bachha = healthy bachha" wali soch purani hai. WHO chart check karo. 📊

*Agar weight gain bilkul nahi ho raha → paediatrician ko dikhao.*`;
  }

  // ── Milestone ──
  if (/(milestone|development|vikas|crawl|walk|talk|smile|babble|solid|sit|stand)/.test(msg)) {
    return `⭐ **${name} ke milestones (${ageMonths}m)**

${ageMonths < 2
  ? '• Smile responsively 😊\n• Follows moving objects with eyes\n• Recognises your voice'
  : ageMonths < 4
  ? '• Holds head up\n• Coos and makes sounds\n• Grabs at objects'
  : ageMonths < 6
  ? '• Rolls over!\n• Laughs out loud 😄\n• Reaches for objects'
  : ageMonths < 9
  ? '• Sits with support → without support\n• Babbles (ba-ba, da-da)\n• Object permanence starts'
  : ageMonths < 12
  ? '• Crawls 🐛\n• Pulls to stand\n• Waves bye-bye\n• Says mama/dada with meaning'
  : '• Walks (10–15 months normal)\n• 1–3 words with meaning\n• Points to things'}

Milestone Tracker mein achievements mark karo — celebrate karo! 🎉

*Har bachcha apni speed se develop karta hai. Slightly late milestones usually normal hain.*
*Agar bahut der ho raha ho → paediatrician se baat karo.*`;
  }

  // ── Default / fallback ──
  return `Haan, bol! Main AI Guru hoon — ${name} ke saath har cheez mein help karta hoon. 🧿

**Aaj ka summary for ${name} (${ageWeeks}w):**
🍼 Feeds: ${todayFeedCount} aaj
😴 Sleep: ${todaySleepHrs}h aaj
🧷 Diapers: ${logs.diapers.filter(d => differenceInHours(now, d.loggedAt) < 24).length} aaj
${lastFeed ? `⏱️ Last feed: ${differenceInHours(now, lastFeed.startTime)}h pehle` : ''}

**Kuch bhi puch sakte ho:**
• "Kyon ro raha hai?" (why is baby crying)
• "Kitni neend chahiye?" (how much sleep)
• "Agla teeka kab hai?" (next vaccine)
• "Kya khilana chahiye?" (what to feed)
• "Normal growth hai?" (normal growth?)

*Serious medical concerns ke liye hamesha doctor se milna chahiye. Main educational guidance deta hoon.*`;
}

// ─── Public Service ───────────────────────────────────────────────────────────

export class AIAssistantService {
  generateResponse(
    userMessage: string,
    baby: Baby | null,
    stats: DashboardStats | null,
    logs: RecentLogs = { feeds: [], sleep: [], diapers: [] }
  ): ChatMessage {
    const content = buildResponse(userMessage, baby, stats, logs);
    return {
      id: Date.now().toString(),
      role: 'assistant',
      content,
      timestamp: new Date(),
    };
  }

  // Returns the system prompt string for use with a real LLM API call.
  // Wire this into a Firebase Cloud Function that calls the Anthropic API.
  getSystemPrompt(baby: Baby | null, logs: RecentLogs): string {
    return buildSystemPrompt(baby, logs);
  }

  generateInsight(
    type: AIInsight['type'],
    babyId: string,
    data: Record<string, any>
  ): Omit<AIInsight, 'id' | 'createdAt'> {
    const insights: Record<string, Omit<AIInsight, 'id' | 'createdAt' | 'babyId'>> = {
      feeding: {
        type: 'feeding',
        title: 'Feeding Pattern',
        message: data.feedCount < 6
          ? `${data.babyName} ne aaj sirf ${data.feedCount} feeds liye — normal 8-12 hai. Monitor karo.`
          : `Bahut achha! ${data.babyName} ne aaj ${data.feedCount} feeds liye. ✅`,
        confidence: 85,
        actionable: data.feedCount < 6,
        action: data.feedCount < 6 ? 'Log a feed' : undefined,
      },
      sleep: {
        type: 'sleep',
        title: 'Sleep Prediction',
        message: `${data.babyName} ka pattern dekh ke lagta hai ${data.nextSleepIn} min mein neend aa sakti hai.`,
        confidence: 72,
        actionable: true,
        action: 'Start sleep tracker',
      },
      cry: {
        type: 'cry',
        title: 'Cry Pattern Update',
        message: `Aaj dominant cry type: ${data.dominantCry}. ${data.suggestion}`,
        confidence: data.confidence ?? 70,
        actionable: false,
      },
      growth: {
        type: 'growth',
        title: 'Growth Update',
        message: `${data.babyName} ka weight gain on track! Current: ${data.weight}kg. 📏`,
        confidence: 90,
        actionable: false,
      },
      general: {
        type: 'general',
        title: 'Daily Insight',
        message: data.message,
        confidence: 80,
        actionable: false,
      },
    };

    return { babyId, ...(insights[type] ?? insights.general) };
  }
}

export const aiAssistant = new AIAssistantService();
