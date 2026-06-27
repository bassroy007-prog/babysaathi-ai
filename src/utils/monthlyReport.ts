import { format, startOfMonth, endOfMonth, differenceInMonths } from 'date-fns';
import {
  getFeeds, getSleepEntries, getDiapers,
  getGrowthEntries, getVaccinations, getMilestones,
} from '@services/firebase/firestore';
import { calculateApproxPercentile } from '@utils/percentile';
import type { Baby, GrowthEntry, VaccinationEntry, Milestone } from '@types/index';

export interface MonthlyStats {
  feedCount:    number;
  sleepHours:   number;
  diaperCount:  number;
}

export interface MonthlyReportData {
  baby:               Baby;
  year:               number;
  month:              number;     // 0-indexed
  monthLabel:         string;     // e.g. "June 2025"
  ageMonths:          number;
  stats:              MonthlyStats;
  prevStats:          MonthlyStats;
  latestWeight:       number | null;  // kg
  latestHeight:       number | null;  // cm
  weightPercentile:   number | null;
  heightPercentile:   number | null;
  vaccinesThisMonth:  VaccinationEntry[];
  milestonesThisMonth: Milestone[];
  growthEntries:      GrowthEntry[];
}

// ─────────────────────────────────────────────────────────────────────────────

function normDate(d: Date | unknown): Date {
  return d instanceof Date ? d : new Date(d as string);
}

export async function fetchMonthlyData(
  baby: Baby,
  year: number,
  month: number,      // 0-indexed
): Promise<MonthlyReportData> {
  const monthStart = startOfMonth(new Date(year, month, 1));
  const monthEnd   = endOfMonth(monthStart);
  const prevStart  = startOfMonth(new Date(year, month - 1, 1));
  const prevEnd    = endOfMonth(prevStart);

  const ageMonths = differenceInMonths(monthEnd, normDate(baby.birthDate));

  const [
    feeds, sleep, diapers,
    pFeeds, pSleep, pDiapers,
    allGrowth, allVaccines, allMilestones,
  ] = await Promise.all([
    getFeeds(baby.id, monthStart, monthEnd),
    getSleepEntries(baby.id, monthStart, monthEnd),
    getDiapers(baby.id, monthStart),
    getFeeds(baby.id, prevStart, prevEnd),
    getSleepEntries(baby.id, prevStart, prevEnd),
    getDiapers(baby.id, prevStart),
    getGrowthEntries(baby.id),
    getVaccinations(baby.id),
    getMilestones(baby.id),
  ]);

  const inRange = (d: Date, start: Date, end: Date) => d >= start && d <= end;

  const thisMonthDiapers = diapers.filter((d) => inRange(normDate(d.time), monthStart, monthEnd));
  const prevMonthDiapers = pDiapers.filter((d) => inRange(normDate(d.time), prevStart, prevEnd));

  const sleepHrs  = sleep.reduce((s, e) => s + (e.duration ?? 0), 0) / 60;
  const pSleepHrs = pSleep.reduce((s, e) => s + (e.duration ?? 0), 0) / 60;

  const growthEntries = allGrowth.filter((g) => inRange(normDate(g.date), monthStart, monthEnd));

  // Latest overall growth entry for percentile (might be older)
  const latestGrowth = [...allGrowth].sort(
    (a, b) => normDate(b.date).getTime() - normDate(a.date).getTime(),
  )[0];

  let latestWeight: number | null = null;
  let latestHeight: number | null = null;
  let weightPercentile: number | null = null;
  let heightPercentile: number | null = null;

  if (latestGrowth) {
    if (latestGrowth.weight) {
      latestWeight = latestGrowth.weight > 50 ? latestGrowth.weight / 1000 : latestGrowth.weight;
      weightPercentile = calculateApproxPercentile(latestWeight, ageMonths, baby.gender, 'weight');
    }
    if (latestGrowth.height) {
      latestHeight = latestGrowth.height;
      heightPercentile = calculateApproxPercentile(latestHeight, ageMonths, baby.gender, 'height');
    }
  }

  const vaccinesThisMonth = allVaccines.filter((v) => {
    if (!v.administeredDate || v.status !== 'administered') return false;
    return inRange(normDate(v.administeredDate), monthStart, monthEnd);
  });

  const milestonesThisMonth = allMilestones.filter((m) => {
    if (!m.achievedDate || !m.achieved) return false;
    return inRange(normDate(m.achievedDate), monthStart, monthEnd);
  });

  return {
    baby,
    year,
    month,
    monthLabel: format(monthStart, 'MMMM yyyy'),
    ageMonths,
    stats:    { feedCount: feeds.length, sleepHours: sleepHrs, diaperCount: thisMonthDiapers.length },
    prevStats: { feedCount: pFeeds.length, sleepHours: pSleepHrs, diaperCount: prevMonthDiapers.length },
    latestWeight,
    latestHeight,
    weightPercentile,
    heightPercentile,
    vaccinesThisMonth,
    milestonesThisMonth,
    growthEntries,
  };
}

