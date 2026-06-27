import {
  differenceInMinutes, format, getHours, subDays,
  startOfDay, endOfDay, eachDayOfInterval, startOfWeek, getWeek,
} from 'date-fns';
import { Baby, FeedEntry } from '@types/index';
import { getFeeds } from '@services/firebase/firestore';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DailyCount { label: string; date: Date; count: number }
export interface WeeklyAvg  { week: string; avg: number }
export interface Stretch    { startTime: Date; endTime: Date; minutes: number }
export interface ClusterDay { date: string; windowCount: number }

export interface FeedAnalyticsData {
  days:               number;
  startDate:          Date;
  endDate:            Date;
  totalFeeds:         number;
  avgFeedsPerDay:     number;
  avgIntervalMins:    number;
  // Type breakdown
  breastCount:        number;
  formulaCount:       number;
  solidCount:         number;
  breastPct:          number;
  formulaPct:         number;
  solidPct:           number;
  avgFormulaAmountMl: number | null;
  avgBreastDurationMins: number | null;
  // 24-hour distribution
  hourDistribution:   number[];    // length 24
  maxHourCount:       number;
  peakHour:           number;
  // Night feeds (22:00–06:00)
  nightFeedCount:     number;
  nightFeedPct:       number;
  daysWithZeroNightFeeds: number;
  // Daily chart data
  dailyCounts:        DailyCount[];
  weeklyAvgs:         WeeklyAvg[];   // for 30-day view
  // Longest stretches between feeds
  longestStretches:   Stretch[];
  avgStretchMins:     number;
  // Cluster feeding (3+ feeds in 3h window)
  clusterDays:        ClusterDay[];
  // Consolidation trend
  trendDirection:     'consolidating' | 'stable' | 'increasing';
  trendNote:          string;
  firstWeekAvg:       number;
  lastWeekAvg:        number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const NIGHT_HOURS = new Set([22, 23, 0, 1, 2, 3, 4, 5]);

function isNightFeed(date: Date): boolean {
  return NIGHT_HOURS.has(getHours(date));
}

// Detect cluster feeding: 3+ feeds in any 3-hour sliding window within a day
function detectCluster(dayFeeds: FeedEntry[]): boolean {
  const times = dayFeeds.map((f) => f.startTime.getTime()).sort((a, b) => a - b);
  for (let i = 0; i < times.length - 2; i++) {
    if (times[i + 2] - times[i] <= 3 * 60 * 60 * 1000) return true;
  }
  return false;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export async function fetchFeedAnalytics(baby: Baby, days: number): Promise<FeedAnalyticsData | null> {
  const endDate   = endOfDay(new Date());
  const startDate = startOfDay(subDays(endDate, days - 1));

  const raw = await getFeeds(baby.id, startDate, endDate);

  // Reject entries with invalid/future dates, or obvious data-entry errors
  const now = new Date();
  const entries = raw.filter((f) => {
    if (!(f.startTime instanceof Date) || isNaN(f.startTime.getTime())) return false;
    if (f.startTime > now) return false;                          // future-dated
    if (f.startTime < startDate) return false;                   // outside range
    return true;
  });

  if (entries.length === 0) return null;

  // Sort oldest first for interval / stretch calculations
  const sorted = [...entries].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

  // ── Type breakdown ────────────────────────────────────────────────────────
  const breastEntries  = sorted.filter((f) => f.type === 'breastfeed');
  const formulaEntries = sorted.filter((f) => f.type === 'formula');
  const solidEntries   = sorted.filter((f) => f.type === 'solid');
  const total          = sorted.length;

  const avgFormulaAmountMl = formulaEntries.length > 0 && formulaEntries.some((f) => f.amount)
    ? Math.round(formulaEntries.filter((f) => f.amount).reduce((s, f) => s + f.amount!, 0) / formulaEntries.filter((f) => f.amount).length)
    : null;

  const withDuration    = breastEntries.filter((f) => f.duration && f.duration > 0);
  const avgBreastDurationMins = withDuration.length > 0
    ? Math.round(withDuration.reduce((s, f) => s + f.duration!, 0) / withDuration.length)
    : null;

  // ── Hour distribution ─────────────────────────────────────────────────────
  const hourDistribution = new Array(24).fill(0);
  for (const f of sorted) hourDistribution[getHours(f.startTime)]++;
  const maxHourCount = Math.max(...hourDistribution);
  const peakHour     = hourDistribution.indexOf(maxHourCount);

  // ── Night feeds ───────────────────────────────────────────────────────────
  const nightFeeds     = sorted.filter((f) => isNightFeed(f.startTime));
  const nightFeedCount = nightFeeds.length;
  const nightFeedPct   = total > 0 ? Math.round((nightFeedCount / total) * 100) : 0;

  // ── Daily counts ──────────────────────────────────────────────────────────
  const allDays        = eachDayOfInterval({ start: startDate, end: endDate });
  const dayMap         = new Map<string, number>();
  for (const f of sorted) dayMap.set(format(f.startTime, 'yyyy-MM-dd'), (dayMap.get(format(f.startTime, 'yyyy-MM-dd')) ?? 0) + 1);

  const dailyCounts: DailyCount[] = allDays.map((d) => ({
    date:  d,
    label: days <= 7 ? format(d, 'EEE') : format(d, 'd/M'),
    count: dayMap.get(format(d, 'yyyy-MM-dd')) ?? 0,
  }));

  const daysWithZeroNightFeeds = allDays.filter((d) => {
    const key    = format(d, 'yyyy-MM-dd');
    const dayFds = sorted.filter((f) => format(f.startTime, 'yyyy-MM-dd') === key);
    return dayFds.length > 0 && dayFds.every((f) => !isNightFeed(f.startTime));
  }).length;

  // ── Weekly averages (for 30-day view) ────────────────────────────────────
  const weekMap = new Map<string, number[]>();
  for (const d of dailyCounts) {
    const wk = `W${getWeek(d.date)}`;
    if (!weekMap.has(wk)) weekMap.set(wk, []);
    weekMap.get(wk)!.push(d.count);
  }
  const weeklyAvgs: WeeklyAvg[] = Array.from(weekMap.entries()).map(([week, counts]) => ({
    week,
    avg: Math.round((counts.reduce((s, c) => s + c, 0) / counts.length) * 10) / 10,
  }));

  // ── Average interval ──────────────────────────────────────────────────────
  let totalIntervalMins = 0;
  let intervalCount     = 0;
  for (let i = 1; i < sorted.length; i++) {
    const gap = differenceInMinutes(sorted[i].startTime, sorted[i - 1].startTime);
    if (gap > 10 && gap < 600) { totalIntervalMins += gap; intervalCount++; }
  }
  const avgIntervalMins = intervalCount > 0 ? Math.round(totalIntervalMins / intervalCount) : 0;

  // ── Longest stretches (top 3 gaps) ───────────────────────────────────────
  const stretches: Stretch[] = [];
  for (let i = 1; i < sorted.length; i++) {
    const mins = differenceInMinutes(sorted[i].startTime, sorted[i - 1].startTime);
    if (mins > 60) {
      stretches.push({
        startTime: sorted[i - 1].startTime,
        endTime:   sorted[i].startTime,
        minutes:   mins,
      });
    }
  }
  stretches.sort((a, b) => b.minutes - a.minutes);
  const longestStretches = stretches.slice(0, 3);

  const avgStretchMins = stretches.length > 0
    ? Math.round(stretches.reduce((s, st) => s + st.minutes, 0) / stretches.length)
    : avgIntervalMins;

  // ── Cluster feeding ───────────────────────────────────────────────────────
  const clusterDays: ClusterDay[] = [];
  for (const d of allDays) {
    const key     = format(d, 'yyyy-MM-dd');
    const dayFds  = sorted.filter((f) => format(f.startTime, 'yyyy-MM-dd') === key);
    if (dayFds.length >= 3 && detectCluster(dayFds)) {
      clusterDays.push({ date: format(d, 'd MMM'), windowCount: dayFds.length });
    }
  }

  // ── Consolidation trend ───────────────────────────────────────────────────
  const half          = Math.floor(days / 2);
  const firstHalf     = dailyCounts.slice(0, half);
  const secondHalf    = dailyCounts.slice(half);
  const firstWeekAvg  = firstHalf.reduce((s, d) => s + d.count, 0) / Math.max(1, firstHalf.length);
  const lastWeekAvg   = secondHalf.reduce((s, d) => s + d.count, 0) / Math.max(1, secondHalf.length);
  const delta         = lastWeekAvg - firstWeekAvg;

  let trendDirection: FeedAnalyticsData['trendDirection'];
  let trendNote: string;
  if (delta < -0.8) {
    trendDirection = 'consolidating';
    trendNote      = `Feeds have decreased by ~${Math.abs(delta).toFixed(1)}/day — feeding is consolidating nicely.`;
  } else if (delta > 0.8) {
    trendDirection = 'increasing';
    trendNote      = `Feeds have increased by ~${delta.toFixed(1)}/day — could be a growth spurt or cluster feeding.`;
  } else {
    trendDirection = 'stable';
    trendNote      = 'Feed frequency is holding steady across this period.';
  }

  return {
    days, startDate, endDate, totalFeeds: total,
    avgFeedsPerDay: Math.round((total / days) * 10) / 10,
    avgIntervalMins,
    breastCount: breastEntries.length,
    formulaCount: formulaEntries.length,
    solidCount: solidEntries.length,
    breastPct:  Math.round((breastEntries.length / total) * 100),
    formulaPct: Math.round((formulaEntries.length / total) * 100),
    solidPct:   Math.round((solidEntries.length / total) * 100),
    avgFormulaAmountMl, avgBreastDurationMins,
    hourDistribution, maxHourCount, peakHour,
    nightFeedCount, nightFeedPct, daysWithZeroNightFeeds,
    dailyCounts, weeklyAvgs,
    longestStretches, avgStretchMins,
    clusterDays,
    trendDirection, trendNote, firstWeekAvg, lastWeekAvg,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

export function formatMins(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60), m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function hourLabel(h: number): string {
  if (h === 0)  return '12am';
  if (h < 12)   return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

// ─── WhatsApp share ───────────────────────────────────────────────────────────

export function buildFeedAnalyticsText(d: FeedAnalyticsData, babyName: string): string {
  const lines = [
    `🍼 *${babyName}'s Feeding Analytics (${d.days} days)*`,
    ``,
    `*Total feeds:* ${d.totalFeeds}`,
    `*Average:* ${d.avgFeedsPerDay} feeds/day`,
    `*Avg gap between feeds:* ${formatMins(d.avgIntervalMins)}`,
    ``,
    `*Feed types:*`,
    d.breastCount  > 0 ? `🤱 Breastfeed: ${d.breastPct}% (${d.breastCount}${d.avgBreastDurationMins ? ` · avg ${d.avgBreastDurationMins} min` : ''})` : '',
    d.formulaCount > 0 ? `🍼 Formula: ${d.formulaPct}% (${d.formulaCount}${d.avgFormulaAmountMl ? ` · avg ${d.avgFormulaAmountMl} ml` : ''})` : '',
    d.solidCount   > 0 ? `🥄 Solids: ${d.solidPct}% (${d.solidCount})` : '',
    ``,
    `*Night feeds (10pm–6am):* ${d.nightFeedCount} (${d.nightFeedPct}%)`,
    `*Days with zero night feeds:* ${d.daysWithZeroNightFeeds}`,
    `*Peak feeding hour:* ${hourLabel(d.peakHour)}`,
    ``,
    d.longestStretches.length > 0 ? `*Longest stretch:* ${formatMins(d.longestStretches[0].minutes)}` : '',
    d.clusterDays.length > 0 ? `*Cluster feeding detected on:* ${d.clusterDays.map((c) => c.date).join(', ')}` : '',
    ``,
    `*Trend:* ${d.trendNote}`,
    ``,
    `_Generated by BabySaathi 💙_`,
  ].filter(Boolean);
  return lines.join('\n');
}
