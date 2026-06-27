import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { differenceInWeeks } from 'date-fns';
import {
  VictoryBar, VictoryChart, VictoryAxis, VictoryStack,
  VictoryLine, VictoryArea,
} from 'victory-native';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { getSleepEntries } from '@services/firebase/firestore';
import {
  getDailySleepData, getSleepStats, getRecommendedSleep,
  getSleepTip, formatBedtime, getWeeklyTrend,
} from '@utils/sleepAnalysis';
import type { SleepEntry } from '@types/index';

const NIGHT_COLOR = '#1A3A6B';
const NAP_COLOR   = '#6B9FD4';
const PURPLE      = '#5B3FA8';

export default function SleepAnalysisScreen() {
  const { activeBaby } = useBabyStore();
  const [entries, setEntries] = useState<SleepEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeBaby) return;
    setLoading(true);
    try {
      const since = new Date();
      since.setDate(since.getDate() - 28);
      const data = await getSleepEntries(activeBaby.id, since);
      setEntries(data);
    } finally {
      setLoading(false);
    }
  }, [activeBaby?.id]);

  useEffect(() => { load(); }, [load]);

  const ageWeeks    = activeBaby ? differenceInWeeks(new Date(), activeBaby.birthDate) : 0;
  const weekly7     = useMemo(() => getDailySleepData(entries, 7), [entries]);
  const stats       = useMemo(() => getSleepStats(entries, 7), [entries]);
  const recommended = useMemo(() => getRecommendedSleep(ageWeeks), [ageWeeks]);
  const trend       = useMemo(() => getWeeklyTrend(entries), [entries]);
  const tip         = useMemo(() => getSleepTip(ageWeeks, stats.avgNightHours, stats.avgNapHours), [ageWeeks, stats]);

  const today        = weekly7[weekly7.length - 1];
  const todayHours   = today ? today.totalMinutes / 60 : 0;

  const nightData = weekly7.map((d) => ({ x: d.dateLabel, y: +(d.nightMinutes / 60).toFixed(1) }));
  const napData   = weekly7.map((d) => ({ x: d.dateLabel, y: +(d.napMinutes / 60).toFixed(1) }));

  const whoMin = recommended.min;
  const whoMax = recommended.max;
  const trendDomain = trend.some((t) => t.y > 0)
    ? { y: [0, Math.max(whoMax + 2, Math.max(...trend.map((t) => t.y)) + 1)] as [number, number] }
    : { y: [0, whoMax + 2] as [number, number] };

  const pct = Math.min(100, (stats.avgTotalHours / whoMax) * 100);
  const onTarget = stats.avgTotalHours >= whoMin;

  if (!activeBaby) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No baby profile found.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={NIGHT_COLOR} />
        <Text style={styles.loadingText}>Analysing sleep patterns…</Text>
      </View>
    );
  }

  const hasData = entries.length > 0;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#0F2A5C', '#1A4A8C']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>😴 Sleep Analysis</Text>
            <Text style={styles.headerSub}>{activeBaby.name} · last 28 days</Text>

            {/* ── Quick stat chips ──────────────────────────────────────── */}
            <View style={styles.chipRow}>
              <Chip label="Today" value={`${todayHours.toFixed(1)}h`} />
              <Chip label="Avg / day" value={`${stats.avgTotalHours.toFixed(1)}h`} />
              <Chip label="Longest" value={`${(stats.longestStretch / 60).toFixed(1)}h`} />
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={NIGHT_COLOR} />}
      >
        {!hasData ? (
          <View style={[styles.card, styles.center, { paddingVertical: 48 }]}>
            <Text style={{ fontSize: 40, marginBottom: Spacing.md }}>🌙</Text>
            <Text style={styles.emptyText}>No sleep entries yet.</Text>
            <Text style={[styles.emptyText, { fontSize: Typography.sm, marginTop: 4 }]}>
              Log sleep from the Sleep Tracker to see analysis here.
            </Text>
          </View>
        ) : (
          <>
            {/* ── WHO comparison ────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Avg vs WHO Recommendation</Text>
              <View style={styles.whoTrack}>
                <View style={[styles.whoFill, { width: `${pct}%`, backgroundColor: onTarget ? '#2D7A3A' : '#C05A00' }]} />
              </View>
              <View style={styles.whoLabels}>
                <Text style={[styles.whoVal, { color: onTarget ? '#2D7A3A' : '#C05A00' }]}>
                  {stats.avgTotalHours.toFixed(1)}h / day
                </Text>
                <Text style={styles.whoRange}>{whoMin}–{whoMax}h recommended</Text>
              </View>
              <Text style={styles.whoCaption}>
                {onTarget
                  ? `✅ Within WHO range for ${recommended.label}`
                  : `⚠️ Slightly below recommended for ${recommended.label} — see tip below`}
              </Text>
            </View>

            {/* ── Weekly stacked bar chart ──────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>This Week</Text>
                <View style={styles.legend}>
                  <LegendDot color={NIGHT_COLOR} label="Night" />
                  <LegendDot color={NAP_COLOR}   label="Nap" />
                </View>
              </View>

              <VictoryChart height={200} padding={{ top: 8, bottom: 40, left: 38, right: 12 }}>
                <VictoryAxis
                  style={{
                    axis: { stroke: Colors.border },
                    tickLabels: { fontSize: 10, fill: Colors.textSecondary },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t: number) => `${t}h`}
                  style={{
                    axis: { stroke: 'none' },
                    grid: { stroke: Colors.border, strokeDasharray: '4,4' },
                    tickLabels: { fontSize: 10, fill: Colors.textSecondary },
                  }}
                />
                <VictoryStack>
                  <VictoryBar
                    data={nightData}
                    cornerRadius={{ top: 3 }}
                    style={{ data: { fill: NIGHT_COLOR, width: 22 } }}
                  />
                  <VictoryBar
                    data={napData}
                    cornerRadius={{ top: 3 }}
                    style={{ data: { fill: NAP_COLOR, width: 22 } }}
                  />
                </VictoryStack>
              </VictoryChart>
            </View>

            {/* ── 4-week trend ──────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>4-Week Trend</Text>
              <VictoryChart
                height={160}
                padding={{ top: 12, bottom: 36, left: 38, right: 12 }}
                domain={trendDomain}
              >
                <VictoryAxis
                  style={{
                    axis: { stroke: Colors.border },
                    tickLabels: { fontSize: 10, fill: Colors.textSecondary },
                  }}
                />
                <VictoryAxis
                  dependentAxis
                  tickFormat={(t: number) => `${t}h`}
                  style={{
                    axis: { stroke: 'none' },
                    grid: { stroke: Colors.border, strokeDasharray: '4,4' },
                    tickLabels: { fontSize: 10, fill: Colors.textSecondary },
                  }}
                />
                {/* WHO recommended band */}
                <VictoryArea
                  data={trend.map((d) => ({ x: d.x, y: whoMax, y0: whoMin }))}
                  style={{ data: { fill: '#2D7A3A', fillOpacity: 0.10, stroke: 'none' } }}
                />
                <VictoryLine
                  data={trend}
                  interpolation="monotoneX"
                  style={{ data: { stroke: NIGHT_COLOR, strokeWidth: 2.5 } }}
                />
              </VictoryChart>
              <Text style={styles.trendNote}>🟢 Green band = WHO recommended range</Text>
            </View>

            {/* ── 7-day breakdown ───────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>7-Day Average Breakdown</Text>
              <View style={styles.breakdownRow}>
                <BreakdownItem emoji="🌙" label="Night" value={`${stats.avgNightHours.toFixed(1)}h`} color={NIGHT_COLOR} />
                <View style={styles.breakdownDivider} />
                <BreakdownItem emoji="☁️" label="Naps" value={`${stats.avgNapHours.toFixed(1)}h`} color={NAP_COLOR} />
                <View style={styles.breakdownDivider} />
                <BreakdownItem emoji="⏱" label="Total" value={`${stats.avgTotalHours.toFixed(1)}h`} color={PURPLE} />
              </View>
            </View>

            {/* ── Bedtime ───────────────────────────────────────────────── */}
            <LinearGradient colors={['#0F2A5C', '#1A4A8C']} style={[styles.card, styles.bedtimeCard]}>
              <Text style={styles.bedtimeEmoji}>🌙</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.bedtimeTitle}>Consistent Bedtime Window</Text>
                <Text style={styles.bedtimeValue}>
                  {formatBedtime(stats.avgBedtimeHour - 0.25)} – {formatBedtime(stats.avgBedtimeHour + 0.25)}
                </Text>
                <Text style={styles.bedtimeSub}>Based on 7-night average</Text>
              </View>
            </LinearGradient>

            {/* ── Daily quality strip ───────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Sleep Quality · Last 7 Days</Text>
              <View style={styles.qualityRow}>
                {weekly7.map((d) => {
                  const bg =
                    d.quality === 'good' ? '#2D7A3A' :
                    d.quality === 'fair' ? '#B8860B' :
                    d.quality === 'poor' ? '#C05A00' :
                    Colors.border;
                  const emoji =
                    d.quality === 'good' ? '😊' :
                    d.quality === 'fair' ? '😐' :
                    d.quality === 'poor' ? '😴' : '—';
                  return (
                    <View key={d.dateLabel} style={styles.qualityItem}>
                      <View style={[styles.qualityDot, { backgroundColor: bg }]}>
                        <Text style={styles.qualityEmoji}>{emoji}</Text>
                      </View>
                      <Text style={styles.qualityDay}>{d.dateLabel}</Text>
                      <Text style={styles.qualityHrs}>
                        {d.totalMinutes > 0 ? `${(d.totalMinutes / 60).toFixed(1)}h` : '—'}
                      </Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* ── Sleep tip ─────────────────────────────────────────────── */}
            <View style={[styles.card, styles.tipCard]}>
              <Text style={styles.tipHeading}>💡 Personalised Tip</Text>
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// ── Small components ──────────────────────────────────────────────────────────

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipVal}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function BreakdownItem({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.breakdownItem}>
      <Text style={styles.breakdownEmoji}>{emoji}</Text>
      <Text style={[styles.breakdownValue, { color }]}>{value}</Text>
      <Text style={styles.breakdownLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:  { flex: 1, backgroundColor: Colors.background },
  center:     { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText:  { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600' },
  loadingText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },

  header:        { paddingBottom: Spacing.xl },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:   { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: Typography.sm, color: 'rgba(255,255,255,0.75)', marginTop: 2, marginBottom: Spacing.lg },

  chipRow: { flexDirection: 'row', gap: Spacing.sm },
  chip:    { flex: 1, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center' },
  chipVal: { fontSize: Typography.lg, fontWeight: '800', color: '#fff' },
  chipLabel: { fontSize: 9, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 2 },

  scroll: { padding: Spacing.lg },
  card:   { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  cardTitle:  { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },

  // WHO comparison
  whoTrack:  { height: 12, backgroundColor: Colors.border, borderRadius: 6, overflow: 'hidden', marginBottom: Spacing.sm },
  whoFill:   { height: 12, borderRadius: 6 },
  whoLabels: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  whoVal:    { fontSize: Typography.lg, fontWeight: '800' },
  whoRange:  { fontSize: Typography.xs, color: Colors.textSecondary },
  whoCaption: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },

  // Chart legend
  legend:     { flexDirection: 'row', gap: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot:  { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },

  trendNote: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: -Spacing.sm, textAlign: 'center' },

  // Breakdown
  breakdownRow:     { flexDirection: 'row', alignItems: 'center' },
  breakdownDivider: { width: 1, height: 48, backgroundColor: Colors.border, marginHorizontal: Spacing.md },
  breakdownItem:    { flex: 1, alignItems: 'center', gap: 4 },
  breakdownEmoji:   { fontSize: 22 },
  breakdownValue:   { fontSize: Typography.xl, fontWeight: '800' },
  breakdownLabel:   { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },

  // Bedtime
  bedtimeCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.lg },
  bedtimeEmoji: { fontSize: 36 },
  bedtimeTitle: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 4 },
  bedtimeValue: { fontSize: Typography['2xl'], fontWeight: '900', color: '#fff' },
  bedtimeSub:   { fontSize: Typography.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  // Quality strip
  qualityRow:  { flexDirection: 'row', justifyContent: 'space-between' },
  qualityItem: { alignItems: 'center', gap: 4 },
  qualityDot:  { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  qualityEmoji: { fontSize: 16 },
  qualityDay:  { fontSize: 9, color: Colors.textSecondary, fontWeight: '700' },
  qualityHrs:  { fontSize: 10, color: Colors.textPrimary, fontWeight: '600' },

  // Tip
  tipCard:    { backgroundColor: '#EFF6FF', borderLeftWidth: 3, borderLeftColor: NIGHT_COLOR },
  tipHeading: { fontSize: Typography.sm, fontWeight: '800', color: NIGHT_COLOR, marginBottom: 6 },
  tipText:    { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
});
