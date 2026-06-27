import { format, addMinutes, differenceInMinutes, isToday, isYesterday } from 'date-fns';
import { Baby, FeedEntry, SleepEntry, MedicationEntry, IntroducedFood } from '@types/index';
import { getMedications, getIntroducedFoods } from '@services/firebase/firestore';

export interface HandoffData {
  baby:                 Baby;
  generatedAt:          Date;
  caregiverName:        string;
  lastFeed:             FeedEntry | null;
  nextFeedEstimate:     Date | null;
  avgFeedIntervalMins:  number;
  currentSleep:         SleepEntry | null;   // ongoing (no endTime)
  lastCompletedSleep:   SleepEntry | null;
  todayDiaperCount:     number;
  activeMedications:    MedicationEntry[];
  allergicFoods:        IntroducedFood[];
  notes:                string;
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  if (v && typeof (v as any).toDate === 'function') return (v as any).toDate();
  return new Date();
}

export async function fetchHandoffData(
  baby:              Baby,
  feeds:             FeedEntry[],
  sleepEntries:      SleepEntry[],
  todayDiaperCount:  number,
  caregiverName:     string,
  notes:             string,
): Promise<HandoffData> {
  const now = new Date();

  // ── Medications: fetch and filter to last 3 days or future next-dose ──────
  let activeMedications: MedicationEntry[] = [];
  try {
    const all = await getMedications(baby.id, 20);
    const cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    activeMedications = all.filter((m) => {
      const given = toDate(m.givenAt);
      const next  = m.nextDoseAt ? toDate(m.nextDoseAt) : null;
      return given >= cutoff || (next !== null && next > now);
    });
  } catch { /* offline — skip */ }

  // ── Allergic foods ────────────────────────────────────────────────────────
  let allergicFoods: IntroducedFood[] = [];
  try {
    const all = await getIntroducedFoods(baby.id);
    allergicFoods = all.filter((f) => f.reaction === 'allergic');
  } catch { /* offline */ }

  // ── Sort feeds newest first ───────────────────────────────────────────────
  const sortedFeeds = [...feeds].sort(
    (a, b) => toDate(b.startTime).getTime() - toDate(a.startTime).getTime(),
  );
  const lastFeed = sortedFeeds[0] ?? null;

  // ── Avg interval from up to 5 recent feeds ────────────────────────────────
  let avgFeedIntervalMins = 180;
  if (sortedFeeds.length >= 2) {
    const intervals: number[] = [];
    for (let i = 0; i < Math.min(sortedFeeds.length - 1, 5); i++) {
      const diff = differenceInMinutes(toDate(sortedFeeds[i].startTime), toDate(sortedFeeds[i + 1].startTime));
      if (diff > 30 && diff < 500) intervals.push(diff);
    }
    if (intervals.length > 0) {
      avgFeedIntervalMins = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);
    }
  }

  const nextFeedEstimate = lastFeed
    ? addMinutes(toDate(lastFeed.startTime), avgFeedIntervalMins)
    : null;

  // ── Sleep ─────────────────────────────────────────────────────────────────
  const sortedSleep = [...sleepEntries].sort(
    (a, b) => toDate(b.startTime).getTime() - toDate(a.startTime).getTime(),
  );
  const currentSleep       = sortedSleep.find((s) => !s.endTime) ?? null;
  const lastCompletedSleep = sortedSleep.find((s) => !!s.endTime) ?? null;

  return {
    baby, generatedAt: now, caregiverName, notes,
    lastFeed, nextFeedEstimate, avgFeedIntervalMins,
    currentSleep, lastCompletedSleep,
    todayDiaperCount,
    activeMedications, allergicFoods,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function feedTypeLabel(f: FeedEntry): string {
  if (f.type === 'breastfeed') return `Breastfeed${f.side ? ` (${f.side})` : ''}${f.duration ? `, ${f.duration} min` : ''}`;
  if (f.type === 'formula')    return `Formula${f.amount ? ` — ${f.amount} ml` : ''}${f.brand ? ` (${f.brand})` : ''}`;
  return `Solids${f.foodType ? ` — ${f.foodType}` : ''}`;
}

function timeAgo(d: Date): string {
  const mins = differenceInMinutes(new Date(), d);
  if (mins < 60) return `${mins} min ago`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m ago` : `${h}h ago`;
}

function sleepLine(s: SleepEntry): string {
  const start  = toDate(s.startTime);
  const label  = isToday(start) ? format(start, 'h:mm a') : isYesterday(start) ? `Yesterday ${format(start, 'h:mm a')}` : format(start, 'dd MMM h:mm a');
  if (!s.endTime) return `Sleeping since ${label} (${timeAgo(start)})`;
  const end    = toDate(s.endTime);
  const durMins = differenceInMinutes(end, start);
  const h = Math.floor(durMins / 60), m = durMins % 60;
  const dur = h > 0 ? `${h}h${m > 0 ? ` ${m}m` : ''}` : `${m}m`;
  return `${label} – ${format(end, 'h:mm a')} (${dur})`;
}

// ─── WhatsApp text ────────────────────────────────────────────────────────────

export function buildHandoffText(d: HandoffData): string {
  const lines: string[] = [];
  const nameTag = d.caregiverName ? ` for ${d.caregiverName}` : '';

  lines.push(`👶 *BabySaathi — Care Card${nameTag}*`);
  lines.push(`📅 ${format(d.generatedAt, 'EEEE, d MMM yyyy · h:mm a')}`);
  lines.push('');
  lines.push(`*Baby:* ${d.baby.name}`);
  if (d.baby.bloodGroup && d.baby.bloodGroup !== 'Unknown') {
    lines.push(`*Blood Group:* ${d.baby.bloodGroup}`);
  }
  lines.push('');

  // Feeding
  lines.push('🍼 *FEEDING*');
  if (d.lastFeed) {
    lines.push(`Last fed: ${format(toDate(d.lastFeed.startTime), 'h:mm a')} (${timeAgo(toDate(d.lastFeed.startTime))})`);
    lines.push(`Type: ${feedTypeLabel(d.lastFeed)}`);
  } else {
    lines.push('No feeds logged today');
  }
  if (d.nextFeedEstimate) {
    lines.push(`Next feed: ~${format(d.nextFeedEstimate, 'h:mm a')} (every ~${Math.round(d.avgFeedIntervalMins / 60 * 10) / 10}h)`);
  }
  lines.push('');

  // Sleep
  lines.push('😴 *SLEEP*');
  if (d.currentSleep) {
    lines.push(sleepLine(d.currentSleep));
  } else if (d.lastCompletedSleep) {
    lines.push(`Last nap: ${sleepLine(d.lastCompletedSleep)}`);
  } else {
    lines.push('No sleep sessions logged today');
  }
  lines.push('');

  // Diapers
  lines.push(`👶 *DIAPERS TODAY:* ${d.todayDiaperCount}`);
  lines.push('');

  // Medications
  if (d.activeMedications.length > 0) {
    lines.push('💊 *MEDICATIONS*');
    d.activeMedications.forEach((m) => {
      const given = toDate(m.givenAt);
      let line = `• ${m.medicineName} — ${m.dose} ${m.unit}`;
      line += `, last given ${format(given, 'h:mm a')}`;
      if (m.nextDoseAt) line += `, next dose ${format(toDate(m.nextDoseAt), 'h:mm a')}`;
      if (m.reason)     line += ` (${m.reason})`;
      lines.push(line);
    });
    lines.push('');
  }

  // Allergies
  if (d.allergicFoods.length > 0) {
    lines.push('⚠️ *FOOD ALLERGIES*');
    d.allergicFoods.forEach((f) => lines.push(`• ${f.foodName}`));
    lines.push('');
  }

  // Doctor
  if (d.baby.pediatricianName) {
    lines.push('👨‍⚕️ *DOCTOR*');
    lines.push(`Dr. ${d.baby.pediatricianName}`);
    lines.push('');
  }

  lines.push('🚨 *EMERGENCY*');
  lines.push('Ambulance: 108');
  lines.push('Poison Control: 011-26593677');
  lines.push('');

  if (d.notes.trim()) {
    lines.push('📝 *NOTES*');
    lines.push(d.notes.trim());
    lines.push('');
  }

  lines.push('_Generated by BabySaathi 💙_');
  return lines.join('\n');
}

// ─── PDF HTML ─────────────────────────────────────────────────────────────────

export function buildHandoffHTML(d: HandoffData): string {
  const nameTag    = d.caregiverName ? ` for ${d.caregiverName}` : '';
  const allergyRow = d.allergicFoods.length > 0
    ? `<div class="warning-box"><div class="warning-title">⚠️ Food Allergies — Do NOT give</div>${d.allergicFoods.map((f) => `<div class="warning-item">• ${f.foodName}</div>`).join('')}</div>`
    : '';

  const medsRows = d.activeMedications.map((m) => {
    const given = toDate(m.givenAt);
    return `
      <tr>
        <td><strong>${m.medicineName}</strong>${m.reason ? ` <span style="color:#888;font-size:12px;">(${m.reason})</span>` : ''}</td>
        <td>${m.dose} ${m.unit}</td>
        <td>${format(given, 'h:mm a')}</td>
        <td>${m.nextDoseAt ? format(toDate(m.nextDoseAt), 'h:mm a') : '—'}</td>
      </tr>`;
  }).join('');

  let feedBlock = '<p style="color:#888;">No feeds logged today</p>';
  if (d.lastFeed) {
    feedBlock = `
      <p><strong>Last feed:</strong> ${format(toDate(d.lastFeed.startTime), 'h:mm a')} (${timeAgo(toDate(d.lastFeed.startTime))})</p>
      <p><strong>Type:</strong> ${feedTypeLabel(d.lastFeed)}</p>
      ${d.nextFeedEstimate ? `<p><strong>Next expected:</strong> ~${format(d.nextFeedEstimate, 'h:mm a')} (feeds approx. every ${Math.round(d.avgFeedIntervalMins / 60 * 10) / 10}h)</p>` : ''}`;
  }

  let sleepBlock = '<p style="color:#888;">No sleep sessions logged today</p>';
  if (d.currentSleep) {
    sleepBlock = `<p><strong>Currently sleeping</strong> — started at ${format(toDate(d.currentSleep.startTime), 'h:mm a')} (${timeAgo(toDate(d.currentSleep.startTime))})</p>`;
  } else if (d.lastCompletedSleep) {
    sleepBlock = `<p><strong>Last nap:</strong> ${sleepLine(d.lastCompletedSleep)}</p>`;
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', sans-serif; color: #1a1a1a; background: #fff; }
  .header {
    background: linear-gradient(135deg, #14532d 0%, #16a34a 100%);
    color: white; padding: 28px 32px 20px;
  }
  .header-title { font-size: 22px; font-weight: 800; }
  .header-sub   { font-size: 13px; opacity: 0.85; margin-top: 4px; }
  .body         { padding: 24px 32px; }
  .baby-row     { display: flex; align-items: center; gap: 16px; background: #f0fdf4; border-radius: 12px; padding: 16px; margin-bottom: 20px; border-left: 4px solid #16a34a; }
  .baby-emoji   { font-size: 40px; }
  .baby-name    { font-size: 20px; font-weight: 800; }
  .baby-meta    { font-size: 13px; color: #555; margin-top: 4px; }
  .grid         { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 20px; }
  .card         { border: 1.5px solid #e5e7eb; border-radius: 12px; padding: 16px; }
  .card-title   { font-size: 13px; font-weight: 800; color: #555; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.5px; }
  .card p       { font-size: 14px; line-height: 1.6; margin-bottom: 4px; }
  table         { width: 100%; border-collapse: collapse; }
  th            { font-size: 12px; color: #555; text-align: left; padding: 6px 8px; border-bottom: 2px solid #e5e7eb; }
  td            { font-size: 13px; padding: 8px 8px; border-bottom: 1px solid #f3f4f6; vertical-align: top; }
  .warning-box  { background: #fef2f2; border: 2px solid #fecaca; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .warning-title{ font-size: 15px; font-weight: 800; color: #b91c1c; margin-bottom: 8px; }
  .warning-item { font-size: 14px; color: #7f1d1d; margin-top: 4px; }
  .emergency    { background: #fff7ed; border: 2px solid #fed7aa; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .emergency h3 { color: #c2410c; font-size: 15px; margin-bottom: 8px; }
  .emergency p  { font-size: 14px; color: #7c2d12; margin-top: 4px; }
  .notes-box    { background: #fefce8; border: 1.5px solid #fde047; border-radius: 12px; padding: 16px; margin-bottom: 20px; }
  .notes-box h3 { font-size: 14px; font-weight: 800; color: #854d0e; margin-bottom: 8px; }
  .notes-box p  { font-size: 14px; color: #713f12; white-space: pre-line; }
  .footer       { text-align: center; font-size: 12px; color: #aaa; padding-top: 16px; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="header">
  <div class="header-title">👶 Care Instructions${nameTag}</div>
  <div class="header-sub">Generated ${format(d.generatedAt, 'EEEE, d MMMM yyyy')} at ${format(d.generatedAt, 'h:mm a')} · BabySaathi</div>
</div>
<div class="body">

  <div class="baby-row">
    <div class="baby-emoji">${d.baby.gender === 'female' ? '👧' : '👦'}</div>
    <div>
      <div class="baby-name">${d.baby.name}</div>
      <div class="baby-meta">${d.baby.bloodGroup && d.baby.bloodGroup !== 'Unknown' ? `Blood Group: ${d.baby.bloodGroup}` : ''}${d.baby.pediatricianName ? ` · Dr. ${d.baby.pediatricianName}` : ''}</div>
    </div>
  </div>

  <div class="grid">
    <div class="card">
      <div class="card-title">🍼 Feeding</div>
      ${feedBlock}
    </div>
    <div class="card">
      <div class="card-title">😴 Sleep</div>
      ${sleepBlock}
    </div>
    <div class="card">
      <div class="card-title">👶 Diapers Today</div>
      <p style="font-size:28px;font-weight:800;color:#1a1a1a;">${d.todayDiaperCount}</p>
      <p style="color:#888;font-size:13px;">changes logged</p>
    </div>
    ${d.baby.pediatricianName ? `
    <div class="card">
      <div class="card-title">👨‍⚕️ Paediatrician</div>
      <p><strong>Dr. ${d.baby.pediatricianName}</strong></p>
      ${d.baby.hospitalName ? `<p style="color:#555;">${d.baby.hospitalName}</p>` : ''}
    </div>` : ''}
  </div>

  ${d.activeMedications.length > 0 ? `
  <div class="card" style="margin-bottom:20px;">
    <div class="card-title">💊 Medications</div>
    <table>
      <tr><th>Medicine</th><th>Dose</th><th>Last Given</th><th>Next Dose</th></tr>
      ${medsRows}
    </table>
  </div>` : ''}

  ${allergyRow}

  <div class="emergency">
    <h3>🚨 Emergency Numbers</h3>
    <p><strong>Ambulance:</strong> 108</p>
    <p><strong>Poison Control (AIIMS):</strong> 011-26593677</p>
    <p><strong>Women Helpline:</strong> 1091</p>
  </div>

  ${d.notes.trim() ? `
  <div class="notes-box">
    <h3>📝 Notes from Mama/Papa</h3>
    <p>${d.notes.trim()}</p>
  </div>` : ''}

  <div class="footer">Generated by BabySaathi · babysaathi.app</div>
</div>
</body>
</html>`;
}
