import { format, differenceInWeeks, differenceInMonths, subDays } from 'date-fns';
import {
  getFeeds, getSleepEntries, getDiapers, getGrowthEntries,
  getVaccinations, getMedications, getMilestones,
} from '@services/firebase/firestore';
import { calculateApproxPercentile } from '@utils/percentile';
import type {
  Baby, GrowthEntry, VaccinationEntry, MedicationEntry, Milestone,
} from '@types/index';

export interface VisitSummaryData {
  baby:               Baby;
  generatedAt:        Date;
  ageWeeks:           number;
  ageMonths:          number;
  // 2-week window averages
  avgFeedsPerDay:     number;
  avgSleepHrsPerDay:  number;
  avgDiapersPerDay:   number;
  totalDays:          number;
  // Growth
  latestWeight:       number | null;  // kg
  latestHeight:       number | null;  // cm
  weightPercentile:   number | null;
  heightPercentile:   number | null;
  // Clinical
  recentVaccines:     VaccinationEntry[];
  upcomingVaccines:   VaccinationEntry[];
  recentMedications:  MedicationEntry[];
  openMilestones:     Milestone[];
  questions:          VisitQuestion[];
}

export interface VisitQuestion {
  id:       string;
  text:     string;
  category: string;
}

// ─────────────────────────────────────────────────────────────────────────────

function nd(d: Date | unknown): Date {
  return d instanceof Date ? d : new Date(d as string);
}

const WINDOW = 14; // days

export async function fetchVisitData(baby: Baby): Promise<VisitSummaryData> {
  const now        = new Date();
  const since      = subDays(now, WINDOW);
  const ageWeeks   = differenceInWeeks(now, nd(baby.birthDate));
  const ageMonths  = differenceInMonths(now, nd(baby.birthDate));

  const [feeds, sleep, diapers, allGrowth, vaccines, meds, milestones] = await Promise.all([
    getFeeds(baby.id, since, now),
    getSleepEntries(baby.id, since, now),
    getDiapers(baby.id, since),
    getGrowthEntries(baby.id),
    getVaccinations(baby.id),
    getMedications(baby.id, 100),
    getMilestones(baby.id),
  ]);

  // ── Averages ──────────────────────────────────────────────────────────────
  const activeDays = Math.max(1, Math.min(WINDOW, Math.ceil((now.getTime() - nd(baby.birthDate).getTime()) / 86_400_000)));
  const avgFeedsPerDay    = +(feeds.length / activeDays).toFixed(1);
  const totalSleepMins    = sleep.reduce((s, e) => s + (e.duration ?? 0), 0);
  const avgSleepHrsPerDay = +(totalSleepMins / activeDays / 60).toFixed(1);
  const thisWindowDiapers = diapers.filter((d) => nd(d.time) >= since);
  const avgDiapersPerDay  = +(thisWindowDiapers.length / activeDays).toFixed(1);

  // ── Growth ────────────────────────────────────────────────────────────────
  const latestGrowth = [...allGrowth].sort(
    (a, b) => nd(b.date).getTime() - nd(a.date).getTime(),
  )[0] as GrowthEntry | undefined;

  let latestWeight: number | null  = null;
  let latestHeight: number | null  = null;
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

  // ── Vaccines ─────────────────────────────────────────────────────────────
  const recentVaccines = vaccines.filter((v) => {
    if (!v.administeredDate || v.status !== 'administered') return false;
    return nd(v.administeredDate) >= since;
  });
  const upcomingVaccines = vaccines
    .filter((v) => v.status === 'pending' && nd(v.scheduledDate) >= now)
    .slice(0, 3);

  // ── Medications (last 14 days) ────────────────────────────────────────────
  const recentMedications = meds.filter((m) => nd(m.givenAt) >= since);

  // ── Open milestones (expected soon, not yet achieved) ─────────────────────
  const openMilestones = milestones
    .filter((m) => !m.achieved && m.expectedAgeWeeks <= ageWeeks + 8)
    .sort((a, b) => a.expectedAgeWeeks - b.expectedAgeWeeks)
    .slice(0, 5);

  return {
    baby,
    generatedAt: now,
    ageWeeks,
    ageMonths,
    avgFeedsPerDay,
    avgSleepHrsPerDay,
    avgDiapersPerDay,
    totalDays: activeDays,
    latestWeight,
    latestHeight,
    weightPercentile,
    heightPercentile,
    recentVaccines,
    upcomingVaccines,
    recentMedications,
    openMilestones,
    questions: getVisitQuestions(ageWeeks),
  };
}

