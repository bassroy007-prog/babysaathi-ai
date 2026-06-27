import { differenceInMinutes, format, getHours, getMinutes, subDays, startOfDay, endOfDay } from 'date-fns';
import { Baby } from '@types/index';
import { getFeeds } from '@services/firebase/firestore';
import { getAgeBand, AgeBand } from '@constants/scheduleGuide';
import { differenceInWeeks } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BlockType = 'wake' | 'play' | 'feed' | 'nap' | 'bedtime_routine' | 'night_sleep' | 'night_feed';

export interface ScheduleBlock {
  id:           string;
  type:         BlockType;
  label:        string;
  detail?:      string;
  icon:         string;
  startMins:    number;   // minutes from midnight (can be >1440 for next-day blocks)
  durationMins: number;
  color:        string;   // text / border color
  bg:           string;   // background color
}

export interface ScheduleData {
  baby:                Baby;
  ageBand:             AgeBand;
  ageWeeks:            number;
  detectedWakeMins:    number;     // minutes from midnight
  detectedWakeLabel:   string;     // "07:15 AM"
  avgFeedIntervalMins: number;
  dataConfidence:      'detected' | 'default';   // whether wake was from real data
  blocks:              ScheduleBlock[];
  totalSleepMins:      number;
  totalNapMins:        number;
  nightSleepMins:      number;
}

// ─── Block colour palette ─────────────────────────────────────────────────────

