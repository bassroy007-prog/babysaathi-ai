import { differenceInDays, addDays, format } from 'date-fns';
import { Baby } from '@types/index';
import { getGrowthEntries } from '@services/firebase/firestore';
import { calculateApproxPercentile, getWHOCurveData } from '@utils/percentile';
import { Gender } from '@types/index';

// ─── Types ────────────────────────────────────────────────────────────────────

export type VelocityStatus = 'excellent' | 'good' | 'watch' | 'low';

export interface GrowthDataPoint {
  date:       Date;
  ageMonths:  number;
  weightKg:   number;
  heightCm:   number | null;
  weightPct:  number;
  heightPct:  number | null;
}

export interface VelocityInfo {
  gPerDay:          number;
  targetMin:        number;
  targetMax:        number;
  status:           VelocityStatus;
  statusColor:      string;
  statusEmoji:      string;
  label:            string;
}

export interface GrowthPrediction {
  weeksAhead:       number;
  predictedKg:      number;
  confidenceLow:    number;
  confidenceHigh:   number;
  predictedPct:     number;
  targetDate:       Date;
  ageMonthsAt:      number;
}

export interface PercentileTrend {
  direction:        'rising' | 'stable' | 'falling';
  deltaLabel:       string;
  color:            string;
  emoji:            string;
  fromPct:          number;
  toPct:            number;
}

export interface GrowthTrendData {
  baby:             Baby;
  ageMonths:        number;
  currentAgeWeeks:  number;
  points:           GrowthDataPoint[];
  latest:           GrowthDataPoint;
  velocity:         VelocityInfo;
  percentileTrend:  PercentileTrend;
  prediction4w:     GrowthPrediction;
  prediction8w:     GrowthPrediction;
  hasHeightData:    boolean;
  // chart data (x = age in months, y = weight in kg)
  actualSeries:           { x: number; y: number }[];
  projectionSeries:       { x: number; y: number }[];
  projectionBandHigh:     { x: number; y: number }[];
  projectionBandLow:      { x: number; y: number }[];
  whoP3:            { x: number; y: number }[];
  whoP50:           { x: number; y: number }[];
  whoP97:           { x: number; y: number }[];
  chartXMin:        number;
  chartXMax:        number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof (v as any).toDate === 'function') return (v as any).toDate();
  return new Date(v as any);
}

function normalizeWeightKg(w: number): number {
  return w > 50 ? w / 1000 : w;   // stored in grams or kg inconsistently
}

const VELOCITY_NORMS: Array<{ maxMonths: number; min: number; max: number }> = [
  { maxMonths: 3,   min: 26, max: 35 },
  { maxMonths: 6,   min: 17, max: 22 },
  { maxMonths: 9,   min: 12, max: 16 },
  { maxMonths: 12,  min: 8,  max: 12 },
  { maxMonths: 24,  min: 5,  max: 8  },
  { maxMonths: 999, min: 3,  max: 6  },
];

function getVelocityNorm(mo: number) {
  return VELOCITY_NORMS.find((n) => mo <= n.maxMonths)!;
}

function classifyVelocity(gPerDay: number, ageMonths: number): {
  status: VelocityStatus; statusColor: string; statusEmoji: string; label: string;
} {
  const { min, max } = getVelocityNorm(ageMonths);
  if (gPerDay >= max * 0.9) return { status: 'excellent', statusColor: '#15803D', statusEmoji: '🚀', label: 'Excellent growth' };
  if (gPerDay >= min * 0.85) return { status: 'good',     statusColor: '#2D7A3A', statusEmoji: '✅', label: 'On track'        };
  if (gPerDay >= min * 0.6)  return { status: 'watch',    statusColor: '#B45309', statusEmoji: '⚠️', label: 'Watch closely'   };
  return                              { status: 'low',      statusColor: '#B91C1C', statusEmoji: '📉', label: 'Below target'    };
}