// ─── Age-appropriate questions ────────────────────────────────────────────────

export function getVisitQuestions(ageWeeks: number): VisitQuestion[] {
  const q = (id: string, text: string, category: string): VisitQuestion => ({ id, text, category });

  const allTime: VisitQuestion[] = [
    q('gen1', 'What are the emergency warning signs I should go to hospital for immediately?', 'Safety'),
    q('gen2', 'Is the current weight/height on track?', 'Growth'),
    q('gen3', 'Any supplements needed — Vitamin D, iron?', 'Nutrition'),
  ];

  if (ageWeeks < 6) return [
    q('n1', 'How do I know baby is getting enough milk?', 'Feeding'),
    q('n2', 'What are safe sleep practices — position, room temperature?', 'Sleep'),
    q('n3', 'When should jaundice yellow skin be concerning?', 'Health'),
    q('n4', 'When is the first vaccine due?', 'Vaccines'),
    q('n5', 'Is it okay to have visitors and take baby outside?', 'Safety'),
    q('n6', 'How often should baby be pooping/weeing?', 'Diapers'),
    ...allTime,
  ];

  if (ageWeeks < 12) return [
    q('m2a', 'When will the colicky crying peak and what helps?', 'Comfort'),
    q('m2b', 'When should baby start smiling and making eye contact?', 'Development'),
    q('m2c', 'How much tummy time should baby get each day?', 'Development'),
    q('m2d', 'Is the reflux/spit-up normal or should I be concerned?', 'Health'),
    q('m2e', 'When is the next vaccine schedule?', 'Vaccines'),
    ...allTime,
  ];

  if (ageWeeks < 20) return [
    q('m4a', 'Baby is drooling a lot — is teething starting this early?', 'Development'),
    q('m4b', 'When should we start solid foods — what are the signs of readiness?', 'Feeding'),
    q('m4c', 'How do I safely introduce common allergens?', 'Feeding'),
    q('m4d', 'Baby wakes 3–4 times at night — is sleep training safe yet?', 'Sleep'),
    q('m4e', 'Is head control and rolling development on track?', 'Development'),
    ...allTime,
  ];

  if (ageWeeks < 36) return [
    q('m6a', 'Which first foods should we start with — Indian options?', 'Feeding'),
    q('m6b', 'How do I know baby is ready for more texture / lumpier food?', 'Feeding'),
    q('m6c', 'Baby gets sick every 2–3 weeks — is that normal at daycare age?', 'Health'),
    q('m6d', 'Separation anxiety is very strong — what is normal?', 'Development'),
    q('m6e', 'When should baby start pulling to stand?', 'Development'),
    q('m6f', 'How much water can baby have now?', 'Nutrition'),
    ...allTime,
  ];

  if (ageWeeks < 52) return [
    q('m9a', 'Baby isn\'t walking yet — should I be concerned?', 'Development'),
    q('m9b', 'How many words should baby have by 12 months?', 'Development'),
    q('m9c', 'What foods should be avoided until after 1 year (honey, whole nuts)?', 'Feeding'),
    q('m9d', 'When should we switch from formula/breast to whole milk?', 'Feeding'),
    q('m9e', 'When is the first dental check recommended?', 'Health'),
    q('m9f', 'What does the 9–12 month developmental check look at?', 'Development'),
    ...allTime,
  ];

  if (ageWeeks < 78) return [
    q('y1a', 'Tantrums are getting intense — what is normal and what isn\'t?', 'Behaviour'),
    q('y1b', 'When is the right time to start potty training?', 'Development'),
    q('y1c', 'How much screen time is acceptable at this age?', 'Development'),
    q('y1d', 'Baby still waking at night — strategies that are safe now?', 'Sleep'),
    q('y1e', 'Should we see a dentist? Any fluoride considerations?', 'Health'),
    q('y1f', 'Speech seems limited — when to refer for speech therapy?', 'Development'),
    ...allTime,
  ];

  return [
    q('y2a', 'Baby isn\'t speaking in sentences yet — what\'s the threshold for concern?', 'Development'),
    q('y2b', 'How do I manage strong separation anxiety at preschool age?', 'Behaviour'),
    q('y2c', 'When should we transition out of the cot?', 'Sleep'),
    q('y2d', 'What does the 2-year developmental check assess?', 'Development'),
    q('y2e', 'Potty training readiness — what signs should I look for?', 'Development'),
    q('y2f', 'Any diet changes needed now — less milk, more fibre?', 'Nutrition'),
    ...allTime,
  ];
}

