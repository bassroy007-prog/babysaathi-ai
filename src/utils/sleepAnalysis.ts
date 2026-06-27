import { SleepEntry, SleepQuality } from '@types/index';
import { format, startOfDay, isToday, isYesterday } from 'date-fns';

export interface DailySleepData {
  date: Date;
  dateLabel: string;
  napMinutes: number;
  nightMinutes: number;
  totalMinutes: number;
  quality: SleepQuality | null;
  entries: SleepEntry[];
}

export interface SleepStats {
  avgTotalHours: number;
  avgNightHours: number;
  avgNapHours: number;
  avgBedtimeHour: number;
  longestStretch: number; // minutes
}

// Night sleep = starts between 7 PM and 7 AM
function isNightSleep(entry: SleepEntry): boolean {
  const hour = (entry.startTime instanceof Date ? entry.startTime : new Date(entry.startTime)).getHours();
  return hour >= 19 || hour < 7;
}

function normEntry(e: SleepEntry): SleepEntry {
  return {
    ...e,
    startTime: e.startTime instanceof Date ? e.startTime : new Date(e.startTime),
    endTime: e.endTime ? (e.endTime instanceof Date ? e.endTime : new Date(e.endTime)) : undefined,
  };
}

export function getDailySleepData(rawEntries: SleepEntry[], days = 7): DailySleepData[] {
  const entries = rawEntries.map(normEntry);
  const now = new Date();
  const result: DailySleepData[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = startOfDay(date);
    const dayEnd = new Date(dayStart.getTime() + 86_400_000);

    const dayEntries = entries.filter((e) => e.startTime >= dayStart && e.startTime < dayEnd);

    let napMinutes = 0;
    let nightMinutes = 0;
    dayEntries.forEach((e) => {
      const dur = e.duration ?? 0;
      if (isNightSleep(e)) nightMinutes += dur;
      else napMinutes += dur;
    });

    const qualities = dayEntries.map((e) => e.quality).filter(Boolean) as SleepQuality[];
    const quality: SleepQuality | null =
      qualities.includes('good') ? 'good' :
      qualities.includes('fair') ? 'fair' :
      qualities.includes('poor') ? 'poor' : null;

    result.push({
      date,
      dateLabel: isToday(date) ? 'Today' : isYesterday(date) ? 'Yest' : format(date, 'EEE'),
      napMinutes,
      nightMinutes,
      totalMinutes: napMinutes + nightMinutes,
      quality,
      entries: dayEntries,
    });
  }

  return result;
}

export function getSleepStats(rawEntries: SleepEntry[], days = 7): SleepStats {
  const entries = rawEntries.map(normEntry);
  const daily = getDailySleepData(entries, days);
  const withData = daily.filter((d) => d.totalMinutes > 0);

  const avg = (key: keyof Pick<DailySleepData, 'totalMinutes' | 'nightMinutes' | 'napMinutes'>) =>
    withData.length ? withData.reduce((s, d) => s + d[key], 0) / withData.length : 0;

  // Bedtime: earliest night-sleep start hour per day, normalised so 0AM → 24
  const bedtimes: number[] = [];
  daily.forEach((d) => {
    const nightEntries = d.entries.filter(isNightSleep).filter((e) => (e.startTime.getHours() >= 18));
    if (!nightEntries.length) return;
    const sorted = [...nightEntries].sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
    const h = sorted[0].startTime.getHours() + sorted[0].startTime.getMinutes() / 60;
    bedtimes.push(h);
  });
  const avgBedtimeHour = bedtimes.length
    ? bedtimes.reduce((s, h) => s + h, 0) / bedtimes.length
    : 21;

  const longestStretch = entries.reduce((max, e) => Math.max(max, e.duration ?? 0), 0);

  return {
    avgTotalHours: avg('totalMinutes') / 60,
    avgNightHours: avg('nightMinutes') / 60,
    avgNapHours:   avg('napMinutes') / 60,
    avgBedtimeHour,
    longestStretch,
  };
}

export function getRecommendedSleep(ageWeeks: number): { min: number; max: number; label: string } {
  if (ageWeeks < 13) return { min: 14, max: 17, label: '0–3 months' };
  if (ageWeeks < 48) return { min: 12, max: 15, label: '3–11 months' };
  return { min: 11, max: 14, label: '12–24 months' };
}

export function getSleepTip(ageWeeks: number, avgNightHours: number, avgNapHours: number): string {
  if (ageWeeks < 8)
    return 'Newborns need feeding every 2–3 hours — short cycles are completely normal at this age.';
  if (ageWeeks < 16 && avgNapHours > 5)
    return 'Naps after 4 PM may shift night sleep later. Try capping late-afternoon naps to 45 minutes.';
  if (ageWeeks >= 16 && ageWeeks < 36 && avgNightHours < 7)
    return 'Methods like Ferber or "chair method" are safe to explore from 4 months — ask your paediatrician.';
  if (ageWeeks >= 36 && avgNapHours === 0)
    return 'Most babies still need 1–2 naps at this age. Watch for overtiredness: eye-rubbing and fussiness.';
  if (avgNightHours >= 10)
    return 'Great night sleep! Consistency is key — keep bedtime within 30 minutes of the same time nightly.';
  return 'A calming routine (bath → feed → song) signals sleep time and can lengthen night stretches.';
}

export function formatBedtime(hourDecimal: number): string {
  const h = ((hourDecimal % 24) + 24) % 24;
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  const display12 = hrs > 12 ? hrs - 12 : hrs === 0 ? 12 : hrs;
  const ampm = hrs >= 12 ? 'PM' : 'AM';
  return `${display12}:${mins.toString().padStart(2, '0')} ${ampm}`;
}

// Group 28 days into 4 weekly averages (oldest → newest)
export function getWeeklyTrend(rawEntries: SleepEntry[]): Array<{ x: string; y: number }> {
  const daily28 = getDailySleepData(rawEntries, 28);
  return [3, 2, 1, 0].map((weeksAgo) => {
    const slice = daily28.slice(weeksAgo * 7, (weeksAgo + 1) * 7);
    const withData = slice.filter((d) => d.totalMinutes > 0);
    const avg = withData.length ? slice.reduce((s, d) => s + d.totalMinutes, 0) / slice.length / 60 : 0;
    return { x: `W${4 - weeksAgo}`, y: parseFloat(avg.toFixed(1)) };
  });
}
