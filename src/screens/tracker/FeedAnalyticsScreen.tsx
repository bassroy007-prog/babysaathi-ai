import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Share, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { VictoryBar, VictoryChart, VictoryAxis, VictoryTheme } from 'victory-native';
import { format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import {
  fetchFeedAnalytics, buildFeedAnalyticsText, formatMins, hourLabel,
  type FeedAnalyticsData,
} from '@utils/feedAnalytics';

const { width: W }  = Dimensions.get('window');
const CHART_W       = W - Spacing.xl * 2 - 2;
const ORANGE        = '#EA580C';
const ORANGE_LIGHT  = '#FED7AA';

const DAY_OPTIONS   = [7, 14, 30] as const;
type DayOption      = typeof DAY_OPTIONS[number];

// ─── Heatmap row (24 hourly buckets) ─────────────────────────────────────────

function HeatmapRow({ distribution, maxCount }: { distribution: number[]; maxCount: number }) {
  const CELL = Math.floor((W - Spacing.xl * 2 - Spacing.lg * 2 - 23) / 24);
  return (
    <View>
      <View style={styles.heatmapRow}>
        {distribution.map((count, hour) => {
          const intensity = maxCount === 0 ? 0 : count / maxCount;
          const bg = intensity === 0
            ? '#F3F4F6'
            : `rgba(234, 88, 12, ${Math.max(0.12, intensity)})`;
          const isNight = hour >= 22 || hour < 6;
          return (
            <View
              key={hour}
              style={[
                styles.heatCell,
                { width: CELL, height: CELL + 4, backgroundColor: bg },
                isNight && styles.heatCellNight,
              ]}
            />
          );
        })}
      </View>
      <View style={styles.heatLabels}>
        {['12am', '6am', '12pm', '6pm', '11pm'].map((l, i) => (
          <Text key={l} style={[styles.heatLabel, { left: `${(i / 4) * 100}%` as any }]}>{l}</Text>
        ))}
      </View>
      <View style={styles.heatLegend}>
        {[0, 0.25, 0.5, 0.75, 1].map((v) => (
          <View
            key={v}
            style={[styles.heatLegendCell, { backgroundColor: v === 0 ? '#F3F4F6' : `rgba(234,88,12,${Math.max(0.12, v)})` }]}
          />
        ))}
        <Text style={styles.heatLegendLabel}>Fewer → more feeds</Text>
      </View>
    </View>
  );
}

// ─── Type bar (horizontal stacked) ───────────────────────────────────────────

function TypeBar({ d }: { d: FeedAnalyticsData }) {
  return (
    <View>
      <View style={styles.typeBar}>
        {d.breastPct  > 0 && <View style={[styles.typeSegment, { flex: d.breastPct,  backgroundColor: '#9333EA' }]} />}
        {d.formulaPct > 0 && <View style={[styles.typeSegment, { flex: d.formulaPct, backgroundColor: ORANGE }]} />}
        {d.solidPct   > 0 && <View style={[styles.typeSegment, { flex: d.solidPct,   backgroundColor: '#16A34A' }]} />}
      </View>
      <View style={styles.typeLegend}>
        {d.breastCount > 0 && (
          <View style={styles.typeLegendItem}>
            <View style={[styles.typeDot, { backgroundColor: '#9333EA' }]} />
            <Text style={styles.typeLegendText}>
              🤱 Breast {d.breastPct}%{d.avgBreastDurationMins ? ` · avg ${d.avgBreastDurationMins}m` : ''}
            </Text>
          </View>
        )}
        {d.formulaCount > 0 && (
          <View style={styles.typeLegendItem}>
            <View style={[styles.typeDot, { backgroundColor: ORANGE }]} />
            <Text style={styles.typeLegendText}>
              🍼 Formula {d.formulaPct}%{d.avgFormulaAmountMl ? ` · avg ${d.avgFormulaAmountMl}ml` : ''}
            </Text>
          </View>
        )}
        {d.solidCount > 0 && (
          <View style={styles.typeLegendItem}>
            <View style={[styles.typeDot, { backgroundColor: '#16A34A' }]} />
            <Text style={styles.typeLegendText}>🥄 Solids {d.solidPct}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.scard}>
      <Text style={styles.scardTitle}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function FeedAnalyticsScreen() {
  const { activeBaby } = useBabyStore();
  const [days, setDays]     = useState<DayOption>(14);
  const [data, setData]     = useState<FeedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeBaby) { setLoading(false); return; }
    setLoading(true);
    try {
      const d = await fetchFeedAnalytics(activeBaby, days);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [activeBaby, days]);

  useEffect(() => { load(); }, [load]);

  const share = () => {
    if (!data || !activeBaby) return;
    Share.share({ message: buildFeedAnalyticsText(data, activeBaby.name) }).catch(() => {});
  };

  // Bar chart: show daily for ≤14d, weekly for 30d
  const barData = data
    ? days <= 14
      ? data.dailyCounts.map((d) => ({ x: d.label, y: d.count }))
      : data.weeklyAvgs.map((w) => ({ x: w.week, y: w.avg }))
    : [];

  const trendColor = data
    ? data.trendDirection === 'consolidating' ? '#15803D'
    : data.trendDirection === 'increasing'    ? '#B91C1C'
    : '#2563EB'
    : '#2563EB';

  const trendEmoji = data
    ? data.trendDirection === 'consolidating' ? '📉'
    : data.trendDirection === 'increasing'    ? '📈'
    : '➡️'
    : '➡️';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#7C2D12', '#C2410C']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🍼 Feeding Analytics</Text>
            <Text style={styles.headerSub}>
              {activeBaby?.name ?? '…'} · deep dive into feeding patterns
            </Text>
            {/* Time range chips */}
            <View style={styles.dayChips}>
              {DAY_OPTIONS.map((d) => (
                <TouchableOpacity
                  key={d}
                  style={[styles.dayChip, days === d && styles.dayChipActive]}
                  onPress={() => setDays(d)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.dayChipText, days === d && styles.dayChipTextActive]}>
                    {d}d
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={ORANGE} size="large" />
          <Text style={styles.loadingText}>Analysing {days} days of feeds…</Text>
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🍼</Text>
          <Text style={styles.emptyText}>No feeds logged in the last {days} days.</Text>
          <Text style={styles.emptySub}>Start logging feeds in the Feed Tracker.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Summary strip ──────────────────────────────────────────── */}
          <View style={styles.summaryRow}>
            {[
              { label: 'Avg / day',     value: String(data.avgFeedsPerDay),      unit: 'feeds'    },
              { label: 'Avg gap',       value: formatMins(data.avgIntervalMins), unit: 'between'  },
              { label: 'Night feeds',   value: `${data.nightFeedPct}%`,          unit: 'of total' },
            ].map((s) => (
              <View key={s.label} style={styles.summaryChip}>
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryUnit}>{s.unit}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            ))}
          </View>

          {/* ── Feed type breakdown ────────────────────────────────────── */}
          <SCard title="🍼 Feed Type Breakdown">
            <TypeBar d={data} />
          </SCard>

          {/* ── 24h heatmap ───────────────────────────────────────────── */}
          <SCard title={`⏰ When Baby Feeds  · peak: ${hourLabel(data.peakHour)}`}>
            <Text style={styles.heatSubtitle}>Darker = more feeds at that hour · grey band = night (10pm–6am)</Text>
            <HeatmapRow distribution={data.hourDistribution} maxCount={data.maxHourCount} />
          </SCard>

          {/* ── Daily / weekly bar chart ───────────────────────────────── */}
          <SCard title={days <= 14 ? '📅 Feeds Per Day' : '📅 Weekly Average Feeds'}>
            <VictoryChart
              width={CHART_W - Spacing.lg * 2}
              height={180}
              theme={VictoryTheme.material}
              padding={{ top: 8, bottom: 36, left: 36, right: 12 }}
              domainPadding={{ x: 12 }}
            >
              <VictoryAxis
                style={{ tickLabels: { fontSize: 9, fill: '#9CA3AF', angle: days >= 14 ? -45 : 0 }, axis: { stroke: '#E5E7EB' }, grid: { stroke: 'transparent' } }}
              />
              <VictoryAxis
                dependentAxis
                tickFormat={(t: number) => String(Math.round(t))}
                style={{ tickLabels: { fontSize: 10, fill: '#9CA3AF' }, axis: { stroke: '#E5E7EB' }, grid: { stroke: '#F3F4F6' } }}
              />
              <VictoryBar
                data={barData}
                style={{ data: { fill: ORANGE, borderRadius: 3 } }}
                cornerRadius={{ top: 3 }}
              />
            </VictoryChart>
          </SCard>

          {/* ── Night feeds ───────────────────────────────────────────── */}
          <SCard title="🌙 Night Feeds (10pm – 6am)">
            <View style={styles.nightRow}>
              <View style={styles.nightStat}>
                <Text style={styles.nightBig}>{data.nightFeedCount}</Text>
                <Text style={styles.nightLabel}>total night feeds</Text>
              </View>
              <View style={styles.nightStat}>
                <Text style={[styles.nightBig, { color: '#15803D' }]}>{data.daysWithZeroNightFeeds}</Text>
                <Text style={styles.nightLabel}>nights feed-free</Text>
              </View>
              <View style={styles.nightStat}>
                <Text style={styles.nightBig}>{data.nightFeedPct}%</Text>
                <Text style={styles.nightLabel}>of all feeds</Text>
              </View>
            </View>
            {data.daysWithZeroNightFeeds > 0 && (
              <View style={styles.nightWin}>
                <Text style={styles.nightWinText}>
                  🎉 {data.daysWithZeroNightFeeds} night{data.daysWithZeroNightFeeds > 1 ? 's' : ''} with no night feeds — great progress!
                </Text>
              </View>
            )}
          </SCard>

          {/* ── Longest stretches ─────────────────────────────────────── */}
          <SCard title="⏳ Longest Stretches Between Feeds">
            {data.longestStretches.length > 0 ? (
              data.longestStretches.map((s, i) => (
                <View key={i} style={styles.stretchRow}>
                  <View style={[styles.stretchRank, { backgroundColor: i === 0 ? ORANGE_LIGHT : '#F3F4F6' }]}>
                    <Text style={[styles.stretchRankText, { color: i === 0 ? ORANGE : Colors.textSecondary }]}>
                      #{i + 1}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.stretchDur}>{formatMins(s.minutes)}</Text>
                    <Text style={styles.stretchTime}>
                      {format(s.startTime, 'EEE d MMM, h:mm a')} → {format(s.endTime, 'h:mm a')}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text style={styles.emptySection}>No stretches longer than 1 hour found in this period.</Text>
            )}
          </SCard>

          {/* ── Cluster feeding ───────────────────────────────────────── */}
          <SCard title="🔁 Cluster Feeding Detected">
            {data.clusterDays.length > 0 ? (
              <>
                <Text style={styles.clusterInfo}>
                  3 or more feeds within a 3-hour window — common during growth spurts and in the evening.
                </Text>
                <View style={styles.clusterDays}>
                  {data.clusterDays.map((c, i) => (
                    <View key={i} style={styles.clusterBadge}>
                      <Text style={styles.clusterBadgeDate}>{c.date}</Text>
                      <Text style={styles.clusterBadgeCount}>{c.windowCount} feeds</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.emptySection}>No cluster feeding detected in this period. ✅</Text>
            )}
          </SCard>

          {/* ── Trend ────────────────────────────────────────────────── */}
          <View style={[styles.trendCard, { borderLeftColor: trendColor }]}>
            <View style={styles.trendTop}>
              <Text style={styles.trendEmoji}>{trendEmoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.trendLabel, { color: trendColor }]}>
                  {data.trendDirection === 'consolidating' ? 'Consolidating'
                   : data.trendDirection === 'increasing'  ? 'Increasing'
                   : 'Stable'}
                </Text>
                <Text style={styles.trendNote}>{data.trendNote}</Text>
              </View>
            </View>
            <View style={styles.trendCompare}>
              <View style={styles.trendHalf}>
                <Text style={styles.trendHalfVal}>{data.firstWeekAvg.toFixed(1)}</Text>
                <Text style={styles.trendHalfLabel}>Earlier avg/day</Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color={trendColor} />
              <View style={styles.trendHalf}>
                <Text style={[styles.trendHalfVal, { color: trendColor }]}>{data.lastWeekAvg.toFixed(1)}</Text>
                <Text style={styles.trendHalfLabel}>Recent avg/day</Text>
              </View>
            </View>
          </View>

          {/* ── Share ────────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.shareBtn} onPress={share} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.shareText}>Share Analytics Summary</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
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
  dayChips:     { flexDirection: 'row', gap: Spacing.sm },
  dayChip: {
    paddingHorizontal: Spacing.lg, paddingVertical: 6,
    borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.3)',
  },
  dayChipActive:     { backgroundColor: '#fff', borderColor: '#fff' },
  dayChipText:       { fontSize: Typography.sm, fontWeight: '700', color: 'rgba(255,255,255,0.85)' },
  dayChipTextActive: { color: ORANGE },

  scroll:       { padding: Spacing.xl },

  // Summary
  summaryRow:   { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  summaryChip: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, alignItems: 'center', ...Shadows.sm,
  },
  summaryValue: { fontSize: Typography.xl, fontWeight: '900', color: ORANGE },
  summaryUnit:  { fontSize: 10, color: Colors.textSecondary, marginTop: 1 },
  summaryLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },

  // Section card
  scard: {
    backgroundColor: Colors.surface, borderRadius: Radius['2xl'],
    padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.sm,
  },
  scardTitle: {
    fontSize: Typography.sm, fontWeight: '800', color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },

  // Type breakdown
  typeBar:         { height: 24, flexDirection: 'row', borderRadius: Radius.full, overflow: 'hidden', marginBottom: Spacing.md },
  typeSegment:     { height: '100%' },
  typeLegend:      { gap: 6 },
  typeLegendItem:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeDot:         { width: 10, height: 10, borderRadius: 5 },
  typeLegendText:  { fontSize: Typography.sm, color: Colors.textPrimary },

  // Heatmap
  heatSubtitle:    { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  heatmapRow:      { flexDirection: 'row', gap: 1 },
  heatCell:        { borderRadius: 2 },
  heatCellNight:   { opacity: 0.7 },
  heatLabels:      { position: 'relative', height: 20, marginTop: 4 },
  heatLabel:       { position: 'absolute', fontSize: 9, color: Colors.textSecondary },
  heatLegend:      { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.lg },
  heatLegendCell:  { width: 14, height: 14, borderRadius: 2 },
  heatLegendLabel: { fontSize: 10, color: Colors.textSecondary, marginLeft: 4 },

  // Night feeds
  nightRow:        { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  nightStat:       { alignItems: 'center' },
  nightBig:        { fontSize: 28, fontWeight: '900', color: '#1A3A6B' },
  nightLabel:      { fontSize: 11, color: Colors.textSecondary, marginTop: 2 },
  nightWin: {
    backgroundColor: '#F0FDF4', borderRadius: Radius.lg,
    padding: Spacing.sm, marginTop: Spacing.sm,
  },
  nightWinText:    { fontSize: Typography.sm, color: '#15803D', fontWeight: '600' },

  // Stretches
  stretchRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.sm },
  stretchRank: {
    width: 32, height: 32, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  stretchRankText: { fontSize: Typography.xs, fontWeight: '800' },
  stretchDur:      { fontSize: Typography.lg, fontWeight: '800', color: ORANGE },
  stretchTime:     { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  // Cluster
  clusterInfo:   { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18, marginBottom: Spacing.md },
  clusterDays:   { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  clusterBadge: {
    backgroundColor: ORANGE_LIGHT, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: 6, alignItems: 'center',
  },
  clusterBadgeDate:  { fontSize: Typography.sm, fontWeight: '700', color: '#7C2D12' },
  clusterBadgeCount: { fontSize: 10, color: '#9A3412' },

  // Trend card
  trendCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderLeftWidth: 4, ...Shadows.sm, marginBottom: Spacing.md,
  },
  trendTop:        { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start', marginBottom: Spacing.md },
  trendEmoji:      { fontSize: 28 },
  trendLabel:      { fontSize: Typography.base, fontWeight: '800' },
  trendNote:       { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18, marginTop: 2 },
  trendCompare:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  trendHalf:       { alignItems: 'center' },
  trendHalfVal:    { fontSize: 28, fontWeight: '900', color: Colors.textPrimary },
  trendHalfLabel:  { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  // Empty / loading
  center:         { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText:    { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyEmoji:     { fontSize: 48 },
  emptyText:      { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md, textAlign: 'center' },
  emptySub:       { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  emptySection:   { fontSize: Typography.sm, color: Colors.textSecondary, fontStyle: 'italic' },

  // Share
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#25D366',
    paddingVertical: Spacing.md, borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  shareText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
