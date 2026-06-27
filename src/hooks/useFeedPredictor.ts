import { useState, useEffect, useMemo } from 'react';
import { differenceInMinutes } from 'date-fns';
import { useTrackerStore } from '@store/trackerStore';
import { predictNextFeed, formatCountdown, FeedPrediction } from '@utils/feedPredictor';

export interface FeedPredictorState {
  prediction: FeedPrediction | null;
  minutesLeft: number | null;
  countdownText: string;
  isOverdue: boolean;
  progressPercent: number; // 0–100: how far we are through the predicted interval
}

export function useFeedPredictor(): FeedPredictorState {
  const feeds = useTrackerStore((s) => s.feeds);
  const [tick, setTick] = useState(0);

  // Tick every 60 s to refresh the countdown
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const prediction = useMemo(() => predictNextFeed(feeds), [feeds]);

  const now = new Date();

  const minutesLeft = prediction
    ? differenceInMinutes(prediction.predictedAt, now)
    : null;

  const { text: countdownText, isOverdue } =
    minutesLeft !== null
      ? formatCountdown(minutesLeft)
      : { text: 'Not enough data', isOverdue: false };

  const progressPercent = useMemo(() => {
    if (!prediction) return 0;
    const elapsed = differenceInMinutes(now, prediction.lastFeedTime);
    return Math.min(100, Math.round((elapsed / prediction.avgIntervalMinutes) * 100));
  }, [prediction, tick]); // eslint-disable-line react-hooks/exhaustive-deps

  return { prediction, minutesLeft, countdownText, isOverdue, progressPercent };
}
