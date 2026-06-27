import * as Notifications from 'expo-notifications';
import { addMinutes, format } from 'date-fns';

// Configure how notifications are handled when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const FEED_REMINDER_ID  = 'babysaathi_feed_reminder';
const SLEEP_WINDOW_ID   = 'babysaathi_sleep_window';
const VACCINE_PREFIX    = 'babysaathi_vaccine_';

// ─── Permissions ──────────────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── Feed reminder ────────────────────────────────────────────────────────────

export async function scheduleFeedReminder(
  babyName: string,
  lastFeedTime: Date,
  avgIntervalMins: number,
): Promise<void> {
  if (!(await hasNotificationPermission())) return;
  if (!(lastFeedTime instanceof Date) || isNaN(lastFeedTime.getTime())) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(FEED_REMINDER_ID);

    const nextFeed    = addMinutes(lastFeedTime, avgIntervalMins);
    const reminderAt  = addMinutes(nextFeed, -10);  // 10 min early heads-up
    if (reminderAt <= new Date()) return;

    const h = Math.floor(avgIntervalMins / 60);
    const m = avgIntervalMins % 60;
    const interval = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;

    await Notifications.scheduleNotificationAsync({
      identifier: FEED_REMINDER_ID,
      content: {
        title: `${babyName} may be hungry soon 🍼`,
        body:  `Last feed was about ${interval} ago.`,
        data:  { type: 'feed_reminder' },
      },
      trigger: { date: reminderAt },
    });
  } catch { /* non-critical */ }
}

export async function cancelFeedReminder(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(FEED_REMINDER_ID);
  } catch { /* ignore */ }
}

// ─── Sleep window alert ───────────────────────────────────────────────────────

export async function scheduleSleepWindowAlert(
  babyName: string,
  lastWakeTime: Date,
  wakeWindowMins: number,
): Promise<void> {
  if (!(await hasNotificationPermission())) return;
  if (!(lastWakeTime instanceof Date) || isNaN(lastWakeTime.getTime())) return;

  try {
    await Notifications.cancelScheduledNotificationAsync(SLEEP_WINDOW_ID);

    // Alert 15 min before the wake window closes (nap time approaching)
    const alertAt = addMinutes(lastWakeTime, wakeWindowMins - 15);
    if (alertAt <= new Date()) return;

    await Notifications.scheduleNotificationAsync({
      identifier: SLEEP_WINDOW_ID,
      content: {
        title: `${babyName}'s nap window is opening 😴`,
        body:  'Watch for tired cues — yawning, eye rubbing, fussiness.',
        data:  { type: 'sleep_window' },
      },
      trigger: { date: alertAt },
    });
  } catch { /* non-critical */ }
}

export async function cancelSleepWindowAlert(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(SLEEP_WINDOW_ID);
  } catch { /* ignore */ }
}

// ─── Vaccine alerts ───────────────────────────────────────────────────────────

export async function scheduleVaccineAlerts(
  babyName: string,
  vaccinations: Array<{
    vaccineId: string;
    vaccineName: string;
    scheduledDate: Date;
    status: string;
  }>,
): Promise<void> {
  if (!(await hasNotificationPermission())) return;

  try {
    // Cancel existing vaccine notifications
    const all     = await Notifications.getAllScheduledNotificationsAsync();
    const existing = all.filter((n) => n.identifier.startsWith(VACCINE_PREFIX));
    await Promise.all(existing.map((n) =>
      Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}),
    ));

    const now     = new Date();
    const pending = vaccinations.filter(
      (v) => v.status === 'pending' &&
             v.scheduledDate instanceof Date &&
             !isNaN(v.scheduledDate.getTime()) &&
             v.scheduledDate > now,
    );

    // Sort by date asc, cap at 15 upcoming
    pending.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

    for (const vax of pending.slice(0, 15)) {
      const daysUntil = Math.round((vax.scheduledDate.getTime() - now.getTime()) / 86400000);

      // Day-of notification at 9 AM
      if (daysUntil >= 0 && daysUntil <= 14) {
        const dayOf = new Date(vax.scheduledDate);
        dayOf.setHours(9, 0, 0, 0);
        if (dayOf > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${VACCINE_PREFIX}${vax.vaccineId}_day`,
            content: {
              title:  `Vaccine day for ${babyName} 💉`,
              body:   `${vax.vaccineName} is due today. Bring the immunisation card.`,
              data:   { type: 'vaccine_due', vaccineId: vax.vaccineId },
            },
            trigger: { date: dayOf },
          }).catch(() => {});
        }
      }

      // 3-day advance reminder
      if (daysUntil >= 3 && daysUntil <= 14) {
        const threeDayBefore = new Date(vax.scheduledDate);
        threeDayBefore.setDate(threeDayBefore.getDate() - 3);
        threeDayBefore.setHours(10, 0, 0, 0);
        if (threeDayBefore > now) {
          await Notifications.scheduleNotificationAsync({
            identifier: `${VACCINE_PREFIX}${vax.vaccineId}_3d`,
            content: {
              title:  `Vaccine in 3 days 🛡️`,
              body:   `${vax.vaccineName} is scheduled for ${format(vax.scheduledDate, 'd MMM')} for ${babyName}.`,
              data:   { type: 'vaccine_reminder', vaccineId: vax.vaccineId },
            },
            trigger: { date: threeDayBefore },
          }).catch(() => {});
        }
      }
    }
  } catch { /* non-critical */ }
}

export async function cancelAllVaccineAlerts(): Promise<void> {
  try {
    const all      = await Notifications.getAllScheduledNotificationsAsync();
    const existing = all.filter((n) => n.identifier.startsWith(VACCINE_PREFIX));
    await Promise.all(existing.map((n) =>
      Notifications.cancelScheduledNotificationAsync(n.identifier).catch(() => {}),
    ));
  } catch { /* ignore */ }
}

// ─── Cancel all ───────────────────────────────────────────────────────────────

export async function cancelAllBabyNotifications(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch { /* ignore */ }
}