// ─── HTML for PDF ─────────────────────────────────────────────────────────────

function statBox(emoji: string, label: string, value: string, bg: string) {
  return `
    <div style="flex:1;background:${bg};border-radius:12px;padding:16px;text-align:center;margin:4px;">
      <div style="font-size:28px;margin-bottom:4px;">${emoji}</div>
      <div style="font-size:22px;font-weight:800;color:#1A1A2E;">${value}</div>
      <div style="font-size:11px;color:#555;margin-top:2px;font-weight:600;">${label}</div>
    </div>`;
}

export function buildMonthlyHTML(d: MonthlyReportData): string {
  const genderEmoji = d.baby.gender === 'female' ? '👧' : d.baby.gender === 'male' ? '👦' : '👶';

  const milestoneRows = d.milestonesThisMonth.length
    ? d.milestonesThisMonth.map((m) => `
        <div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #F0F0F0;">
          <span style="font-size:20px;">⭐</span>
          <div>
            <div style="font-weight:700;color:#1A1A2E;font-size:14px;">${m.title}</div>
            <div style="color:#777;font-size:12px;">${m.category}</div>
          </div>
        </div>`).join('')
    : '<div style="color:#999;font-size:13px;padding:10px 0;">No milestones logged this month</div>';

  const vaccineRows = d.vaccinesThisMonth.length
    ? d.vaccinesThisMonth.map((v) => `
        <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #F0F0F0;">
          <span style="font-size:18px;">💉</span>
          <span style="font-weight:600;color:#1A1A2E;font-size:13px;">${v.vaccineName}</span>
          <span style="margin-left:auto;background:#E6F4EA;color:#2D7A3A;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700;">✓ Done</span>
        </div>`).join('')
    : '<div style="color:#999;font-size:13px;padding:10px 0;">No vaccines recorded this month</div>';

  const growthSection = (d.latestWeight || d.latestHeight) ? `
    <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <h3 style="margin:0 0 12px;color:#1A1A2E;font-size:16px;">📏 Growth</h3>
      <div style="display:flex;gap:12px;">
        ${d.latestWeight ? `
          <div style="flex:1;background:#FFF3E0;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:18px;font-weight:800;color:#E65100;">${d.latestWeight.toFixed(2)} kg</div>
            <div style="font-size:11px;color:#777;margin-top:2px;">Weight</div>
            ${d.weightPercentile ? `<div style="font-size:10px;font-weight:700;color:#E65100;margin-top:4px;">P${d.weightPercentile}</div>` : ''}
          </div>` : ''}
        ${d.latestHeight ? `
          <div style="flex:1;background:#E8F5E9;border-radius:10px;padding:12px;text-align:center;">
            <div style="font-size:18px;font-weight:800;color:#2E7D32;">${d.latestHeight} cm</div>
            <div style="font-size:11px;color:#777;margin-top:2px;">Height</div>
            ${d.heightPercentile ? `<div style="font-size:10px;font-weight:700;color:#2E7D32;margin-top:4px;">P${d.heightPercentile}</div>` : ''}
          </div>` : ''}
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Segoe UI', sans-serif; background: #FFF9F5; }
  </style>
</head>
<body>
<div style="max-width:560px;margin:0 auto;background:#FFF9F5;padding:0;border-radius:20px;overflow:hidden;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#FF6B35,#F7C59F);padding:36px 24px;text-align:center;">
    <div style="font-size:52px;margin-bottom:8px;">${genderEmoji}</div>
    <h1 style="color:#fff;font-size:26px;font-weight:900;margin:0;">${d.baby.name}</h1>
    <div style="display:inline-block;background:rgba(255,255,255,0.25);border-radius:20px;padding:4px 16px;margin-top:8px;">
      <span style="color:#fff;font-weight:700;font-size:14px;">Month ${d.ageMonths} · ${d.monthLabel}</span>
    </div>
  </div>

  <div style="padding:20px;">

    <!-- Stats -->
    <div style="background:#fff;border-radius:16px;padding:16px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <h3 style="font-size:15px;color:#1A1A2E;margin-bottom:12px;">📊 This Month's Activity</h3>
      <div style="display:flex;gap:8px;">
        ${statBox('🍼', 'Feeds', `${d.stats.feedCount}`, '#FFF3E0')}
        ${statBox('😴', 'Sleep hrs', `${d.stats.sleepHours.toFixed(0)}h`, '#EDE7F6')}
        ${statBox('👶', 'Diapers', `${d.stats.diaperCount}`, '#E3F2FD')}
      </div>
    </div>

    <!-- Growth -->
    ${growthSection}

    <!-- Milestones -->
    <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <h3 style="margin:0 0 4px;color:#1A1A2E;font-size:16px;">⭐ Milestones Achieved</h3>
      ${milestoneRows}
    </div>

    <!-- Vaccines -->
    <div style="background:#fff;border-radius:16px;padding:20px;margin-bottom:20px;box-shadow:0 2px 12px rgba(0,0,0,0.06);">
      <h3 style="margin:0 0 4px;color:#1A1A2E;font-size:16px;">💉 Vaccines This Month</h3>
      ${vaccineRows}
    </div>

    <!-- Footer -->
    <div style="text-align:center;padding:12px;color:#BBB;font-size:11px;">
      Generated by BabySaathi • ${format(new Date(), 'd MMM yyyy')}
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── WhatsApp / SMS text ──────────────────────────────────────────────────────

export function buildMonthlyText(d: MonthlyReportData): string {
  const arrow = (cur: number, prev: number) => cur > prev ? '↑' : cur < prev ? '↓' : '→';
  const lines: string[] = [
    `📊 *${d.baby.name}'s Month ${d.ageMonths} Report*`,
    `📅 ${d.monthLabel}`,
    '',
    `🍼 Feeds: ${d.stats.feedCount} ${arrow(d.stats.feedCount, d.prevStats.feedCount)}`,
    `😴 Sleep: ${d.stats.sleepHours.toFixed(0)} hrs ${arrow(d.stats.sleepHours, d.prevStats.sleepHours)}`,
    `👶 Diapers: ${d.stats.diaperCount} ${arrow(d.stats.diaperCount, d.prevStats.diaperCount)}`,
  ];

  if (d.latestWeight || d.latestHeight) {
    lines.push('', '📏 *Growth*');
    if (d.latestWeight) lines.push(`Weight: ${d.latestWeight.toFixed(2)} kg${d.weightPercentile ? ` (P${d.weightPercentile})` : ''}`);
    if (d.latestHeight) lines.push(`Height: ${d.latestHeight} cm${d.heightPercentile ? ` (P${d.heightPercentile})` : ''}`);
  }

  if (d.milestonesThisMonth.length) {
    lines.push('', '⭐ *Milestones*');
    d.milestonesThisMonth.forEach((m) => lines.push(`• ${m.title}`));
  }

  if (d.vaccinesThisMonth.length) {
    lines.push('', '💉 *Vaccines*');
    d.vaccinesThisMonth.forEach((v) => lines.push(`✓ ${v.vaccineName}`));
  }

  lines.push('', '_Generated by BabySaathi_ 💙');
  return lines.join('\n');
}