const COLORS: Record<BlockType, { color: string; bg: string }> = {
  wake:            { color: '#92400E', bg: '#FFFBEB' },
  play:            { color: '#065F46', bg: '#ECFDF5' },
  feed:            { color: '#9A3412', bg: '#FFF7ED' },
  nap:             { color: '#1D4ED8', bg: '#EFF6FF' },
  bedtime_routine: { color: '#6D28D9', bg: '#F5F3FF' },
  night_sleep:     { color: '#C4B5FD', bg: '#2E1065' },
  night_feed:      { color: '#DDD6FE', bg: '#4C1D95' },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function minsToLabel(mins: number): string {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

function block(
  id: string, type: BlockType, label: string, icon: string,
  startMins: number, durationMins: number, detail?: string,
): ScheduleBlock {
  return { id, type, label, detail, icon, startMins, durationMins, ...COLORS[type] };
}

// ─── Schedule builder ─────────────────────────────────────────────────────────

export async function buildSchedule(baby: Baby): Promise<ScheduleData> {
  const ageWeeks = differenceInWeeks(new Date(), baby.birthDate);
  const ageBand  = getAgeBand(ageWeeks);

  // ── Detect wake time from last 7 days of feed data ────────────────────────
  let detectedWakeMins  = 7 * 60;   // default 7:00 AM
  let avgFeedIntervalMins = Math.round((ageBand.wakeWindowMin + ageBand.wakeWindowMax) / 2) + 15;
  let dataConfidence: ScheduleData['dataConfidence'] = 'default';

  try {
    const end   = endOfDay(new Date());
    const start = startOfDay(subDays(end, 7));
    const feeds = await getFeeds(baby.id, start, end);

    if (feeds.length >= 3) {
      // Group by day, find earliest feed per day
      const dayMap = new Map<string, number>();   // date key → earliest feed time in mins
      for (const f of feeds) {
        const key  = format(f.startTime, 'yyyy-MM-dd');
        const mins = getHours(f.startTime) * 60 + getMinutes(f.startTime);
        // Only consider feeds between 4am and 10am as "wake signal"
        if (mins >= 240 && mins <= 600) {
          if (!dayMap.has(key) || mins < dayMap.get(key)!) dayMap.set(key, mins);
        }
      }
      const wakeTimes = Array.from(dayMap.values()).sort((a, b) => a - b);
      if (wakeTimes.length >= 2) {
        const median = wakeTimes[Math.floor(wakeTimes.length / 2)];
        detectedWakeMins = median;
        dataConfidence   = 'detected';
      }

      // Avg feed interval from recent feeds
      const sorted = [...feeds].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
      let total = 0, count = 0;
      for (let i = 1; i < sorted.length; i++) {
        const gap = differenceInMinutes(sorted[i].startTime, sorted[i - 1].startTime);
        if (gap > 30 && gap < 360) { total += gap; count++; }
      }
      if (count > 0) avgFeedIntervalMins = Math.round(total / count);
    }
  } catch {
    // Fall through to defaults
  }

  // ── Build schedule blocks ─────────────────────────────────────────────────
  const blocks: ScheduleBlock[] = [];
  let t = detectedWakeMins;

  // Morning wake + first feed
  blocks.push(block('wake0', 'wake', 'Wake up & Morning Feed', '☀️', t, 30, 'First feed of the day'));
  t += 30;

  const avgWakeWindow   = Math.round((ageBand.wakeWindowMin + ageBand.wakeWindowMax) / 2);
  const avgNapDur       = Math.round((ageBand.napDurMin + ageBand.napDurMax) / 2);

  for (let i = 0; i < ageBand.napsPerDay; i++) {
    const isLast        = i === ageBand.napsPerDay - 1;
    // Last nap of 3+ nap schedule = short catnap
    const thisNapDur    = isLast && ageBand.napsPerDay >= 3 ? 45 : avgNapDur;
    const playDuration  = avgWakeWindow - 15;  // subtract pre-nap feed time

    // Play / activity window
    if (playDuration > 0) {
      blocks.push(block(
        `play${i}`, 'play',
        i === 0 ? 'Morning Activity' : isLast ? 'Evening Play' : 'Play & Explore',
        '🎯', t, playDuration,
        `Wake window: ${ageBand.wakeWindowMin}–${ageBand.wakeWindowMax} min`,
      ));
      t += playDuration;
    }

    // Pre-nap feed
    blocks.push(block(`feed${i}`, 'feed', 'Feed', '🍼', t, 15,
      isLast && ageBand.napsPerDay >= 3 ? 'Small top-up before catnap' : 'Pre-nap feed'));
    t += 15;

    // Nap
    const napLabel = ageBand.napsPerDay === 1 ? 'Afternoon Nap'
      : isLast && ageBand.napsPerDay >= 3 ? 'Catnap'
      : i === 0 ? 'Morning Nap' : 'Afternoon Nap';

    blocks.push(block(
      `nap${i}`, 'nap', napLabel, '😴', t, thisNapDur,
      `Target: ${ageBand.napDurMin}–${ageBand.napDurMax} min`,
    ));
    t += thisNapDur;
  }

  // Post-last-nap wake window + optional afternoon feed
  const postNapPlay = Math.max(30, avgWakeWindow - 30);
  blocks.push(block('playLast', 'play', 'Wind-Down Play', '🧸', t, postNapPlay, 'Quiet, calm activities'));
  t += postNapPlay;

  // Bedtime feed + routine
  blocks.push(block('btFeed', 'feed', 'Bedtime Feed', '🍼', t, 20, 'Last milk feed of the day'));
  t += 20;

  blocks.push(block('routine', 'bedtime_routine', 'Bedtime Routine', '🛁', t, 30,
    'Bath → massage → story → sleep'));
  t += 30;

  // Night sleep (runs until next morning's wake time + 24h)
  const nightSleepStart = t;
  const nightSleepEnd   = detectedWakeMins + 24 * 60;
  const nightSleepDur   = nightSleepEnd - nightSleepStart;
  blocks.push(block('nightsleep', 'night_sleep', 'Night Sleep', '🌙', nightSleepStart, nightSleepDur,
    `${ageBand.nightSleepMin}–${ageBand.nightSleepMax}h overnight`));

  // Night feeds
  if (ageBand.nightFeeds > 0) {
    const spacing = nightSleepDur / (ageBand.nightFeeds + 1);
    for (let i = 0; i < ageBand.nightFeeds; i++) {
      const nfTime = nightSleepStart + Math.round(spacing * (i + 1));
      blocks.push(block(`nf${i}`, 'night_feed', `Night Feed ${i + 1}`, '🌙', nfTime, 15,
        'Keep lights dim, minimal stimulation'));
    }
  }

  // Sort by startMins
  blocks.sort((a, b) => a.startMins - b.startMins);

  // ── Totals ────────────────────────────────────────────────────────────────
  const napBlocks       = blocks.filter((b) => b.type === 'nap');
  const totalNapMins    = napBlocks.reduce((s, b) => s + b.durationMins, 0);
  const nightSleepMins  = nightSleepDur;
  const totalSleepMins  = totalNapMins + nightSleepMins;

  return {
    baby, ageBand, ageWeeks, dataConfidence,
    detectedWakeMins,
    detectedWakeLabel:  minsToLabel(detectedWakeMins),
    avgFeedIntervalMins,
    blocks,
    totalSleepMins, totalNapMins, nightSleepMins,
  };
}

// ─── Exported helper ──────────────────────────────────────────────────────────

export function minsToTime(mins: number): string {
  const normalized = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  const period = h < 12 ? 'AM' : 'PM';
  const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${displayH}:${String(m).padStart(2, '0')} ${period}`;
}

export function formatDuration(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function buildScheduleText(d: ScheduleData): string {
  const lines = [
    `🕐 *${d.baby.name}'s Daily Schedule (${d.ageBand.label})*`,
    ``,
    ...d.blocks.map((b) =>
      `${minsToTime(b.startMins).padEnd(10)} ${b.icon} ${b.label}${b.durationMins < 1440 ? ` (${formatDuration(b.durationMins)})` : ''}`
    ),
    ``,
    `*Total sleep:* ${formatDuration(d.totalSleepMins)} · *Naps:* ${formatDuration(d.totalNapMins)}`,
    `*Wake time:* ${d.detectedWakeLabel} (${d.dataConfidence === 'detected' ? 'from your data' : 'default'})`,
    ``,
    `_Generated by BabySaathi 💙_`,
  ];
  return lines.join('\n');
}
