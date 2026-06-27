import React, { useState, useEffect, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInMonths } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
} from 'victory-native';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { useRefresh } from '@hooks/useRefresh';
import { Validators } from '@utils/validation';
import { shareViaWhatsApp, buildGrowthShareMessage } from '@utils/share';
import { GrowthEntry, Gender } from '@types/index';
import { GrowthMetric, getWHOCurveData, calculateApproxPercentile, getPercentileLabel } from '@utils/percentile';

// ─── Unit helpers ─────────────────────────────────────────────────────────────

// Weight may be stored as kg (<50) or grams (>50) depending on entry path.
// This normalises both to kg for chart display.
const toKg = (w: number) => w > 50 ? w / 1000 : w;

// ─── WHO Growth Chart ─────────────────────────────────────────────────────────

type MetricTab = { key: GrowthMetric; label: string; emoji: string; unit: string };

const METRIC_TABS: MetricTab[] = [
  { key: 'weight', label: 'Weight', emoji: '⚖️', unit: 'kg' },
  { key: 'height', label: 'Height', emoji: '📏', unit: 'cm' },
  { key: 'head',   label: 'Head',   emoji: '🔵', unit: 'cm' },
];

const BAND_COLOR = '#90A4AE';
const MEDIAN_COLOR = Colors.primary;
const BABY_COLOR = Colors.growthColor;

interface WHOGrowthChartProps {
  growthEntries: GrowthEntry[];
  birthDate: Date;
  gender: Gender;
}

