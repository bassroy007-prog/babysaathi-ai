import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { VictoryLine, VictoryChart, VictoryBar, VictoryTheme, VictoryAxis, VictoryArea } from 'victory-native';
import { format, subDays, startOfDay } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import { getFeedsByDateRange, getSleepByDateRange, getDiapersByDateRange } from '@services/firebase/firestore';
import { FeedEntry, SleepEntry, DiaperEntry } from '@types/index';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_WIDTH = SCREEN_WIDTH - Spacing.lg * 2 - Spacing.md * 2;

type Period = '7d' | '14d' | '30d';
type TabType = 'feeding' | 'sleep' | 'diapers' | 'growth';

interface DayStats {
  date: string;
  feedCount: number;
  sleepHours: number;
  diaperCount: number;
}

export default function AnalyticsScreen() {
  const { activeBaby } = useBabyStore();
  const { growthEntries } = useTrackerStore();

  const [period, setPeriod] = useState<Period>('7d');
  const [activeTab, setActiveTab] = useState<TabType>('feeding');
  const [dayStats, setDayStats] = useState<DayStats[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeBaby) loadStats();
  }, [activeBaby, period]);

  const loadStats = async () => {
    if (!activeBaby) return;
    setLoading(true);

    const days = period === '7d' ? 7 : period === '14d' ? 14 : 30;
    const endDate = new Date();
    const startDate = subDays(endDate, days);

    const [feeds, sleep, diapers] = await Promise.all([
      getFeedsByDateRange(activeBaby.id, startDate, endDate),
      getSleepByDateRange(activeBaby.id, startDate, endDate),
      getDiapersByDateRange(activeBaby.id, startDate),
    ]);

    const stats: DayStats[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = subDays(endDate, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayStart = startOfDay(day).getTime();
      const dayEnd = dayStart + 86400000;

      const dayFeeds = (feeds as FeedEntry[]).filter((f) => {
        const t = f.startTime instanceof Date ? f.startTime.getTime() : new Date(f.startTime as any).getTime();
        return t >= dayStart && t < dayEnd;
      });

      const daySleep = (sleep as SleepEntry[]).filter((s) => {
        const t = s.startTime instanceof Date ? s.startTime.getTime() : new Date(s.startTime as any).getTime();
        return t >= dayStart && t < dayEnd;
      });

      const dayDiapers = (diapers as DiaperEntry[]).filter((d) => {
        const t = d.time instanceof Date ? d.time.getTime() : new Date(d.time as any).getTime();
        return t >= dayStart && t < dayEnd;
      });

      const sleepMinutes = daySleep.reduce((acc, s) => acc + (s.duration ?? 0), 0);

      stats.push({
        date: format(day, 'MMM d'),
        feedCount: dayFeeds.length,
        sleepHours: Math.round((sleepMinutes / 60) * 10) / 10,
        diaperCount: dayDiapers.length,
      });
    }

    setDayStats(stats);
    setLoading(false);
  };

  const tabs: Array<{ id: TabType; label: string; icon: string }> = [
    { id: 'feeding', label: 'Feeding', icon: '🍼' },
    { id: 'sleep', label: 'Sleep', icon: '😴' },
    { id: 'diapers', label: 'Diapers', icon: '💧' },
    { id: 'growth', label: 'Growth', icon: '📏' },
  ];

  const feedData = dayStats.map((d, i) => ({ x: i + 1, y: d.feedCount, label: d.date }));
  const sleepData = dayStats.map((d, i) => ({ x: i + 1, y: d.sleepHours, label: d.date }));
  const diaperData = dayStats.map((d, i) => ({ x: i + 1, y: d.diaperCount, label: d.date }));

  const growthWeight = growthEntries
    .filter((g) => g.weight != null)
    .map((g, i) => ({ x: i + 1, y: g.weight! }));

  const avgFeed = dayStats.length
    ? (dayStats.reduce((a, d) => a + d.feedCount, 0) / dayStats.length).toFixed(1)
    : '—';
  const avgSleep = dayStats.length
    ? (dayStats.reduce((a, d) => a + d.sleepHours, 0) / dayStats.length).toFixed(1)
    : '—';
  const avgDiapers = dayStats.length
    ? (dayStats.reduce((a, d) => a + d.diaperCount, 0) / dayStats.length).toFixed(1)
    : '—';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient colors={['#6B8EFF', '#8B5CF6']} style={styles.header}>
        <Text style={styles.headerTitle}>Analytics</Text>
        <Text style={styles.headerSub}>{activeBaby?.name ?? 'Your Baby'}'s trends</Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* Period selector */}
        <View style={styles.periodRow}>
          {(['7d', '14d', '30d'] as Period[]).map((p) => (
            <TouchableOpacity
              key={p}
              style={[styles.periodBtn, period === p && styles.periodBtnActive]}
              onPress={() => setPeriod(p)}
            >
              <Text style={[styles.periodText, period === p && styles.periodTextActive]}>
                {p === '7d' ? '7 Days' : p === '14d' ? '14 Days' : '30 Days'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Summary stats */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: '#FFF5F7' }]}>
            <Text style={styles.summaryEmoji}>🍼</Text>
            <Text style={styles.summaryValue}>{avgFeed}</Text>
            <Text style={styles.summaryLabel}>Avg Feeds/Day</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0F5FF' }]}>
            <Text style={styles.summaryEmoji}>😴</Text>
            <Text style={styles.summaryValue}>{avgSleep}h</Text>
            <Text style={styles.summaryLabel}>Avg Sleep/Day</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: '#F0FFF4' }]}>
            <Text style={styles.summaryEmoji}>💧</Text>
            <Text style={styles.summaryValue}>{avgDiapers}</Text>
            <Text style={styles.summaryLabel}>Avg Diapers/Day</Text>
          </View>
        </View>

        {/* Tab selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, activeTab === tab.id && styles.tabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={styles.tabIcon}>{tab.icon}</Text>
              <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Chart */}
        <View style={styles.chartCard}>
          {activeTab === 'feeding' && (
            <>
              <Text style={styles.chartTitle}>🍼 Daily Feed Count</Text>
              {feedData.length > 0 ? (
                <VictoryChart width={CHART_WIDTH} height={200} theme={VictoryTheme.material} padding={{ top: 20, bottom: 40, left: 40, right: 20 }}>
                  <VictoryAxis tickFormat={(t) => dayStats[t - 1]?.date ?? ''} style={{ tickLabels: { fontSize: 9, angle: -30 } }} />
                  <VictoryAxis dependentAxis />
                  <VictoryArea
                    data={feedData}
                    style={{ data: { fill: 'rgba(255,107,138,0.2)', stroke: Colors.primary, strokeWidth: 2 } }}
                    interpolation="catmullRom"
                  />
                </VictoryChart>
              ) : (
                <Text style={styles.noData}>No feeding data yet</Text>
              )}
            </>
          )}

          {activeTab === 'sleep' && (
            <>
              <Text style={styles.chartTitle}>😴 Daily Sleep Hours</Text>
              {sleepData.length > 0 ? (
                <VictoryChart width={CHART_WIDTH} height={200} theme={VictoryTheme.material} padding={{ top: 20, bottom: 40, left: 40, right: 20 }}>
                  <VictoryAxis tickFormat={(t) => dayStats[t - 1]?.date ?? ''} style={{ tickLabels: { fontSize: 9, angle: -30 } }} />
                  <VictoryAxis dependentAxis />
                  <VictoryArea
                    data={sleepData}
                    style={{ data: { fill: 'rgba(107,142,255,0.2)', stroke: Colors.secondary, strokeWidth: 2 } }}
                    interpolation="catmullRom"
                  />
                </VictoryChart>
              ) : (
                <Text style={styles.noData}>No sleep data yet</Text>
              )}
            </>
          )}

          {activeTab === 'diapers' && (
            <>
              <Text style={styles.chartTitle}>💧 Daily Diaper Changes</Text>
              {diaperData.length > 0 ? (
                <VictoryChart width={CHART_WIDTH} height={200} theme={VictoryTheme.material} padding={{ top: 20, bottom: 40, left: 40, right: 20 }}>
                  <VictoryAxis tickFormat={(t) => dayStats[t - 1]?.date ?? ''} style={{ tickLabels: { fontSize: 9, angle: -30 } }} />
                  <VictoryAxis dependentAxis />
                  <VictoryBar
                    data={diaperData}
                    style={{ data: { fill: '#22C55E', borderRadius: 4 } }}
                  />
                </VictoryChart>
              ) : (
                <Text style={styles.noData}>No diaper data yet</Text>
              )}
            </>
          )}

          {activeTab === 'growth' && (
            <>
              <Text style={styles.chartTitle}>📏 Weight Progress (kg)</Text>
              {growthWeight.length > 1 ? (
                <VictoryChart width={CHART_WIDTH} height={200} theme={VictoryTheme.material} padding={{ top: 20, bottom: 30, left: 50, right: 20 }}>
                  <VictoryAxis />
                  <VictoryAxis dependentAxis />
                  <VictoryLine
                    data={growthWeight}
                    style={{ data: { stroke: Colors.accent, strokeWidth: 2.5 } }}
                    interpolation="catmullRom"
                  />
                </VictoryChart>
              ) : (
                <Text style={styles.noData}>Add more growth records to see a chart</Text>
              )}
            </>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: Spacing.xl },
  headerTitle: { ...Typography.h1, color: 'white', fontWeight: '800' },
  headerSub: { ...Typography.body, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  body: { padding: Spacing.lg },

  periodRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 3,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  periodBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: Radius.full },
  periodBtnActive: { backgroundColor: Colors.secondary },
  periodText: { ...Typography.small, fontWeight: '600', color: Colors.textSecondary },
  periodTextActive: { color: 'white' },

  summaryRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  summaryCard: {
    flex: 1,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
    alignItems: 'center',
    ...Shadows.sm,
  },
  summaryEmoji: { fontSize: 22, marginBottom: 4 },
  summaryValue: { ...Typography.h3, color: Colors.text, fontWeight: '700' },
  summaryLabel: { ...Typography.caption, color: Colors.textSecondary, textAlign: 'center', marginTop: 2 },

  tabScroll: { marginBottom: Spacing.md },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: Radius.full,
    marginRight: Spacing.sm,
    backgroundColor: Colors.surface,
    gap: 6,
    ...Shadows.sm,
  },
  tabActive: { backgroundColor: Colors.primary },
  tabIcon: { fontSize: 16 },
  tabLabel: { ...Typography.small, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: 'white' },

  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    ...Shadows.sm,
    alignItems: 'center',
  },
  chartTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm, alignSelf: 'flex-start' },
  noData: { ...Typography.body, color: Colors.textSecondary, padding: Spacing.xl, textAlign: 'center' },
});
