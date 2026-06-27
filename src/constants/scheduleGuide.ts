// Age-appropriate sleep and feeding schedule norms
// Sources: AAP, Taking Cara Babies, Precious Little Sleep

export interface AgeBand {
  id:             string;
  label:          string;    // "5–7 months"
  minWeeks:       number;
  maxWeeks:       number;
  wakeWindowMin:  number;    // minutes
  wakeWindowMax:  number;
  napsPerDay:     number;
  napDurMin:      number;    // minutes
  napDurMax:      number;
  totalSleepMin:  number;    // hours (24h total)
  totalSleepMax:  number;
  nightSleepMin:  number;    // hours
  nightSleepMax:  number;
  nightFeeds:     number;    // typical count (0 = often none but may vary)
  feedsPerDay:    number;
  suggestedBedtimeHour: number; // 24h clock (19 = 7pm)
  tips:           string[];
}

export const AGE_BANDS: AgeBand[] = [
  {
    id: 'newborn',
    label: 'Newborn',
    minWeeks: 0, maxWeeks: 6,
    wakeWindowMin: 45, wakeWindowMax: 60,
    napsPerDay: 5, napDurMin: 30, napDurMax: 120,
    totalSleepMin: 15, totalSleepMax: 18,
    nightSleepMin: 8, nightSleepMax: 10,
    nightFeeds: 3, feedsPerDay: 8,
    suggestedBedtimeHour: 22,
    tips: [
      'No set schedule yet — follow hunger and sleepy cues.',
      'Yawning, staring, fussing = time to sleep now.',
      'Bedtime is naturally late (10–11pm) these weeks — that\'s normal.',
      'Avoid overtiredness: don\'t stretch wake windows.',
    ],
  },
  {
    id: 'weeks6_12',
    label: '6–12 weeks',
    minWeeks: 6, maxWeeks: 12,
    wakeWindowMin: 60, wakeWindowMax: 90,
    napsPerDay: 4, napDurMin: 30, napDurMax: 120,
    totalSleepMin: 14, totalSleepMax: 17,
    nightSleepMin: 8, nightSleepMax: 10,
    nightFeeds: 2, feedsPerDay: 7,
    suggestedBedtimeHour: 21,
    tips: [
      'A loose feeding rhythm starts to form — not a strict schedule yet.',
      'Watch for a longer first stretch of night sleep developing.',
      'Bedtime can start moving earlier (8–9pm).',
      'Eat–play–sleep pattern helps prevent feeding-to-sleep association.',
    ],
  },
  {
    id: 'months3_5',
    label: '3–5 months',
    minWeeks: 12, maxWeeks: 22,
    wakeWindowMin: 75, wakeWindowMax: 120,
    napsPerDay: 4, napDurMin: 30, napDurMax: 90,
    totalSleepMin: 14, totalSleepMax: 16,
    nightSleepMin: 10, nightSleepMax: 11,
    nightFeeds: 2, feedsPerDay: 6,
    suggestedBedtimeHour: 20,
    tips: [
      'The 4-month sleep regression can hit here — be patient.',
      'Naps start to consolidate; short naps (30–45 min) are common.',
      'Aim for an eat–play–sleep cycle to build healthy habits.',
      'Bedtime between 7–8 PM supports longer overnight stretches.',
    ],
  },
  {
    id: 'months5_7',
    label: '5–7 months',
    minWeeks: 22, maxWeeks: 30,
    wakeWindowMin: 120, wakeWindowMax: 150,
    napsPerDay: 3, napDurMin: 45, napDurMax: 90,
    totalSleepMin: 13, totalSleepMax: 15,
    nightSleepMin: 10, nightSleepMax: 12,
    nightFeeds: 1, feedsPerDay: 5,
    suggestedBedtimeHour: 19,
    tips: [
      '3-nap schedule: morning, midday, late-afternoon catnap.',
      'Late-afternoon catnap keeps baby from overtiredness at bedtime.',
      'Solids introduced around 6m — don\'t replace milk feeds.',
      'First overnight stretch of 5–6h common by 6 months.',
    ],
  },
  {
    id: 'months7_9',
    label: '7–9 months',
    minWeeks: 30, maxWeeks: 40,
    wakeWindowMin: 150, wakeWindowMax: 180,
    napsPerDay: 2, napDurMin: 60, napDurMax: 120,
    totalSleepMin: 12, totalSleepMax: 15,
    nightSleepMin: 10, nightSleepMax: 12,
    nightFeeds: 0, feedsPerDay: 5,
    suggestedBedtimeHour: 19,
    tips: [
      '2-nap transition often happens between 6–8 months.',
      'Morning nap: ~9–10am. Afternoon nap: 1–3pm.',
      'Many babies can sleep through night by this age.',
      'Separation anxiety peaks — consistent bedtime routine helps.',
    ],
  },
  {
    id: 'months9_12',
    label: '9–12 months',
    minWeeks: 40, maxWeeks: 52,
    wakeWindowMin: 180, wakeWindowMax: 210,
    napsPerDay: 2, napDurMin: 60, napDurMax: 90,
    totalSleepMin: 12, totalSleepMax: 14,
    nightSleepMin: 10, nightSleepMax: 12,
    nightFeeds: 0, feedsPerDay: 4,
    suggestedBedtimeHour: 19,
    tips: [
      'Wake windows of 3–3.5h between naps and before bedtime.',
      'Second nap may shorten — push to preserve both naps until 12–18m.',
      'Finger foods and solids 3×/day alongside milk feeds.',
      'If night waking, check for illness, teething, or sleep association.',
    ],
  },
  {
    id: 'months12_18',
    label: '12–18 months',
    minWeeks: 52, maxWeeks: 78,
    wakeWindowMin: 210, wakeWindowMax: 270,
    napsPerDay: 1, napDurMin: 60, napDurMax: 120,
    totalSleepMin: 11, totalSleepMax: 14,
    nightSleepMin: 10, nightSleepMax: 12,
    nightFeeds: 0, feedsPerDay: 3,
    suggestedBedtimeHour: 20,
    tips: [
      '2→1 nap transition is bumpy — keep bedtime earlier during transition.',
      'Single midday nap around 12:30–1 PM works for most toddlers.',
      'Total sleep need drops to ~13h; night sleep compensates for shorter nap.',
      'Milk at morning and bedtime; water and food through the day.',
    ],
  },
  {
    id: 'months18_24',
    label: '18–24 months',
    minWeeks: 78, maxWeeks: 104,
    wakeWindowMin: 300, wakeWindowMax: 360,
    napsPerDay: 1, napDurMin: 60, napDurMax: 120,
    totalSleepMin: 11, totalSleepMax: 14,
    nightSleepMin: 10, nightSleepMax: 12,
    nightFeeds: 0, feedsPerDay: 3,
    suggestedBedtimeHour: 20,
    tips: [
      'One nap around 1 PM. If skipping nap, offer quiet rest time.',
      'Bedtime between 7–8 PM; overtiredness causes early waking.',
      '18-month sleep regression is common — stay consistent.',
      'Toddlers need 11–14h total sleep per day.',
    ],
  },
];

export function getAgeBand(ageWeeks: number): AgeBand {
  return (
    AGE_BANDS.find((b) => ageWeeks >= b.minWeeks && ageWeeks < b.maxWeeks) ??
    AGE_BANDS[AGE_BANDS.length - 1]
  );
}
