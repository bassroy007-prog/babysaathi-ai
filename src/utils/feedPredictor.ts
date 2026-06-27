import { differenceInMinutes, addMinutes } from 'date-fns';
import { FeedEntry } from '@types/index';

export interface FeedPrediction {
  predictedAt: Date;
  avgIntervalMinutes: number;
  lastFeedTime: Date;
  basedOnFeeds: number;
  confidence: 'high' | 'medium' | 'low';
}

// Exponential weights: most recent interval matters most
const WEIGHTS = [1.0, 0.7, 0.49, 0.34, 0.24];

export function predictNextFeed(feeds: FeedEntry[]): FeedPrediction | null {
  // Solids have unpredictable intervals — only liquid feeds form a pattern
  const liquid = feeds
    .filter((f) => f.type !== 'solid')
    .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

  if (liquid.length < 2) return null;

  // Take up to 6 recent feeds to compute up to 5 intervals
  const recent = liquid.slice(0, 6);
  const intervals: number[] = [];
  for (let i = 0; i < recent.length - 1; i++) {
    const gap = differenceInMinutes(recent[i].startTime, recent[i + 1].startTime);
    // Sanity bounds: 30 min – 8 hours
    if (gap >= 30 && gap <= 480) intervals.push(gap);
  }

  if (intervals.length === 0) return null;

  // Weighted average with exponential decay
  const useWeights = WEIGHTS.slice(0, intervals.length);
  const totalWeight = useWeights.reduce((s, w) => s + w, 0);
  const avgInterval = intervals.reduce((s, gap, i) => s + gap * useWeights[i], 0) / totalWeight;

  // Confidence: low variance → high confidence
  const variance = intervals.reduce((s, gap) => s + (gap - avgInterval) ** 2, 0) / intervals.length;
  const cv = Math.sqrt(variance) / avgInterval; // coefficient of variation
  const confidence: FeedPrediction['confidence'] = cv < 0.15 ? 'high' : cv < 0.30 ? 'medium' : 'low';

  return {
    predictedAt: addMinutes(recent[0].startTime, Math.round(avgInterval)),
    avgIntervalMinutes: Math.round(avgInterval),
    lastFeedTime: recent[0].startTime,
    basedOnFeeds: intervals.length,
    confidence,
  };
}

export function formatInterval(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

export function formatCountdown(minutesLeft: number): { text: string; isOverdue: boolean } {
  if (minutesLeft <= 0) {
    const overdue = Math.abs(minutesLeft);
    return { text: overdue === 0 ? 'Feed time!' : `Overdue by ${formatInterval(overdue)}`, isOverdue: true };
  }
  return { text: `Feed in ${formatInterval(minutesLeft)}`, isOverdue: false };
}