// Simple unweighted least-squares linear regression: y = slope·x + intercept
function linearRegression(pts: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = pts.length;
  if (n < 2) return { slope: 0, intercept: pts[0]?.y ?? 0 };
  const xM = pts.reduce((s, p) => s + p.x, 0) / n;
  const yM = pts.reduce((s, p) => s + p.y, 0) / n;
  let ssXY = 0, ssXX = 0;
  for (const p of pts) { ssXY += (p.x - xM) * (p.y - yM); ssXX += (p.x - xM) ** 2; }
  const slope = ssXX === 0 ? 0 : ssXY / ssXX;
  return { slope, intercept: yM - slope * xM };
}

// ─── Main fetch ───────────────────────────────────────────────────────────────

export async function fetchGrowthTrendData(baby: Baby): Promise<GrowthTrendData | null> {
  const rawEntries = await getGrowthEntries(baby.id);
  const birthDate  = toDate(baby.birthDate);
  const now        = new Date();

  const points: GrowthDataPoint[] = rawEntries
    .filter((e) => {
      if (e.weight == null || e.weight <= 0) return false;
      const d = toDate(e.date);
      if (!(d instanceof Date) || isNaN(d.getTime())) return false;
      if (d > now) return false;                            // reject future-dated entries
      const ageMo = differenceInDays(d, birthDate) / 30.44;
      if (ageMo < 0) return false;                         // reject entries before birth
      const kg = normalizeWeightKg(e.weight!);
      if (isNaN(kg) || kg <= 0 || kg > 50) return false;  // reject implausible weights
      return true;
    })
    .map((e) => {
      const date      = toDate(e.date);
      const ageMonths = differenceInDays(date, birthDate) / 30.44;
      const weightKg  = normalizeWeightKg(e.weight!);
      const heightCm  = e.height ?? null;
      return {
        date, ageMonths, weightKg, heightCm,
        weightPct: calculateApproxPercentile(weightKg, Math.max(0, ageMonths), baby.gender, 'weight'),
        heightPct: heightCm ? calculateApproxPercentile(heightCm, Math.max(0, ageMonths), baby.gender, 'height') : null,
      };
    })
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (points.length === 0) return null;

  const latest     = points[points.length - 1];
  const ageMonths  = differenceInDays(now, birthDate) / 30.44;
  const ageWeeks   = Math.floor(differenceInDays(now, birthDate) / 7);

  // ── Regression on last 6 points ──────────────────────────────────────────
  const regPts = points.slice(-6).map((p) => ({ x: p.ageMonths, y: p.weightKg }));
  const { slope, intercept } = linearRegression(regPts);

  // slope is kg/month → g/day
  const gPerDay = slope * 1000 / 30.44;
  const velNorm = getVelocityNorm(ageMonths);
  const velClass = classifyVelocity(Math.max(0, gPerDay), ageMonths);

  const velocity: VelocityInfo = {
    gPerDay: Math.round(gPerDay),
    targetMin: velNorm.min,
    targetMax: velNorm.max,
    ...velClass,
  };

  // ── Percentile trend (last 4 readings) ───────────────────────────────────
  const pctHistory     = points.slice(-4);
  const fromPct        = pctHistory[0]?.weightPct ?? latest.weightPct;
  const toPct          = latest.weightPct;
  const delta          = toPct - fromPct;
  const percentileTrend: PercentileTrend = {
    fromPct, toPct,
    direction:  delta >  5 ? 'rising' : delta < -5 ? 'falling' : 'stable',
    deltaLabel: delta >  5 ? `+${Math.round(delta)} pct pts` : delta < -5 ? `${Math.round(delta)} pct pts` : 'Holding steady',
    color:      delta >  5 ? '#15803D' : delta < -5 ? '#B91C1C' : '#2563EB',
    emoji:      delta >  5 ? '↗️' : delta < -5 ? '↘️' : '→',
  };

  // ── Predictions ───────────────────────────────────────────────────────────
  function makePrediction(weeksAhead: number): GrowthPrediction {
    const targetDate   = addDays(now, weeksAhead * 7);
    const ageMonthsAt  = ageMonths + (weeksAhead * 7) / 30.44;
    const rawPredicted = slope * ageMonthsAt + intercept;
    const predictedKg  = Math.max(latest.weightKg, rawPredicted);
    const uncert       = predictedKg * 0.08 * (weeksAhead / 4);
    const predictedPct = calculateApproxPercentile(predictedKg, Math.min(24, ageMonthsAt), baby.gender, 'weight');
    return {
      weeksAhead, predictedKg, targetDate, ageMonthsAt, predictedPct,
      confidenceLow:  Math.max(0, predictedKg - uncert),
      confidenceHigh: predictedKg + uncert,
    };
  }

  // ── Chart series ─────────────────────────────────────────────────────────
  const actualSeries = points.map((p) => ({ x: p.ageMonths, y: p.weightKg }));

  const projEnd   = ageMonths + 8 / 4.33;
  const STEPS     = 6;
  const projectionSeries:   { x: number; y: number }[] = [];
  const projectionBandHigh: { x: number; y: number }[] = [];
  const projectionBandLow:  { x: number; y: number }[] = [];

  for (let i = 0; i <= STEPS; i++) {
    const x    = latest.ageMonths + (projEnd - latest.ageMonths) * (i / STEPS);
    const y    = Math.max(latest.weightKg, slope * x + intercept);
    const band = y * 0.08 * (i / STEPS);
    projectionSeries.push({ x, y });
    projectionBandHigh.push({ x, y: y + band });
    projectionBandLow.push(  { x, y: Math.max(0, y - band) });
  }

  const chartXMin   = Math.max(0, points[0].ageMonths - 0.5);
  const chartXMax   = Math.ceil(projEnd) + 0.5;
  const whoMaxMonth = Math.min(24, Math.ceil(projEnd) + 1);
  const curves      = getWHOCurveData(baby.gender, 'weight', whoMaxMonth);

  return {
    baby, ageMonths, currentAgeWeeks: ageWeeks,
    points, latest, velocity, percentileTrend,
    prediction4w: makePrediction(4),
    prediction8w: makePrediction(8),
    hasHeightData: points.some((p) => p.heightCm !== null),
    actualSeries, projectionSeries, projectionBandHigh, projectionBandLow,
    whoP3: curves.p3, whoP50: curves.p50, whoP97: curves.p97,
    chartXMin, chartXMax,
  };
}

