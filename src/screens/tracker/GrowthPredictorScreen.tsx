import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Share, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import {
  VictoryChart, VictoryLine, VictoryArea, VictoryScatter,
  VictoryAxis, VictoryTheme,
} from 'victory-native';
import { format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { getPercentileLabel } from '@utils/percentile';
import {
  fetchGrowthTrendData, buildGrowthSummaryText,
  type GrowthTrendData, type GrowthPrediction,
} from '@utils/growthPredictor';

const { width: W } = Dimensions.get('window');
const CHART_W      = W - Spacing.xl * 2 - 2;  // card inset
const CHART_H      = 260;

const ACTUAL_COLOR     = '#2563EB';
const PROJ_COLOR       = '#EA580C';
const WHO_BAND_COLOR   = '#DCFCE7';
const WHO_P50_COLOR    = '#16A34A';

// ─── Prediction card ──────────────────────────────────────────────────────────

function PredictionCard({ pred, color }: { pred: GrowthPrediction; color: string }) {
  const pctLabel = getPercentileLabel(pred.predictedPct);
  return (
    <View style={[styles.predCard, { borderTopColor: color }]}>
      <Text style={[styles.predWeeks, { color }]}>In {pred.weeksAhead} weeks</Text>
      <Text style={styles.predDate}>{format(pred.targetDate, 'd MMM yyyy')}</Text>
      <Text style={[styles.predWeight, { color }]}>
        ~{pred.predictedKg.toFixed(2)} <Text style={styles.predKg}>kg</Text>
      </Text>
      <View style={[styles.predPctBadge, { backgroundColor: pctLabel.bg }]}>
        <Text style={[styles.predPctText, { color: pctLabel.color }]}>{pctLabel.label}</Text>
      </View>
      <Text style={styles.predRange}>
        {pred.confidenceLow.toFixed(2)}–{pred.confidenceHigh.toFixed(2)} kg
      </Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GrowthPredictorScreen() {
  const { activeBaby } = useBabyStore();
  const [data, setData]       = useState<GrowthTrendData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!activeBaby) { setLoading(false); return; }
    setLoading(true);
    fetchGrowthTrendData(activeBaby)
      .then((d) => {
        setData(d);
        if (!d) setError('No weight measurements found yet.\nAdd measurements in the Growth Tracker to see predictions.');
      })
      .catch(() => setError('Failed to load growth data. Please try again.'))
      .finally(() => setLoading(false));
  }, [activeBaby]);

  const shareText = () => {
    if (!data) return;
    Share.share({ message: buildGrowthSummaryText(data) }).catch(() => {});
  };

  const pctNow = data ? getPercentileLabel(data.latest.weightPct) : null;

  // Build WHO band: each point has y = P97, y0 = P3 (for VictoryArea fill)
  const whoBand = data
    ? data.whoP3.map((p, i) => ({ x: p.x, y: data.whoP97[i]?.y ?? p.y, y0: p.y }))
    : [];

  // Projection band
  const projBand = data
    ? data.projectionBandLow.map((p, i) => ({
        x:  p.x,
        y:  data.projectionBandHigh[i]?.y ?? p.y,
        y0: p.y,
      }))
    : [];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#1E1B4B', '#4338CA']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📈 Growth Predictor</Text>
            <Text style={styles.headerSub}>
              {activeBaby ? `${activeBaby.name} · ${Math.round(data?.ageMonths ?? 0)} months old` : 'Loading…'}
            </Text>

            {/* Stat chips */}
            {data && !loading && (
              <View style={styles.headerChips}>
                <View style={styles.headerChip}>
                  <Text style={styles.chipVal}>{data.latest.weightKg.toFixed(2)} kg</Text>
                  <Text style={styles.chipLbl}>Weight</Text>
                </View>
                <View style={[styles.headerChip, { backgroundColor: pctNow!.bg + 'CC' }]}>
                  <Text style={[styles.chipVal, { color: pctNow!.color }]}>{pctNow!.label}</Text>
                  <Text style={styles.chipLbl}>WHO Pct.</Text>
                </View>
                <View style={styles.headerChip}>
                  <Text style={[styles.chipVal, { color: data.velocity.statusColor }]}>
                    {data.velocity.statusEmoji} {Math.abs(data.velocity.gPerDay)}g/d
                  </Text>
                  <Text style={styles.chipLbl}>Velocity</Text>
                </View>
              </View>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#4338CA" size="large" />
            <Text style={styles.loadingText}>Analysing growth data…</Text>
          </View>
        ) : error ? (
          <View style={styles.center}>
            <Text style={styles.emptyEmoji}>📏</Text>
            <Text style={styles.emptyText}>{error}</Text>
          </View>
        ) : data ? (
          <>
            {/* ── Main chart ─────────────────────────────────────────────── */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Weight Trajectory</Text>
              <Text style={styles.chartSub}>
                Actual data · trend projection · WHO P3–P97 band
              </Text>

              <VictoryChart
                width={CHART_W}
                height={CHART_H}
                theme={VictoryTheme.material}
                padding={{ top: 16, bottom: 36, left: 44, right: 24 }}
                domain={{ x: [data.chartXMin, data.chartXMax] }}
              >
                <VictoryAxis
                  tickFormat={(t: number) => `${Math.round(t)}m`}
                  style={{ axis: { stroke: '#E5E7EB' }, tickLabels: { fontSize: 10, fill: '#9CA3AF' }, grid: { stroke: 'transparent' } }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t: number) => `${t.toFixed(1)}`}
                  style={{ axis: { stroke: '#E5E7EB' }, tickLabels: { fontSize: 10, fill: '#9CA3AF' }, grid: { stroke: '#F3F4F6' } }}
                />

                {/* WHO P3-P97 band */}
                <VictoryArea
                  data={whoBand}
                  style={{ data: { fill: WHO_BAND_COLOR, opacity: 0.55, stroke: 'transparent' } }}
                />

                {/* WHO P50 line */}
                <VictoryLine
                  data={data.whoP50}
                  style={{ data: { stroke: WHO_P50_COLOR, strokeWidth: 1.5, strokeDasharray: '5,4', opacity: 0.7 } }}
                />

                {/* Projection band */}
                <VictoryArea
                  data={projBand}
                  style={{ data: { fill: PROJ_COLOR, opacity: 0.12, stroke: 'transparent' } }}
                />

                {/* Projection line */}
                <VictoryLine
                  data={data.projectionSeries}
                  style={{ data: { stroke: PROJ_COLOR, strokeWidth: 2, strokeDasharray: '6,4' } }}
                />

                {/* Actual weight line */}
                <VictoryLine
                  data={data.actualSeries}
                  style={{ data: { stroke: ACTUAL_COLOR, strokeWidth: 2.5 } }}
                />

                {/* Actual data points */}
                <VictoryScatter
                  data={data.actualSeries}
                  size={4}
                  style={{ data: { fill: ACTUAL_COLOR, stroke: '#fff', strokeWidth: 1.5 } }}
                />

                {/* Projected endpoint */}
                <VictoryScatter
                  data={[data.projectionSeries[data.projectionSeries.length - 1]]}
                  size={5}
                  style={{ data: { fill: PROJ_COLOR, stroke: '#fff', strokeWidth: 1.5 } }}
                />
              </VictoryChart>

              {/* Legend */}
              <View style={styles.legend}>
                {[
                  { color: ACTUAL_COLOR, label: 'Actual weight', dash: false },
                  { color: PROJ_COLOR,   label: 'Projection',    dash: true  },
                  { color: WHO_P50_COLOR,label: 'WHO P50',       dash: true  },
                ].map((l) => (
                  <View key={l.label} style={styles.legendItem}>
                    <View style={[styles.legendLine, { backgroundColor: l.color }, l.dash && styles.legendDash]} />
                    <Text style={styles.legendLabel}>{l.label}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Prediction cards ──────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>📅 Next Check-up Predictions</Text>
            <View style={styles.predRow}>
              <PredictionCard pred={data.prediction4w} color={ACTUAL_COLOR} />
              <PredictionCard pred={data.prediction8w} color={PROJ_COLOR} />
            </View>

            {/* ── Velocity card ─────────────────────────────────────────── */}
            <View style={[styles.velocityCard, { borderLeftColor: data.velocity.statusColor }]}>
              <View style={styles.velocityTop}>
                <Text style={styles.velocityEmoji}>{data.velocity.statusEmoji}</Text>
                <View>
                  <Text style={[styles.velocityLabel, { color: data.velocity.statusColor }]}>{data.velocity.label}</Text>
                  <Text style={styles.velocityValue}>
                    {data.velocity.gPerDay >= 0 ? '+' : ''}{data.velocity.gPerDay}g/day
                  </Text>
                </View>
                <View style={[styles.velocityTarget, { backgroundColor: data.velocity.statusColor + '15' }]}>
                  <Text style={[styles.velocityTargetText, { color: data.velocity.statusColor }]}>
                    Target {data.velocity.targetMin}–{data.velocity.targetMax}g/d
                  </Text>
                </View>
              </View>
              <Text style={styles.velocityDesc}>
                Based on your last {Math.min(data.points.length, 6)} measurements. WHO recommends {data.velocity.targetMin}–{data.velocity.targetMax}g/day at this age.
              </Text>
              {/* Velocity bar */}
              <View style={styles.velBarBg}>
                <View style={[
                  styles.velBarFill,
                  {
                    width: `${Math.min(100, (data.velocity.gPerDay / data.velocity.targetMax) * 100)}%`,
                    backgroundColor: data.velocity.statusColor,
                  },
                ]} />
                <View style={[styles.velBarTarget, { left: `${(data.velocity.targetMin / data.velocity.targetMax) * 100}%` }]} />
              </View>
              <View style={styles.velBarLabels}>
                <Text style={styles.velBarLabel}>0</Text>
                <Text style={styles.velBarLabel}>Target {data.velocity.targetMin}g</Text>
                <Text style={styles.velBarLabel}>{data.velocity.targetMax}g/day</Text>
              </View>
            </View>

            {/* ── Percentile trend ──────────────────────────────────────── */}
            <View style={styles.trendCard}>
              <Text style={styles.trendTitle}>Percentile Trend</Text>
              <View style={styles.trendRow}>
                <View style={styles.trendPct}>
                  <Text style={styles.trendPctNum}>{data.percentileTrend.fromPct}</Text>
                  <Text style={styles.trendPctSub}>Earlier</Text>
                </View>
                <View style={styles.trendArrowBox}>
                  <Text style={[styles.trendArrow, { color: data.percentileTrend.color }]}>
                    {data.percentileTrend.emoji}
                  </Text>
                  <Text style={[styles.trendDelta, { color: data.percentileTrend.color }]}>
                    {data.percentileTrend.deltaLabel}
                  </Text>
                </View>
                <View style={styles.trendPct}>
                  <Text style={[styles.trendPctNum, { color: data.percentileTrend.color }]}>{data.percentileTrend.toPct}</Text>
                  <Text style={styles.trendPctSub}>Now</Text>
                </View>
              </View>
            </View>

            {/* ── Recent measurements ───────────────────────────────────── */}
            <View style={styles.tableCard}>
              <Text style={styles.tableTitle}>Recent Measurements</Text>
              <View style={styles.tableHeader}>
                {['Date', 'Weight', 'Height', 'Pct.'].map((h) => (
                  <Text key={h} style={styles.tableHead}>{h}</Text>
                ))}
              </View>
              {data.points.slice(-5).reverse().map((p, i) => (
                <View key={i} style={[styles.tableRow, i % 2 === 0 && styles.tableRowAlt]}>
                  <Text style={styles.tableCell}>{format(p.date, 'd MMM')}</Text>
                  <Text style={styles.tableCell}>{p.weightKg.toFixed(2)} kg</Text>
                  <Text style={styles.tableCell}>{p.heightCm ? `${p.heightCm} cm` : '—'}</Text>
                  <Text style={[styles.tableCell, { color: getPercentileLabel(p.weightPct).color }]}>
                    P{p.weightPct}
                  </Text>
                </View>
              ))}
            </View>

            {/* ── Disclaimer ────────────────────────────────────────────── */}
            <Text style={styles.disclaimer}>
              ⚠️ Predictions are based on recent growth trends and are estimates only. Always discuss growth concerns with your paediatrician.
            </Text>

            {/* ── Share ─────────────────────────────────────────────────── */}
            <TouchableOpacity style={styles.shareBtn} onPress={shareText} activeOpacity={0.8}>
              <Ionicons name="logo-whatsapp" size={20} color="#fff" />
              <Text style={styles.shareText}>Share Growth Summary</Text>
            </TouchableOpacity>

            <View style={{ height: 32 }} />
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: Colors.background },

  // Header
  header:       { paddingBottom: Spacing['2xl'] },
  headerContent:{ paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:  { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:    { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4, marginBottom: Spacing.md },
  headerChips:  { flexDirection: 'row', gap: Spacing.sm },
  headerChip: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center',
  },
  chipVal:      { fontSize: Typography.sm, fontWeight: '800', color: '#fff' },
  chipLbl:      { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginTop: 2 },

  scroll:       { padding: Spacing.xl },

  // Chart card
  chartCard: {
    backgroundColor: Colors.surface, borderRadius: Radius['2xl'],
    padding: Spacing.lg, marginBottom: Spacing.xl, ...Shadows.md,
  },
  chartTitle:   { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  chartSub:     { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.sm },
  legend:       { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.sm },
  legendItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendLine:   { width: 20, height: 3, borderRadius: 2 },
  legendDash:   { opacity: 0.7 },
  legendLabel:  { fontSize: 11, color: Colors.textSecondary },

  // Section title
  sectionTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Prediction cards
  predRow:      { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  predCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderTopWidth: 4, ...Shadows.sm, alignItems: 'center',
  },
  predWeeks:    { fontSize: Typography.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  predDate:     { fontSize: 11, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.sm },
  predWeight:   { fontSize: 28, fontWeight: '900' },
  predKg:       { fontSize: Typography.base, fontWeight: '600' },
  predPctBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full, marginTop: 6 },
  predPctText:  { fontSize: Typography.xs, fontWeight: '700' },
  predRange:    { fontSize: 10, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },

  // Velocity card
  velocityCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderLeftWidth: 4, ...Shadows.sm, marginBottom: Spacing.md,
  },
  velocityTop:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  velocityEmoji:{ fontSize: 28 },
  velocityLabel:{ fontSize: Typography.sm, fontWeight: '800' },
  velocityValue:{ fontSize: Typography.xl, fontWeight: '900', color: Colors.textPrimary },
  velocityTarget: {
    marginLeft: 'auto', paddingHorizontal: Spacing.sm, paddingVertical: 4,
    borderRadius: Radius.full,
  },
  velocityTargetText: { fontSize: Typography.xs, fontWeight: '700' },
  velocityDesc: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  velBarBg:     { height: 8, backgroundColor: '#F3F4F6', borderRadius: 4, overflow: 'hidden', position: 'relative' },
  velBarFill:   { height: '100%', borderRadius: 4, maxWidth: '100%' },
  velBarTarget: { position: 'absolute', top: 0, width: 2, height: '100%', backgroundColor: '#374151' },
  velBarLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  velBarLabel:  { fontSize: 10, color: Colors.textSecondary },

  // Percentile trend card
  trendCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadows.sm, marginBottom: Spacing.md,
  },
  trendTitle:   { fontSize: Typography.sm, fontWeight: '800', color: Colors.textSecondary, marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },
  trendRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  trendPct:     { alignItems: 'center' },
  trendPctNum:  { fontSize: 36, fontWeight: '900', color: Colors.textPrimary },
  trendPctSub:  { fontSize: Typography.xs, color: Colors.textSecondary },
  trendArrowBox:{ alignItems: 'center', gap: 4 },
  trendArrow:   { fontSize: 28 },
  trendDelta:   { fontSize: Typography.xs, fontWeight: '700' },

  // Table
  tableCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, ...Shadows.sm, marginBottom: Spacing.md,
  },
  tableTitle:   { fontSize: Typography.sm, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  tableHeader:  { flexDirection: 'row', paddingBottom: Spacing.xs, borderBottomWidth: 2, borderBottomColor: Colors.border },
  tableHead:    { flex: 1, fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase' },
  tableRow:     { flexDirection: 'row', paddingVertical: 8 },
  tableRowAlt:  { backgroundColor: '#F9FAFB', borderRadius: 6 },
  tableCell:    { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary },

  // Disclaimer
  disclaimer: {
    fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18,
    backgroundColor: '#FEF3C7', borderRadius: Radius.lg, padding: Spacing.md,
    marginBottom: Spacing.lg,
  },

  // Share
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#25D366',
    paddingVertical: Spacing.md, borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  shareText:    { fontSize: Typography.base, fontWeight: '700', color: '#fff' },

  // States
  center:       { alignItems: 'center', paddingVertical: 60 },
  loadingText:  { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyEmoji:   { fontSize: 48, marginBottom: Spacing.md },
  emptyText:    { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
});
