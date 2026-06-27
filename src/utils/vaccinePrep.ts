import { format, differenceInDays, differenceInWeeks } from 'date-fns';
import { Baby, VaccinationEntry } from '@types/index';
import { getVaccinations, getGrowthEntries } from '@services/firebase/firestore';

export interface VaccineVisit {
  dateKey:   string;   // yyyy-MM-dd grouping key
  date:      Date;
  daysUntil: number;   // negative = overdue
  vaccines:  VaccinationEntry[];
}

export interface VaccinePrepData {
  baby:               Baby;
  ageWeeks:           number;
  nextVisit:          VaccineVisit | null;
  overdueVisits:      VaccineVisit[];
  recentAdministered: VaccinationEntry[];   // last 3 completed
  latestWeightKg:     number | null;
  paracetamolDoseMl:  number | null;        // for 120 mg/5 ml suspension
  paracetamolMg:      number | null;        // actual mg dose
}

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof (v as any).toDate === 'function') return (v as any).toDate();
  return new Date(v as any);
}

function roundHalf(n: number): number {
  return Math.round(n * 4) / 4;   // round to nearest 0.25 ml
}

export async function fetchVaccinePrepData(baby: Baby): Promise<VaccinePrepData> {
  const now       = new Date();
  const birthDate = toDate(baby.birthDate);
  const ageWeeks  = differenceInWeeks(now, birthDate);

  // ── Fetch vaccines & growth in parallel ──────────────────────────────────
  const [allVaccines, growthEntries] = await Promise.all([
    getVaccinations(baby.id).catch(() => [] as VaccinationEntry[]),
    getGrowthEntries(baby.id).catch(() => []),
  ]);

  // ── Latest weight ─────────────────────────────────────────────────────────
  const withWeight = growthEntries.filter((e) => e.weight != null && e.weight > 0);
  const sortedGrowth = withWeight.sort(
    (a, b) => toDate(b.date).getTime() - toDate(a.date).getTime(),
  );
  let latestWeightKg: number | null = null;
  if (sortedGrowth.length > 0) {
    const w = sortedGrowth[0].weight!;
    latestWeightKg = w > 50 ? w / 1000 : w;
  } else if (baby.birthWeight) {
    latestWeightKg = baby.birthWeight > 50 ? baby.birthWeight / 1000 : baby.birthWeight;
  }

  // Paracetamol dose: 10 mg/kg, for 120 mg/5 ml (Crocin/Calpol) suspension
  let paracetamolDoseMl: number | null = null;
  let paracetamolMg:     number | null = null;
  if (latestWeightKg !== null) {
    const mg = 10 * latestWeightKg;                      // 10 mg/kg
    const ml = (mg * 5) / 120;                           // convert using 120 mg/5 ml strength
    paracetamolMg     = Math.round(mg);
    paracetamolDoseMl = roundHalf(ml);
  }

  // ── Group pending/overdue by date ─────────────────────────────────────────
  const pendingMap = new Map<string, VaccineVisit>();

  for (const v of allVaccines) {
    if (v.status !== 'pending' && v.status !== 'overdue') continue;
    const sd = toDate(v.scheduledDate);
    if (!(sd instanceof Date) || isNaN(sd.getTime())) continue; // skip corrupt dates
    const key  = format(sd, 'yyyy-MM-dd');
    const days = differenceInDays(sd, now);
    if (!pendingMap.has(key)) {
      pendingMap.set(key, { dateKey: key, date: sd, daysUntil: days, vaccines: [] });
    }
    pendingMap.get(key)!.vaccines.push(v);
  }

  const sorted       = Array.from(pendingMap.values()).sort((a, b) => a.date.getTime() - b.date.getTime());
  const overdueVisits = sorted.filter((v) => v.daysUntil < 0);
  const upcoming      = sorted.filter((v) => v.daysUntil >= 0);
  const nextVisit     = upcoming[0] ?? null;

  // ── Recent administered (last 3) ──────────────────────────────────────────
  const recentAdministered = allVaccines
    .filter((v) => v.status === 'administered' && v.administeredDate)
    .sort((a, b) => toDate(b.administeredDate!).getTime() - toDate(a.administeredDate!).getTime())
    .slice(0, 3);

  return {
    baby, ageWeeks, nextVisit, overdueVisits, recentAdministered,
    latestWeightKg, paracetamolDoseMl, paracetamolMg,
  };
}

// ─── WhatsApp text ────────────────────────────────────────────────────────────

export function buildVisitPrepText(d: VaccinePrepData): string {
  const lines: string[] = [
    `💉 *Vaccine Visit Prep — ${d.baby.name}*`,
    `📅 Generated ${format(new Date(), 'd MMM yyyy, h:mm a')}`,
    '',
  ];

  if (d.nextVisit) {
    const days   = d.nextVisit.daysUntil;
    const when   = days === 0 ? 'Today!' : days === 1 ? 'Tomorrow' : `In ${days} days`;
    lines.push(`*Next visit:* ${format(d.nextVisit.date, 'd MMMM yyyy')} — ${when}`);
    lines.push(`*Baby age at visit:* ${d.ageWeeks + Math.round(days / 7)} weeks`);
    lines.push('');
    lines.push('*Vaccines due:*');
    for (const v of d.nextVisit.vaccines) {
      lines.push(`• ${v.vaccineName}`);
    }
    lines.push('');
  }

  if (d.overdueVisits.length > 0) {
    lines.push('⚠️ *OVERDUE vaccines:*');
    for (const visit of d.overdueVisits) {
      for (const v of visit.vaccines) {
        lines.push(`• ${v.vaccineName} (was due ${format(toDate(v.scheduledDate), 'd MMM')})`);
      }
    }
    lines.push('');
  }

  lines.push('*✅ Pre-visit checklist:*');
  lines.push('• Bring immunisation card');
  lines.push('• Easy-access clothing (thigh/arm)');
  lines.push('• Breastfeed just before the jab');
  lines.push('• NO paracetamol before vaccination');
  lines.push('• Wait 15 min at clinic after all shots');
  lines.push('');

  if (d.paracetamolDoseMl !== null) {
    lines.push(`*💊 Paracetamol dose* (if fever > 38.5°C AFTER vaccine):`);
    lines.push(`${d.paracetamolDoseMl} ml of Crocin/Calpol 120mg/5ml suspension`);
    lines.push(`(${d.paracetamolMg} mg · for ${d.latestWeightKg?.toFixed(1)} kg · every 4–6 hours, max 4 doses/day)`);
    lines.push('_Give ONLY after the vaccine, never before_');
    lines.push('');
  }

  lines.push('_Generated by BabySaathi 💙_');
  return lines.join('\n');
}