// ─── WhatsApp text ────────────────────────────────────────────────────────────

export function buildGrowthSummaryText(d: GrowthTrendData): string {
  const name = d.baby.name;
  const kg   = (v: number) => `${v.toFixed(2)} kg`;
  return [
    `📈 *${name}'s Growth Predictor*`,
    ``,
    `*Current:* ${kg(d.latest.weightKg)} · P${d.latest.weightPct}`,
    ...(d.latest.heightCm ? [`*Height:* ${d.latest.heightCm} cm · P${d.latest.heightPct ?? '—'}`] : []),
    `*Age:* ${Math.round(d.ageMonths)} months`,
    ``,
    `*Growth velocity:* ${d.velocity.gPerDay > 0 ? '+' : ''}${d.velocity.gPerDay}g/day ${d.velocity.statusEmoji}`,
    `_WHO target: ${d.velocity.targetMin}–${d.velocity.targetMax}g/day_`,
    `*Trend:* ${d.percentileTrend.emoji} ${d.percentileTrend.deltaLabel}`,
    ``,
    `*In 4 weeks (${format(d.prediction4w.targetDate, 'd MMM')}):*`,
    `~${kg(d.prediction4w.predictedKg)} · P${d.prediction4w.predictedPct}`,
    `Range: ${kg(d.prediction4w.confidenceLow)} – ${kg(d.prediction4w.confidenceHigh)}`,
    ``,
    `*In 8 weeks (${format(d.prediction8w.targetDate, 'd MMM')}):*`,
    `~${kg(d.prediction8w.predictedKg)} · P${d.prediction8w.predictedPct}`,
    `Range: ${kg(d.prediction8w.confidenceLow)} – ${kg(d.prediction8w.confidenceHigh)}`,
    ``,
    `_Generated by BabySaathi 💙_`,
  ].join('\n');
}