const WHOGrowthChart = memo(({ growthEntries, birthDate, gender }: WHOGrowthChartProps) => {
  const { width: screenWidth } = useWindowDimensions();
  const [activeMetric, setActiveMetric] = useState<GrowthMetric>('weight');

  const chartWidth = screenWidth - Spacing.xl * 2 - Spacing.lg * 2;
  const chartHeight = 210;

  const babyAgeMonths = differenceInMonths(new Date(), birthDate);
  const xMax = Math.min(24, Math.max(6, babyAgeMonths + 2));

  // WHO reference curves
  const { p3, p50, p97 } = getWHOCurveData(gender, activeMetric, xMax);

  // Baby's actual data for the active metric
  const babyPoints = growthEntries
    .filter((e) => {
      if (activeMetric === 'weight') return e.weight != null;
      if (activeMetric === 'height') return e.height != null;
      return e.headCircumference != null;
    })
    .map((e) => {
      const ageMonths = differenceInMonths(e.date, birthDate);
      let y: number;
      if (activeMetric === 'weight') y = toKg(e.weight!);
      else if (activeMetric === 'height') y = e.height!;
      else y = e.headCircumference!;
      return { x: ageMonths, y };
    })
    .sort((a, b) => a.x - b.x);

  // Percentile badge for most recent entry
  const latestPoint = babyPoints[babyPoints.length - 1];
  const percentile = latestPoint
    ? calculateApproxPercentile(latestPoint.y, latestPoint.x, gender, activeMetric)
    : null;
  const pLabel = percentile !== null ? getPercentileLabel(percentile) : null;

  const unit = METRIC_TABS.find((t) => t.key === activeMetric)!.unit;

  const axisStyle = {
    tickLabels: { fontSize: 9, fill: Colors.textSecondary, fontFamily: 'System' },
    axis: { stroke: Colors.border },
    grid: { stroke: Colors.border, strokeOpacity: 0.4, strokeWidth: 0.5 },
  };

  return (
    <View style={styles.chartCard}>
      <Text style={styles.chartTitle}>WHO Growth Percentiles</Text>

      {/* Metric tabs */}
      <View style={styles.metricTabs}>
        {METRIC_TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.metricTab, activeMetric === tab.key && styles.metricTabActive]}
            onPress={() => setActiveMetric(tab.key)}
          >
            <Text style={styles.metricTabEmoji}>{tab.emoji}</Text>
            <Text style={[styles.metricTabLabel, activeMetric === tab.key && styles.metricTabLabelActive]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Percentile badge */}
      {pLabel && (
        <View style={[styles.percentileBadge, { backgroundColor: pLabel.bg }]}>
          <Text style={[styles.percentileValue, { color: pLabel.color }]}>{pLabel.label}</Text>
          <Text style={[styles.percentileDesc, { color: pLabel.color }]}>{pLabel.description}</Text>
        </View>
      )}

      {/* Victory Chart */}
      <VictoryChart
        width={chartWidth}
        height={chartHeight}
        padding={{ top: 12, bottom: 36, left: 46, right: 16 }}
        domain={{ x: [0, xMax] }}
      >
        <VictoryAxis
          tickValues={[0, 3, 6, 9, 12, 15, 18, 21, 24].filter((v) => v <= xMax)}
          tickFormat={(t: number) => `${t}m`}
          style={axisStyle}
        />
        <VictoryAxis
          dependentAxis
          tickFormat={(t: number) => `${t}${unit}`}
          style={axisStyle}
        />

        {/* P97 — upper band boundary */}
        <VictoryLine
          data={p97}
          style={{ data: { stroke: BAND_COLOR, strokeWidth: 1, strokeDasharray: '4, 3', strokeOpacity: 0.7 } }}
        />

        {/* P3 — lower band boundary */}
        <VictoryLine
          data={p3}
          style={{ data: { stroke: BAND_COLOR, strokeWidth: 1, strokeDasharray: '4, 3', strokeOpacity: 0.7 } }}
        />

        {/* P50 — WHO median */}
        <VictoryLine
          data={p50}
          style={{ data: { stroke: MEDIAN_COLOR, strokeWidth: 2, strokeOpacity: 0.65 } }}
        />

        {/* Baby's data line */}
        {babyPoints.length >= 2 && (
          <VictoryLine
            data={babyPoints}
            style={{ data: { stroke: BABY_COLOR, strokeWidth: 2.5 } }}
          />
        )}

        {/* Baby's data dots */}
        {babyPoints.length > 0 && (
          <VictoryScatter
            data={babyPoints}
            size={4}
            style={{ data: { fill: BABY_COLOR, stroke: '#fff', strokeWidth: 1.5 } }}
          />
        )}
      </VictoryChart>

      {/* Legend */}
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: BAND_COLOR, borderStyle: 'dashed' }]} />
          <Text style={styles.legendLabel}>P3 / P97</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendLine, { borderColor: MEDIAN_COLOR, borderStyle: 'solid', borderWidth: 2 }]} />
          <Text style={styles.legendLabel}>P50 (Median)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: BABY_COLOR }]} />
          <Text style={styles.legendLabel}>Baby's growth</Text>
        </View>
      </View>

      {babyPoints.length === 0 && (
        <Text style={styles.noDataHint}>Log {activeMetric === 'weight' ? 'weight' : activeMetric === 'height' ? 'height' : 'head circumference'} to see baby's curve</Text>
      )}
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function GrowthTrackerScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();
  const { growthEntries, addGrowth: logGrowth, fetchGrowth, growthLoading } = useTrackerStore();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadGrowth = useCallback(async () => {
    if (activeBaby) await fetchGrowth(activeBaby.id);
  }, [activeBaby]);

  useEffect(() => { loadGrowth(); }, [loadGrowth]);

  const { refreshing, refresh } = useRefresh(loadGrowth);

  const handleSave = async () => {
    if (!activeBaby || !user) return;
    if (!weight && !height && !head) {
      toast.error('Please enter at least one measurement.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (weight && Validators.positiveNumber(weight, 'Weight')) {
      toast.error('Enter a valid weight in kg (e.g. 6.5).');
      return;
    }
    try {
      await logGrowth({
        babyId: activeBaby.id,
        userId: user.uid,
        date: new Date(),
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        headCircumference: head ? parseFloat(head) : undefined,
      });
      setWeight(''); setHeight(''); setHead('');
      setShowForm(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('📏 Growth measurement saved!');
    } catch {
      toast.error('Failed to save. Please try again.');
    }
  };

  const latestEntry = growthEntries[growthEntries.length - 1];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.growthColor} />}
    >
      {/* Current measurements */}
      {latestEntry && (
        <LinearGradient colors={[Colors.growthColor + '25', Colors.growthColor + '05']} style={styles.currentCard}>
          <Text style={styles.currentTitle}>Latest Measurements</Text>
          <View style={styles.metricsRow}>
            {latestEntry.weight && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{(latestEntry.weight / 1000).toFixed(2)}</Text>
                <Text style={styles.metricUnit}>kg</Text>
                <Text style={styles.metricLabel}>Weight</Text>
              </View>
            )}
            {latestEntry.height && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{latestEntry.height}</Text>
                <Text style={styles.metricUnit}>cm</Text>
                <Text style={styles.metricLabel}>Height</Text>
              </View>
            )}
            {latestEntry.headCircumference && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{latestEntry.headCircumference}</Text>
                <Text style={styles.metricUnit}>cm</Text>
                <Text style={styles.metricLabel}>Head</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastUpdated}>
            Last updated: {format(latestEntry.date, 'dd MMM yyyy')}
          </Text>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() =>
              shareViaWhatsApp(
                buildGrowthShareMessage(
                  activeBaby?.name ?? 'Baby',
                  latestEntry.weight ? latestEntry.weight / 1000 : 0,
                  latestEntry.height ?? 0,
                  format(latestEntry.date, 'dd MMM yyyy')
                )
              )
            }
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text style={styles.shareBtnText}>Share on WhatsApp</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* WHO Growth Percentile Chart */}
      {activeBaby && (
        <WHOGrowthChart
          growthEntries={growthEntries}
          birthDate={activeBaby.birthDate}
          gender={activeBaby.gender}
        />
      )}

      {/* Add Growth Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowForm(!showForm)}
      >
        <LinearGradient
          colors={[Colors.growthColor, '#43A047']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.addBtnGradient}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : t('tracker.logGrowth')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Form */}
      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New Measurement</Text>
          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>{t('tracker.weight')} (kg)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="6.5"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>{t('tracker.height')} (cm)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="65"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('tracker.headCirc')} (cm)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={head}
                onChangeText={setHead}
                placeholder="40"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Growth History */}
      <Text style={styles.sectionTitle}>Growth History</Text>
      {growthEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 32 }}>📏</Text>
          <Text style={styles.emptyText}>No growth entries yet</Text>
        </View>
      ) : (
        [...growthEntries].reverse().slice(0, 10).map((entry) => (
          <View key={entry.id} style={styles.growthItem}>
            <View style={styles.growthDate}>
              <Text style={styles.growthDateDay}>{format(entry.date, 'dd')}</Text>
              <Text style={styles.growthDateMon}>{format(entry.date, 'MMM')}</Text>
            </View>
            <View style={styles.growthMetrics}>
              {entry.weight && <Text style={styles.growthMetric}>⚖️ {(entry.weight / 1000).toFixed(2)} kg</Text>}
              {entry.height && <Text style={styles.growthMetric}>📏 {entry.height} cm</Text>}
              {entry.headCircumference && <Text style={styles.growthMetric}>🔵 {entry.headCircumference} cm</Text>}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },

  // Existing styles
  currentCard: { borderRadius: Radius['2xl'], padding: Spacing.lg },
  currentTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.growthColor },
  metricUnit: { fontSize: Typography.sm, color: Colors.textSecondary },
  metricLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  lastUpdated: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: Spacing.md, paddingVertical: 8,
    backgroundColor: '#25D36618', borderRadius: Radius.lg,
  },
  shareBtnText: { fontSize: Typography.sm, color: '#25D366', fontWeight: '600' },
  addBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  addBtnGradient: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  addBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  form: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, gap: Spacing.md, ...Shadows.md },
  formTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  formRow: { flexDirection: 'row', gap: Spacing.md },
  inputGroup: { gap: 6 },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, height: 48,
  },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.growthColor, borderRadius: Radius.xl, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  emptyState: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['2xl'], alignItems: 'center', gap: Spacing.sm, ...Shadows.sm },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary },
  growthItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  growthDate: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.growthColor + '20', alignItems: 'center', justifyContent: 'center',
  },
  growthDateDay: { fontSize: Typography.base, fontWeight: '800', color: Colors.growthColor },
  growthDateMon: { fontSize: Typography.xs, color: Colors.growthColor },
  growthMetrics: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  growthMetric: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '500' },

  // WHO Chart styles
  chartCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    ...Shadows.md,
    gap: Spacing.sm,
  },
  chartTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  metricTabs: { flexDirection: 'row', gap: Spacing.sm },
  metricTab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 8, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.background,
  },
  metricTabActive: { borderColor: Colors.growthColor, backgroundColor: Colors.growthColor + '15' },
  metricTabEmoji: { fontSize: 13 },
  metricTabLabel: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  metricTabLabelActive: { color: Colors.growthColor },
  percentileBadge: {
    borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 8,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  percentileValue: { fontSize: Typography.base, fontWeight: '800' },
  percentileDesc: { fontSize: Typography.xs, fontWeight: '500' },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.lg, paddingTop: Spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendLine: { width: 20, height: 0, borderTopWidth: 2, borderColor: Colors.border },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  noDataHint: {
    fontSize: Typography.xs, color: Colors.textDisabled,
    textAlign: 'center', fontStyle: 'italic', paddingBottom: Spacing.sm,
  },
});
