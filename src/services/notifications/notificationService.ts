import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { differenceInWeeks, addHours, addDays, addMinutes } from 'date-fns';
import { Baby, VaccinationEntry, Milestone, MedicationEntry, CulturalMilestoneEntry } from '@types/index';

// ─── Notification ID namespacing ──────────────────────────────────────────────

const IDS = {
  feedReminder: (babyId: string) => `feed_reminder_${babyId}`,
  vaccineAlert: (vaccineId: string) => `vaccine_alert_${vaccineId}`,
  milestoneNudge: (milestoneId: string) => `milestone_${milestoneId}`,
  dailyInsight: 'daily_insight',
  sleepGoal: (babyId: string) => `sleep_goal_${babyId}`,
  // givenAt timestamp makes the ID deterministic — same value used to cancel
  medicationReminder: (babyId: string, givenAtMs: number) => `medicine_${babyId}_${givenAtMs}`,
  feverFollowup: (babyId: string) => `fever_followup_${babyId}`,
  culturalMilestone: (babyId: string, ceremonyId: string) => `cultural_${babyId}_${ceremonyId}`,
  nextFeedAlert: (babyId: string) => `next_feed_${babyId}`,
};

// ─── Permission ───────────────────────────────────────────────────────────────

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('babysaathi', {
      name: 'BabySaathi',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C05A00',
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ─── Feed reminder ─────────────────────────────────────────────────────────
// Fires 3 hours after last logged feed. Re-scheduled every time a feed is saved.

export async function scheduleFeedReminder(baby: Baby, lastFeedTime: Date): Promise<void> {
  const id = IDS.feedReminder(baby.id);
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const triggerAt = addHours(lastFeedTime, 3);
  if (triggerAt <= new Date()) return; // already overdue — don't schedule in the past

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `🍼 ${baby.name} ko bhook lag sakti hai!`,
      body: `Pichle feed ko 3 ghante ho gaye. Feed log karne ka time! 💛`,
      data: { type: 'feed_reminder', babyId: baby.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
    },
  });
}

export async function cancelFeedReminder(babyId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDS.feedReminder(babyId)).catch(() => {});
}

// ─── Vaccine alert ────────────────────────────────────────────────────────────
// Schedules TWO alerts: 7 days before + 1 day before.

