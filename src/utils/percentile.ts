import {
  WHO_WEIGHT_BOYS, WHO_WEIGHT_GIRLS,
  WHO_HEIGHT_BOYS, WHO_HEIGHT_GIRLS,
  WHO_HEAD_BOYS, WHO_HEAD_GIRLS,
  WHOPoint,
} from '@constants/whoStandards';
import { Gender } from '@types/index';

export type GrowthMetric = 'weight' | 'height' | 'head';

function getTable(metric: GrowthMetric, gender: Gender): WHOPoint[] {
  switch (metric) {
    case 'weight': return gender === 'male' ? WHO_WEIGHT_BOYS : WHO_WEIGHT_GIRLS;
    case 'height': return gender === 'male' ? WHO_HEIGHT_BOYS : WHO_HEIGHT_GIRLS;
    case 'head':   return gender === 'male' ? WHO_HEAD_BOYS   : WHO_HEAD_GIRLS;
  }
}

// Linear interpolation between the two nearest monthly reference points
function interpolate(table: WHOPoint[], ageMonths: number): { p3: number; p50: number; p97: number } {
  const clamped = Math.max(table[0].month, Math.min(table[table.length - 1].month, ageMonths));
  for (let i = 0; i < table.length - 1; i++) {
    const lo = table[i];
    const hi = table[i + 1];
    if (clamped >= lo.month && clamped <= hi.month) {
      const t = (clamped - lo.month) / (hi.month - lo.month);
      return {
        p3:  lo.p3  + t * (hi.p3  - lo.p3),
        p50: lo.p50 + t * (hi.p50 - lo.p50),
        p97: lo.p97 + t * (hi.p97 - lo.p97),
      };
    }
  }
  const last = table[table.length - 1];
  return { p3: last.p3, p50: last.p50, p97: last.p97 };
}

export function getWHOReference(
  ageMonths: number,
  gender: Gender,
  metric: GrowthMetric
): { p3: number; p50: number; p97: number } {
  return interpolate(getTable(metric, gender), ageMonths);
}

// Approximate percentile via linear interpolation within each WHO band.
// Not as precise as full LMS method, but accurate enough for display.
export function calculateApproxPercentile(
  value: number,
  ageMonths: number,
  gender: Gender,
  metric: GrowthMetric
): number {
  const { p3, p50, p97 } = getWHOReference(ageMonths, gender, metric);
  if (value <= p3) {
    return Math.max(1, Math.round(3 * (value / p3)));
  }
  if (value <= p50) {
    return Math.round(3 + 47 * ((value - p3) / (p50 - p3)));
  }
  if (value <= p97) {
    return Math.round(50 + 47 * ((value - p50) / (p97 - p50)));
  }
  return Math.min(99, Math.round(97 + 3 * ((value - p97) / (p97 - p50))));
}

export interface PercentileLabel {
  label: string;
  color: string;
  bg: string;
  description: string;
}

export function getPercentileLabel(percentile: number): PercentileLabel {
  if (percentile < 3)  return { label: 'Below P3',  color: '#B03020', bg: '#B0302018', description: 'Consult your pediatrician' };
  if (percentile < 15) return { label: `~P${percentile}`, color: '#B8860B', bg: '#B8860B18', description: 'Slightly below average' };
  if (percentile <= 85) return { label: `~P${percentile}`, color: '#2E7D32', bg: '#2E7D3218', description: 'Healthy range 🎉' };
  if (percentile <= 97) return { label: `~P${percentile}`, color: '#B8860B', bg: '#B8860B18', description: 'Slightly above average' };
  return { label: 'Above P97', color: '#B03020', bg: '#B0302018', description: 'Consult your pediatrician' };
}

// Generate full 0–maxMonth WHO curve data for chart rendering
export function getWHOCurveData(
  gender: Gender,
  metric: GrowthMetric,
  maxMonth = 24
): { p3: { x: number; y: number }[]; p50: { x: number; y: number }[]; p97: { x: number; y: number }[] } {
  const table = getTable(metric, gender);
  const filtered = table.filter(pt => pt.month <= maxMonth);
  return {
    p3:  filtered.map(pt => ({ x: pt.month, y: pt.p3 })),
    p50: filtered.map(pt => ({ x: pt.month, y: pt.p50 })),
    p97: filtered.map(pt => ({ x: pt.month, y: pt.p97 })),
  };
}
