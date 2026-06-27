import { useEffect } from 'react';
import { differenceInMinutes, differenceInWeeks } from 'date-fns';

import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import { getAgeBand } from '@constants/scheduleGuide';
import { getVaccinations } from '@services/firebase/firestore';
import {
  requestNotificationPermissions,
  scheduleFeedReminder,
  scheduleSleepWindowAlert,
  scheduleVaccineAlerts,
} from '@services/notifications';

export function useNotifications(): void {
  const { activeBaby } = useBabyStore();
  const { feeds, sleepEntries } = useTrackerStore();

  // Request permissions once on first mount
  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  // Re-schedule feed reminder whenever feeds list changes
  useEffect(() => {
    if (!activeBaby || !feeds || feeds.length === 0) return;

    const valid  = feeds.filter((f) => f.startTime instanceof Date && !isNaN(f.startTime.getTime()));
    if (valid.length === 0) return;

    const sorted = [...valid].sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    const lastFeed = sorted[0];

    // Compute avg interval from last 10 feeds (30m–6h gaps only)
    let total = 0, count = 0;
    for (let i = 1; i < Math.min(sorted.length, 10); i++) {
      const gap = differenceInMinutes(sorted[i - 1].startTime, sorted[i].startTime);
      if (gap >= 30 && gap <= 360) { total += gap; count++; }
    }
    const avgInterval = count > 0 ? Math.round(total / count) : 120;

    scheduleFeedReminder(activeBaby.name, lastFeed.startTime, avgInterval);
  }, [activeBaby?.id, feeds]);

  // Re-schedule sleep window alert when a sleep entry completes
  useEffect(() => {
    if (!activeBaby || !sleepEntries || sleepEntries.length === 0) return;

    const ageWeeks     = differenceInWeeks(new Date(), activeBaby.birthDate);
    const ageBand      = getAgeBand(ageWeeks);
    const avgWakeWindow = Math.round((ageBand.wakeWindowMin + ageBand.wakeWindowMax) / 2);

    const completed = [...sleepEntries]
      .filter((s) => s.endTime instanceof Date && !isNaN(s.endTime.getTime()))
      .sort((a, b) => b.endTime!.getTime() - a.endTime!.getTime());

    if (completed.length > 0) {
      scheduleSleepWindowAlert(activeBaby.name, completed[0].endTime!, avgWakeWindow);
    }
  }, [activeBaby?.id, sleepEntries]);

  // Schedule vaccine alerts when baby changes
  useEffect(() => {
    if (!activeBaby) return;
    getVaccinations(activeBaby.id)
      .then((vaccinations) => scheduleVaccineAlerts(activeBaby.name, vaccinations))
      .catch(() => {});
  }, [activeBaby?.id]);
}