export async function scheduleVaccineAlert(
  baby: Baby,
  vaccine: VaccinationEntry
): Promise<void> {
  if (!vaccine.scheduledDate || vaccine.administeredDate) return;

  const due = new Date(vaccine.scheduledDate);
  const sevenDayBefore = addDays(due, -7);
  const oneDayBefore = addDays(due, -1);
  const now = new Date();

  if (sevenDayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${IDS.vaccineAlert(vaccine.id)}_7d`,
      content: {
        title: `💉 ${baby.name} ka teeka 7 din mein!`,
        body: `${vaccine.vaccineName} — ${due.toLocaleDateString('en-IN')} ko due hai. Appointment book karo!`,
        data: { type: 'vaccine_alert', vaccineId: vaccine.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: sevenDayBefore,
      },
    });
  }

  if (oneDayBefore > now) {
    await Notifications.scheduleNotificationAsync({
      identifier: `${IDS.vaccineAlert(vaccine.id)}_1d`,
      content: {
        title: `⚠️ ${baby.name} ka teeka kal hai!`,
        body: `${vaccine.vaccineName} — kal ${due.toLocaleDateString('en-IN')} ko due hai. Mat bhulna! 🙏`,
        data: { type: 'vaccine_alert', vaccineId: vaccine.id },
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: oneDayBefore,
      },
    });
  }
}

export async function cancelVaccineAlert(vaccineId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`${IDS.vaccineAlert(vaccineId)}_7d`).catch(() => {});
  await Notifications.cancelScheduledNotificationAsync(`${IDS.vaccineAlert(vaccineId)}_1d`).catch(() => {});
}

// ─── Milestone nudge ──────────────────────────────────────────────────────────
// Fires when a milestone is approaching (within 4 weeks of expected age).

export async function scheduleMilestoneNudge(
  baby: Baby,
  milestone: Milestone
): Promise<void> {
  if (milestone.achieved) return;

  const ageWeeks = differenceInWeeks(new Date(), baby.birthDate);
  const weeksUntil = (milestone.expectedAgeWeeks ?? 0) - ageWeeks;
  if (weeksUntil < 0 || weeksUntil > 4) return; // not approaching

  const triggerAt = addDays(new Date(), weeksUntil * 7);
  if (triggerAt <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: IDS.milestoneNudge(milestone.id),
    content: {
      title: `⭐ ${baby.name} ka milestone aa raha hai!`,
      body: `"${milestone.title}" expect karo ${weeksUntil === 0 ? 'is hafte' : `${weeksUntil} hafte mein`}! Taiyar raho 🎉`,
      data: { type: 'milestone_nudge', milestoneId: milestone.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
    },
  });
}

// ─── Daily AI insight ─────────────────────────────────────────────────────────
// Repeating trigger: every day at 8 AM.

export async function scheduleDailyInsightNotification(babyName: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDS.dailyInsight).catch(() => {});

  await Notifications.scheduleNotificationAsync({
    identifier: IDS.dailyInsight,
    content: {
      title: `🧿 ${babyName} ke liye nayi AI Guru insight!`,
      body: 'Aaj ka AI analysis ready hai. Dekho kya naya mila! ✨',
      data: { type: 'daily_insight' },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 8,
      minute: 0,
    },
  });
}

// ─── Sleep goal reminder ───────────────────────────────────────────────────────
// Fires at 9 PM if baby hasn't hit the daily sleep goal.

export async function scheduleSleepGoalReminder(
  baby: Baby,
  currentSleepHours: number
): Promise<void> {
  const id = IDS.sleepGoal(baby.id);
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const sleepGoal = differenceInWeeks(new Date(), baby.birthDate) < 13 ? 16 : 14;
  if (currentSleepHours >= sleepGoal) return; // goal already met

  const tonight9pm = new Date();
  tonight9pm.setHours(21, 0, 0, 0);
  if (tonight9pm <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `😴 ${baby.name} ka sleep goal pura nahi hua!`,
      body: `Aaj ${currentSleepHours.toFixed(1)}h soya. Target ${sleepGoal}h — thodi neend aur! 🌙`,
      data: { type: 'sleep_goal', babyId: baby.id },
      sound: false,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tonight9pm,
    },
  });
}

// ─── Medication dose reminder ─────────────────────────────────────────────────
// Fires at the calculated nextDoseAt time. Uses givenAt ms as a deterministic
// identifier so cancellation works without storing a separate notification ID.

export async function scheduleMedicationReminder(
  baby: Baby,
  medication: MedicationEntry
): Promise<void> {
  if (!medication.nextDoseAt) return;
  if (medication.nextDoseAt <= new Date()) return;

  const id = IDS.medicationReminder(baby.id, medication.givenAt.getTime());

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `💊 ${baby.name} ki dawai ka time!`,
      body: `${medication.medicineName} — next dose ab ready hai. ${medication.dose} ${medication.unit} do! 🙏`,
      data: { type: 'medication_reminder', babyId: baby.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: medication.nextDoseAt,
    },
  });
}

export async function cancelMedicationReminder(
  babyId: string,
  givenAtMs: number
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    IDS.medicationReminder(babyId, givenAtMs)
  ).catch(() => {});
}

// ─── High fever follow-up ─────────────────────────────────────────────────────
// 2 hours after a high fever is logged — prompts parent to re-check temperature.

export async function scheduleHighFeverFollowup(
  baby: Baby,
  temperature: number
): Promise<void> {
  const id = IDS.feverFollowup(baby.id);
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const triggerAt = addHours(new Date(), 2);

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `🌡️ ${baby.name} ka bukhaar check karo`,
      body: `2 ghante pehle ${temperature.toFixed(1)}°C tha. Abhi kaisa hai? Dobara check karo. 💛`,
      data: { type: 'fever_followup', babyId: baby.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
    },
  });
}

export async function cancelHighFeverFollowup(babyId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(IDS.feverFollowup(babyId)).catch(() => {});
}

// ─── Cultural milestone reminder ──────────────────────────────────────────────
// Fires 7 days before the expected ceremony date so parents have time to prepare.

export async function scheduleCulturalMilestoneReminder(
  baby: Baby,
  entry: CulturalMilestoneEntry,
  ceremonyEmoji: string,
  expectedDate: Date
): Promise<void> {
  const id = IDS.culturalMilestone(baby.id, entry.ceremonyId);
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const triggerAt = addDays(expectedDate, -7);
  if (triggerAt <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `${ceremonyEmoji} ${entry.ceremonyName} — ek hafte mein!`,
      body: `${baby.name} ka ${entry.ceremonyName} ceremony aane wala hai. Tayari shuru karo! 🙏`,
      data: { type: 'cultural_milestone', babyId: baby.id, ceremonyId: entry.ceremonyId },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
    },
  });
}

export async function cancelCulturalMilestoneReminder(
  babyId: string,
  ceremonyId: string
): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    IDS.culturalMilestone(babyId, ceremonyId)
  ).catch(() => {});
}

// ─── Next feed alert ─────────────────────────────────────────────────────────
// Fires 10 minutes before the predicted next feed time.
// Re-scheduled every time a new feed is logged.

export async function scheduleNextFeedAlert(
  baby: Baby,
  predictedAt: Date
): Promise<void> {
  const id = IDS.nextFeedAlert(baby.id);
  await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});

  const triggerAt = addMinutes(predictedAt, -10);
  if (triggerAt <= new Date()) return;

  await Notifications.scheduleNotificationAsync({
    identifier: id,
    content: {
      title: `🍼 ${baby.name} ko jaldi bhook lagegi!`,
      body: `10 minute mein feed time! Abhi se ready ho jao. 💛`,
      data: { type: 'feed_predictor', babyId: baby.id },
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerAt,
    },
  });
}

export async function cancelNextFeedAlert(babyId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(
    IDS.nextFeedAlert(babyId)
  ).catch(() => {});
}

// ─── Cancel all for a baby ────────────────────────────────────────────────────

export async function cancelAllForBaby(babyId: string): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const toCancel = scheduled.filter(n => {
    const data = n.content.data as any;
    return data?.babyId === babyId;
  });
  await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}

export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ─── Handle foreground notification tap ───────────────────────────────────────

export function setupNotificationResponseHandler(
  onNavigate: (screen: string, params?: any) => void
): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener(response => {
    const data = response.notification.request.content.data as any;
    switch (data?.type) {
      case 'feed_reminder':
        onNavigate('Tracker');
        break;
      case 'vaccine_alert':
        onNavigate('Tracker');
        break;
      case 'milestone_nudge':
        onNavigate('Tracker');
        break;
      case 'daily_insight':
        onNavigate('AI');
        break;
      case 'medication_reminder':
      case 'fever_followup':
        onNavigate('MedicineTracker');
        break;
      case 'cultural_milestone':
        onNavigate('CulturalMilestones');
        break;
      case 'feed_predictor':
        onNavigate('Tracker', { screen: 'FeedTracker' });
        break;
    }
  });

  return () => sub.remove();
}
