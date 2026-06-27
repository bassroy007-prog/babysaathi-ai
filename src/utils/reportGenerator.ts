// ─── Daily Baby Report Generator ─────────────────────────────────────────────
// Builds an HTML string (for PDF) and a plain-text string (for WhatsApp/SMS)

import { format } from 'date-fns';
import type {
  Baby,
  FeedEntry,
  SleepEntry,
  DiaperEntry,
  GrowthEntry,
  TemperatureEntry,
  MedicationEntry,
  VaccinationEntry,
} from '@types/index';

export interface DailyReportData {
  baby: Baby;
  ageText: string;
  date: Date;
  feeds: FeedEntry[];
  sleep: SleepEntry[];
  diapers: DiaperEntry[];
  latestGrowth?: GrowthEntry;
  temperatures: TemperatureEntry[];
  medications: MedicationEntry[];
  nextVaccine?: VaccinationEntry;
}

function ageTip(baby: Baby): string {
  const months = Math.floor((Date.now() - baby.birthDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
  if (months < 3)  return 'Tummy time for 3–5 minutes, 3× daily builds neck and back strength. Always supervise and never leave baby unattended on tummy.';
  if (months < 6)  return 'Talk, sing, and narrate your day constantly — every word builds neural pathways! High-pitched "parentese" speech is especially effective.';
  if (months < 9)  return 'Introduce one new solid food every 3 days and watch for reactions. Breast milk / formula is still the main nutrition at this age.';
  if (months < 12) return 'Encourage finger foods and self-feeding — it builds fine motor skills, jaw strength, and independence. Let baby make a glorious mess!';
  if (months < 18) return 'Name everything around you — baby\'s vocabulary is exploding! Read picture books daily, even just 5 minutes makes a huge difference.';
  return 'Offer water with meals and limit juice to 4 oz/day. Screen time should be minimal; real-world play and conversation are far more stimulating at this age.';
}

function fmtDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
}

// ─── HTML builder (used for PDF export) ─────────────────────────────────────

export function buildReportHTML(data: DailyReportData): string {
  const { baby, ageText, date, feeds, sleep, diapers, latestGrowth, temperatures, medications, nextVaccine } = data;

  const totalFeedMin  = feeds.reduce((a, f) => a + (f.duration ?? 0), 0);
  const totalSleepMin = sleep.reduce((a, s) => a + (s.duration ?? 0), 0);
  const wetDiapers    = diapers.filter((d) => d.type === 'wet'   || d.type === 'mixed').length;
  const dirtyDiapers  = diapers.filter((d) => d.type === 'dirty' || d.type === 'mixed').length;

  const feedRows = feeds.map((f) => {
    const detail =
      f.type === 'breastfeed' ? `Breastfeed${f.side ? ` (${f.side})` : ''}${f.duration ? `, ${f.duration} min` : ''}`
      : f.type === 'formula'  ? `Formula${f.amount ? `, ${f.amount} ml` : ''}`
      :                         `Solids${f.foodType ? ` — ${f.foodType}` : ''}`;
    return `<tr><td>${format(f.startTime, 'h:mm a')}</td><td>${detail}</td></tr>`;
  }).join('');

  const sleepRows = sleep.map((s) => {
    const end = s.endTime ? format(s.endTime, 'h:mm a') : 'Ongoing';
    const dur = s.duration ? fmtDuration(s.duration) : '';
    return `<tr><td>${format(s.startTime, 'h:mm a')} – ${end}</td><td>${dur}</td></tr>`;
  }).join('');

  const tempRows = temperatures.map((t) =>
    `<tr><td>${format(t.time, 'h:mm a')}</td><td>${t.temperature}°C</td><td style="color:${t.feverStatus === 'normal' ? '#2D7A3A' : '#C0392B'}">${t.feverStatus.replace('_', ' ')}</td></tr>`
  ).join('');

  const medRows = medications.map((m) =>
    `<tr><td>${format(m.givenAt, 'h:mm a')}</td><td>${m.medicineName}</td><td>${m.dose} ${m.unit}</td><td>${m.reason ?? ''}</td></tr>`
  ).join('');

  const growthSection = latestGrowth ? (() => {
    const w = latestGrowth.weight ? (latestGrowth.weight > 50 ? latestGrowth.weight / 1000 : latestGrowth.weight).toFixed(2) + ' kg' : '';
    const h = latestGrowth.height ? latestGrowth.height + ' cm' : '';
    const hc = latestGrowth.headCircumference ? latestGrowth.headCircumference + ' cm' : '';
    return `
    <div class="section">
      <div class="section-title">📏 Latest Growth</div>
      <div class="growth-grid">
        ${w  ? `<div class="gi"><div class="gv">${w}</div><div class="gl">Weight</div></div>` : ''}
        ${h  ? `<div class="gi"><div class="gv">${h}</div><div class="gl">Height</div></div>` : ''}
        ${hc ? `<div class="gi"><div class="gv">${hc}</div><div class="gl">Head Circ.</div></div>` : ''}
        <div class="gi"><div class="gv">${format(latestGrowth.date, 'd MMM')}</div><div class="gl">Measured</div></div>
      </div>
    </div>`;
  })() : '';

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;color:#333;font-size:13px}
.page{max-width:650px;margin:0 auto;background:#fff}
.hdr{background:linear-gradient(135deg,#1a5228,#2d7a3a);padding:22px 24px 18px;color:#fff}
.hdr-top{display:flex;justify-content:space-between;margin-bottom:12px}
.brand{font-size:12px;opacity:.8;letter-spacing:.4px}
.hdr-date{font-size:12px;opacity:.8}
.baby-name{font-size:24px;font-weight:800;margin-bottom:3px}
.baby-sub{font-size:13px;opacity:.85}
.stats{background:#fff;border-radius:12px;margin:18px 18px 0;padding:14px;display:flex;justify-content:space-around;box-shadow:0 2px 12px rgba(0,0,0,.08)}
.stat{text-align:center;flex:1}
.stat-v{font-size:22px;font-weight:800;color:#2d7a3a}
.stat-l{font-size:10px;color:#888;margin-top:2px}
.sdiv{width:1px;background:#eee}
.body{padding:10px 18px 24px}
.section{margin-bottom:16px}
.section-title{font-size:12px;font-weight:700;color:#2d7a3a;text-transform:uppercase;letter-spacing:.5px;margin-bottom:7px;padding-bottom:5px;border-bottom:1px solid #e8f5e9}
table{width:100%;border-collapse:collapse}
th{background:#f9f9f9;font-size:10px;color:#999;text-align:left;padding:5px 8px;font-weight:600}
td{padding:6px 8px;border-bottom:1px solid #f0f0f0;font-size:12px;color:#444}
tr:last-child td{border-bottom:none}
.empty{text-align:center;color:#bbb;font-style:italic;padding:10px;font-size:11px}
.growth-grid{display:flex;gap:10px}
.gi{flex:1;background:#f9f9f9;border-radius:8px;padding:9px 6px;text-align:center}
.gv{font-size:15px;font-weight:700;color:#2d7a3a}
.gl{font-size:10px;color:#888;margin-top:2px}
.diaper-row{background:#f9f9f9;border-radius:8px;padding:11px 14px;display:flex;gap:20px;font-size:13px}
.tip{background:linear-gradient(135deg,#f0fdf4,#dcfce7);border-left:3px solid #2d7a3a;border-radius:0 8px 8px 0;padding:11px 13px}
.tip-t{font-size:11px;font-weight:700;color:#2d7a3a;margin-bottom:5px}
.tip-b{font-size:12px;color:#444;line-height:1.6}
.vax{background:#fffde7;padding:8px 12px;border-radius:6px;font-size:12px;color:#555}
.ftr{background:#f9f9f9;padding:12px 18px;border-top:1px solid #eee}
.ftr-top{display:flex;justify-content:space-between;margin-bottom:4px}
.ftr-brand{font-size:11px;color:#2d7a3a;font-weight:600}
.ftr-ts{font-size:10px;color:#aaa}
.ftr-doc{font-size:10px;color:#999;margin-top:2px}
</style></head><body>
<div class="page">
  <div class="hdr">
    <div class="hdr-top"><div class="brand">🍼 BabySaathi AI</div><div class="hdr-date">${format(date, 'EEEE, d MMMM yyyy')}</div></div>
    <div class="baby-name">${baby.name}</div>
    <div class="baby-sub">${ageText} • ${baby.gender === 'male' ? '👦 Boy' : '👧 Girl'} • Blood: ${baby.bloodGroup}</div>
  </div>

  <div class="stats">
    <div class="stat"><div class="stat-v">🍼 ${feeds.length}</div><div class="stat-l">Feeds</div></div>
    <div class="sdiv"></div>
    <div class="stat"><div class="stat-v">😴 ${(totalSleepMin / 60).toFixed(1)}h</div><div class="stat-l">Sleep</div></div>
    <div class="sdiv"></div>
    <div class="stat"><div class="stat-v">👶 ${diapers.length}</div><div class="stat-l">Diapers</div></div>
  </div>

  <div class="body">
    <div class="section">
      <div class="section-title">🍼 Feeding</div>
      ${feeds.length > 0
        ? `<table><tr><th>Time</th><th>Detail</th></tr>${feedRows}</table>${totalFeedMin > 0 ? `<p style="text-align:right;font-size:10px;color:#aaa;margin-top:5px">Total breastfeed time: ${fmtDuration(totalFeedMin)}</p>` : ''}`
        : `<div class="empty">No feeds logged today</div>`}
    </div>

    <div class="section">
      <div class="section-title">😴 Sleep</div>
      ${sleep.length > 0
        ? `<table><tr><th>Period</th><th>Duration</th></tr>${sleepRows}</table><p style="text-align:right;font-size:10px;color:#aaa;margin-top:5px">Total: ${fmtDuration(totalSleepMin)} in ${sleep.length} sleep period${sleep.length !== 1 ? 's' : ''}</p>`
        : `<div class="empty">No sleep logged today</div>`}
    </div>

    <div class="section">
      <div class="section-title">👶 Diapers</div>
      ${diapers.length > 0
        ? `<div class="diaper-row"><span>Total: <strong>${diapers.length}</strong></span><span>💧 Wet: <strong>${wetDiapers}</strong></span><span>💩 Dirty: <strong>${dirtyDiapers}</strong></span></div>`
        : `<div class="empty">No diapers logged today</div>`}
    </div>

    ${growthSection}

    ${temperatures.length > 0 ? `
    <div class="section">
      <div class="section-title">🌡️ Temperature</div>
      <table><tr><th>Time</th><th>Temp</th><th>Status</th></tr>${tempRows}</table>
    </div>` : ''}

    ${medications.length > 0 ? `
    <div class="section">
      <div class="section-title">💊 Medicines Given</div>
      <table><tr><th>Time</th><th>Medicine</th><th>Dose</th><th>Reason</th></tr>${medRows}</table>
    </div>` : ''}

    ${nextVaccine ? `
    <div class="section">
      <div class="section-title">💉 Next Vaccine Due</div>
      <div class="vax">${nextVaccine.vaccineName} — <strong>${format(nextVaccine.scheduledDate, 'd MMMM yyyy')}</strong></div>
    </div>` : ''}

    <div class="section">
      <div class="section-title">💡 BabySaathi AI Tip</div>
      <div class="tip">
        <div class="tip-t">For ${ageText} ${baby.name}</div>
        <div class="tip-b">${ageTip(baby)}</div>
      </div>
    </div>
  </div>

  <div class="ftr">
    <div class="ftr-top">
      <div class="ftr-brand">🍼 BabySaathi AI</div>
      <div class="ftr-ts">Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}</div>
    </div>
    <div class="ftr-doc">
      ${baby.pediatricianName ? `👨‍⚕️ ${baby.pediatricianName}` : ''}${baby.hospitalName ? ` • 🏥 ${baby.hospitalName}` : ''}
    </div>
  </div>
</div>
</body></html>`;
}

// ─── Plain-text builder (WhatsApp / SMS) ─────────────────────────────────────

export function buildReportText(data: DailyReportData): string {
  const { baby, ageText, date, feeds, sleep, diapers, latestGrowth, temperatures, medications, nextVaccine } = data;

  const totalSleepMin = sleep.reduce((a, s) => a + (s.duration ?? 0), 0);
  const wetDiapers    = diapers.filter((d) => d.type === 'wet'   || d.type === 'mixed').length;
  const dirtyDiapers  = diapers.filter((d) => d.type === 'dirty' || d.type === 'mixed').length;

  let t = `🍼 *BabySaathi Daily Report*\n`;
  t += `👶 *${baby.name}* • ${ageText}\n`;
  t += `📅 ${format(date, 'EEEE, d MMMM yyyy')}\n`;
  t += `─────────────────────\n\n`;

  t += `🍼 *FEEDS* (${feeds.length} today)\n`;
  feeds.forEach((f) => {
    const detail =
      f.type === 'breastfeed' ? `Breastfeed${f.side ? ` (${f.side})` : ''}${f.duration ? `, ${f.duration} min` : ''}`
      : f.type === 'formula'  ? `Formula${f.amount ? `, ${f.amount} ml` : ''}`
      :                         `Solids${f.foodType ? ` — ${f.foodType}` : ''}`;
    t += `  • ${format(f.startTime, 'h:mm a')} — ${detail}\n`;
  });
  if (!feeds.length) t += `  No feeds logged\n`;
  t += `\n`;

  t += `😴 *SLEEP* (${(totalSleepMin / 60).toFixed(1)} hrs total)\n`;
  sleep.forEach((s) => {
    const end = s.endTime ? format(s.endTime, 'h:mm a') : 'ongoing';
    const dur = s.duration ? ` (${fmtDuration(s.duration)})` : '';
    t += `  • ${format(s.startTime, 'h:mm a')} – ${end}${dur}\n`;
  });
  if (!sleep.length) t += `  No sleep logged\n`;
  t += `\n`;

  t += `👶 *DIAPERS* (${diapers.length} total)\n`;
  t += `  💧 Wet: ${wetDiapers}   💩 Dirty: ${dirtyDiapers}\n\n`;

  if (latestGrowth) {
    const w  = latestGrowth.weight          ? (latestGrowth.weight > 50 ? latestGrowth.weight / 1000 : latestGrowth.weight).toFixed(2) + ' kg' : '';
    const h  = latestGrowth.height          ? latestGrowth.height + ' cm' : '';
    t += `📏 *GROWTH* (${format(latestGrowth.date, 'd MMM')}): ${[w, h].filter(Boolean).join(' | ')}\n\n`;
  }

  if (temperatures.length) {
    t += `🌡️ *TEMPERATURE*\n`;
    temperatures.forEach((temp) => {
      t += `  • ${format(temp.time, 'h:mm a')} — ${temp.temperature}°C (${temp.feverStatus.replace('_', ' ')})\n`;
    });
    t += `\n`;
  }

  if (medications.length) {
    t += `💊 *MEDICINES*\n`;
    medications.forEach((m) => {
      t += `  • ${format(m.givenAt, 'h:mm a')} — ${m.medicineName} ${m.dose}${m.unit}${m.reason ? ` (${m.reason})` : ''}\n`;
    });
    t += `\n`;
  }

  if (nextVaccine) {
    t += `💉 *NEXT VACCINE* — ${nextVaccine.vaccineName} due ${format(nextVaccine.scheduledDate, 'd MMM yyyy')}\n\n`;
  }

  t += `─────────────────────\n`;
  t += `❤️ Tracked with *BabySaathi AI*`;
  return t;
}