// ─── HTML for PDF ─────────────────────────────────────────────────────────────

function row(label: string, value: string) {
  return `<tr>
    <td style="padding:8px 12px;color:#555;font-size:13px;width:45%;">${label}</td>
    <td style="padding:8px 12px;font-weight:700;color:#1A1A2E;font-size:13px;">${value}</td>
  </tr>`;
}

export function buildVisitHTML(d: VisitSummaryData): string {
  const vaccineRows = d.recentVaccines.length
    ? d.recentVaccines.map((v) => `<li style="margin-bottom:4px;">✅ ${v.vaccineName} — ${v.administeredDate ? format(nd(v.administeredDate), 'd MMM') : ''}</li>`).join('')
    : '<li style="color:#999;">None in the last 14 days</li>';

  const upcomingRows = d.upcomingVaccines.length
    ? d.upcomingVaccines.map((v) => `<li style="margin-bottom:4px;">💉 ${v.vaccineName} — due ${format(nd(v.scheduledDate), 'd MMM yyyy')}</li>`).join('')
    : '<li style="color:#999;">No upcoming vaccines scheduled</li>';

  const medRows = d.recentMedications.length
    ? d.recentMedications.map((m) => `<li style="margin-bottom:4px;">💊 ${m.medicineName} — ${m.dose}${m.unit} on ${format(nd(m.givenAt), 'd MMM')}</li>`).join('')
    : '<li style="color:#999;">No medications in the last 14 days</li>';

  const milestoneRows = d.openMilestones.length
    ? d.openMilestones.map((m) => `<li style="margin-bottom:4px;">⏳ ${m.title} (expected ~${Math.round(m.expectedAgeWeeks / 4.3)}m)</li>`).join('')
    : '<li style="color:#999;">All expected milestones achieved</li>';

  const questionRows = d.questions
    .map((q) => `<li style="margin-bottom:8px;"><span style="color:#0B6E6E;font-weight:700;">[${q.category}]</span> ${q.text}</li>`)
    .join('');

  const growthSection = (d.latestWeight !== null || d.latestHeight !== null) ? `
    <tr><td colspan="2" style="padding:8px 12px 2px;font-weight:700;color:#0B6E6E;font-size:12px;text-transform:uppercase;letter-spacing:0.5px;">GROWTH</td></tr>
    ${d.latestWeight !== null ? row('Weight', `${d.latestWeight.toFixed(2)} kg${d.weightPercentile !== null ? ` · P${d.weightPercentile} (WHO)` : ''}`) : ''}
    ${d.latestHeight !== null ? row('Height', `${d.latestHeight} cm${d.heightPercentile !== null ? ` · P${d.heightPercentile} (WHO)` : ''}`) : ''}
  ` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, 'Segoe UI', Arial, sans-serif; background: #fff; color: #1A1A2E; }
    table { width: 100%; border-collapse: collapse; }
    tr:nth-child(even) { background: #F8FFFE; }
    ul { list-style: none; padding: 0; margin: 0; }
    .section { background: #fff; border: 1px solid #E0F0EE; border-radius: 10px; padding: 16px; margin-bottom: 14px; }
    .section-title { font-size: 13px; font-weight: 800; color: #0B6E6E; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 10px; border-bottom: 1px solid #E0F0EE; padding-bottom: 6px; }
  </style>
</head>
<body>
<div style="max-width:600px;margin:0 auto;padding:0;background:#fff;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#06545A,#0B9A9A);padding:28px 24px;">
    <div style="font-size:13px;color:rgba(255,255,255,0.7);font-weight:600;margin-bottom:2px;">PAEDIATRICIAN VISIT SUMMARY</div>
    <h1 style="color:#fff;font-size:22px;font-weight:900;margin:0;">${d.baby.name}</h1>
    <div style="color:rgba(255,255,255,0.85);font-size:14px;margin-top:4px;">
      ${d.ageMonths}m ${d.ageWeeks % 4}w old · ${d.baby.gender !== 'other' ? d.baby.gender.charAt(0).toUpperCase() + d.baby.gender.slice(1) : ''} · ${format(d.generatedAt, 'd MMMM yyyy')}
    </div>
  </div>

  <div style="padding:16px;">

    <!-- 2-week snapshot -->
    <div class="section">
      <div class="section-title">📊 2-Week Snapshot (${format(subDays(d.generatedAt, WINDOW), 'd MMM')} – ${format(d.generatedAt, 'd MMM')})</div>
      <table>
        ${row('Avg feeds / day', `${d.avgFeedsPerDay}`)}
        ${row('Avg sleep / day', `${d.avgSleepHrsPerDay} hrs`)}
        ${row('Avg diapers / day', `${d.avgDiapersPerDay}`)}
        ${growthSection}
      </table>
    </div>

    <!-- Vaccines -->
    <div class="section">
      <div class="section-title">💉 Vaccines</div>
      <div style="margin-bottom:8px;font-size:12px;color:#555;font-weight:600;">Administered (last 14 days)</div>
      <ul style="margin-bottom:12px;font-size:13px;">${vaccineRows}</ul>
      <div style="font-size:12px;color:#555;font-weight:600;margin-bottom:4px;">Upcoming</div>
      <ul style="font-size:13px;">${upcomingRows}</ul>
    </div>

    <!-- Medications -->
    <div class="section">
      <div class="section-title">💊 Medications (last 14 days)</div>
      <ul style="font-size:13px;">${medRows}</ul>
    </div>

    <!-- Open milestones -->
    <div class="section">
      <div class="section-title">⭐ Pending Milestones</div>
      <ul style="font-size:13px;">${milestoneRows}</ul>
    </div>

    <!-- Questions -->
    <div class="section">
      <div class="section-title">❓ Questions to Ask</div>
      <ul style="font-size:13px;line-height:1.7;">${questionRows}</ul>
    </div>

    <div style="text-align:center;color:#BBB;font-size:11px;padding:10px;">
      Generated by BabySaathi · ${format(d.generatedAt, 'd MMM yyyy, h:mm a')}
    </div>
  </div>
</div>
</body>
</html>`;
}

// ─── WhatsApp text ────────────────────────────────────────────────────────────

export function buildVisitText(d: VisitSummaryData): string {
  const lines = [
    `👶 *${d.baby.name} — Visit Summary*`,
    `📅 ${format(d.generatedAt, 'd MMM yyyy')} · Age: ${d.ageMonths}m ${d.ageWeeks % 4}w`,
    '',
    `📊 *Last 14 Days*`,
    `🍼 Feeds: ${d.avgFeedsPerDay}/day · 😴 Sleep: ${d.avgSleepHrsPerDay}h/day · 👶 Diapers: ${d.avgDiapersPerDay}/day`,
  ];

  if (d.latestWeight !== null || d.latestHeight !== null) {
    lines.push('', '📏 *Growth*');
    if (d.latestWeight !== null) lines.push(`Weight: ${d.latestWeight.toFixed(2)} kg${d.weightPercentile !== null ? ` (P${d.weightPercentile})` : ''}`);
    if (d.latestHeight !== null) lines.push(`Height: ${d.latestHeight} cm${d.heightPercentile !== null ? ` (P${d.heightPercentile})` : ''}`);
  }

  if (d.upcomingVaccines.length) {
    lines.push('', '💉 *Upcoming Vaccines*');
    d.upcomingVaccines.forEach((v) => lines.push(`• ${v.vaccineName} — ${format(nd(v.scheduledDate), 'd MMM yyyy')}`));
  }

  if (d.recentMedications.length) {
    lines.push('', '💊 *Recent Medications*');
    d.recentMedications.forEach((m) => lines.push(`• ${m.medicineName} ${m.dose}${m.unit}`));
  }

  lines.push('', '_Generated by BabySaathi_ 💙');
  return lines.join('\n');
}
