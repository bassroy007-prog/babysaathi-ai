import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Share, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import {
  buildSchedule, minsToTime, formatDuration, buildScheduleText,
  type ScheduleData, type ScheduleBlock,
} from '@utils/scheduleBuilder';

const { width: W } = Dimensions.get('window');
const TEAL         = '#0D9488';
const TEAL_DARK    = '#134E4A';

// ─── Timeline block ───────────────────────────────────────────────────────────

function TimelineBlock({ block: b, isLast }: { block: ScheduleBlock; isLast: boolean }) {
  const isNight = b.type === 'night_sleep' || b.type === 'night_feed';
  return (
    <View style={styles.tlRow}>
      {/* Time column */}
      <View style={styles.tlTimeCol}>
        <Text style={[styles.tlTime, isNight && styles.tlTimeNight]}>
          {minsToTime(b.startMins)}
        </Text>
      </View>

      {/* Connector */}
      <View style={styles.tlConnector}>
        <View style={[styles.tlDot, { backgroundColor: b.color }]} />
        {!isLast && <View style={[styles.tlLine, { backgroundColor: isNight ? '#4C1D95' : '#E5E7EB' }]} />}
      </View>

      {/* Block card */}
      <View style={[styles.tlCard, { backgroundColor: b.bg, borderLeftColor: b.color }]}>
        <View style={styles.tlCardTop}>
          <Text style={styles.tlIcon}>{b.icon}</Text>
          <Text style={[styles.tlLabel, { color: b.color }]}>{b.label}</Text>
          {b.durationMins < 1440 && (
            <View style={[styles.tlDurBadge, { backgroundColor: b.color + '22' }]}>
              <Text style={[styles.tlDurText, { color: b.color }]}>
                {formatDuration(b.durationMins)}
              </Text>
            </View>
          )}
        </View>
        {b.detail && (
          <Text style={[styles.tlDetail, { color: b.color + 'AA' }]}>{b.detail}</Text>
        )}
      </View>
    </View>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatChip({ icon, value, label }: { icon: string; value: string; label: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ScheduleBuilderScreen() {
  const { activeBaby } = useBabyStore();
  const [data, setData]       = useState<ScheduleData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!activeBaby) { setLoading(false); return; }
    setLoading(true);
    try {
      const d = await buildSchedule(activeBaby);
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => { load(); }, [load]);

  const share = () => {
    if (!data) return;
    Share.share({ message: buildScheduleText(data) }).catch(() => {});
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={[TEAL_DARK, TEAL]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🕐 Daily Schedule</Text>
            {data && (
              <>
                <Text style={styles.headerSub}>
                  {activeBaby?.name} · {data.ageBand.label}
                </Text>
                <View style={styles.detectedBadge}>
                  <Ionicons
                    name={data.dataConfidence === 'detected' ? 'checkmark-circle' : 'information-circle'}
                    size={14}
                    color={data.dataConfidence === 'detected' ? '#6EE7B7' : '#FCD34D'}
                  />
                  <Text style={styles.detectedText}>
                    {data.dataConfidence === 'detected'
                      ? `Wake time detected from your data · ${data.detectedWakeLabel}`
                      : `Using default wake time · ${data.detectedWakeLabel} · log more feeds to personalise`}
                  </Text>
                </View>
              </>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={TEAL} size="large" />
          <Text style={styles.loadingText}>Building your schedule…</Text>
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>🕐</Text>
          <Text style={styles.emptyText}>Add a baby profile to generate a schedule.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Sleep stats ──────────────────────────────────────────── */}
          <View style={styles.statsRow}>
            <StatChip icon="😴" value={formatDuration(data.totalSleepMins)} label="Total sleep" />
            <StatChip icon="🌙" value={formatDuration(data.nightSleepMins)} label="Night sleep" />
            <StatChip icon="💤" value={formatDuration(data.totalNapMins)} label="Nap total" />
          </View>

          {/* ── Age band insight ─────────────────────────────────────── */}
          <View style={styles.bandCard}>
            <View style={styles.bandHeader}>
              <Text style={styles.bandTitle}>{data.ageBand.label} norms</Text>
              <View style={styles.bandPill}>
                <Text style={styles.bandPillText}>{data.ageBand.napsPerDay} nap{data.ageBand.napsPerDay !== 1 ? 's' : ''}</Text>
              </View>
            </View>
            <View style={styles.bandGrid}>
              {[
                { label: 'Wake window',  value: `${data.ageBand.wakeWindowMin}–${data.ageBand.wakeWindowMax} min` },
                { label: 'Nap duration', value: `${data.ageBand.napDurMin}–${data.ageBand.napDurMax} min` },
                { label: 'Total sleep',  value: `${data.ageBand.totalSleepMin}–${data.ageBand.totalSleepMax}h` },
                { label: 'Feeds / day',  value: String(data.ageBand.feedsPerDay) },
              ].map((s) => (
                <View key={s.label} style={styles.bandGridItem}>
                  <Text style={styles.bandGridVal}>{s.value}</Text>
                  <Text style={styles.bandGridLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* ── Timeline ─────────────────────────────────────────────── */}
          <Text style={styles.sectionTitle}>Today's suggested schedule</Text>
          <View style={styles.timeline}>
            {data.blocks.map((b, i) => (
              <TimelineBlock key={b.id} block={b} isLast={i === data.blocks.length - 1} />
            ))}
          </View>

          {/* ── Age-band tips ─────────────────────────────────────────── */}
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Tips for {data.ageBand.label}</Text>
            {data.ageBand.tips.map((tip, i) => (
              <View key={i} style={styles.tipRow}>
                <View style={styles.tipDot} />
                <Text style={styles.tipText}>{tip}</Text>
              </View>
            ))}
          </View>

          {/* ── Bedtime hint ──────────────────────────────────────────── */}
          <View style={styles.bedtimeCard}>
            <Text style={styles.bedtimeIcon}>🌙</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.bedtimeLabel}>Suggested bedtime window</Text>
              <Text style={styles.bedtimeTime}>
                {data.ageBand.suggestedBedtimeHour > 12
                  ? `${data.ageBand.suggestedBedtimeHour - 12}:00 PM`
                  : `${data.ageBand.suggestedBedtimeHour}:00 AM`}
                {' '}– {
                  data.ageBand.suggestedBedtimeHour + 1 > 12
                    ? `${data.ageBand.suggestedBedtimeHour + 1 - 12}:30 PM`
                    : `${data.ageBand.suggestedBedtimeHour + 1}:30 AM`
                }
              </Text>
              <Text style={styles.bedtimeSub}>
                Overtiredness causes early waking and night wake-ups. An earlier bedtime often means longer overnight sleep.
              </Text>
            </View>
          </View>

          {/* ── Disclaimer ───────────────────────────────────────────── */}
          <View style={styles.disclaimer}>
            <Ionicons name="information-circle-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.disclaimerText}>
              This schedule is a guide based on age norms. Every baby is different — follow your baby's cues first.
            </Text>
          </View>

          {/* ── Share ────────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.shareBtn} onPress={share} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.shareText}>Share Schedule</Text>
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
  headerSub:    { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4, marginBottom: 8 },
  detectedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.lg, paddingHorizontal: 10, paddingVertical: 5, alignSelf: 'flex-start' },
  detectedText: { fontSize: 11, color: '#fff', flexShrink: 1 },

  scroll:       { padding: Spacing.xl },

  // Stats
  statsRow:     { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statChip: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, alignItems: 'center', ...Shadows.sm,
  },
  statIcon:     { fontSize: 20, marginBottom: 4 },
  statValue:    { fontSize: Typography.lg, fontWeight: '900', color: TEAL },
  statLabel:    { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  // Band card
  bandCard: {
    backgroundColor: Colors.surface, borderRadius: Radius['2xl'],
    padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm,
  },
  bandHeader:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  bandTitle:    { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  bandPill:     { backgroundColor: TEAL + '20', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  bandPillText: { fontSize: Typography.xs, fontWeight: '700', color: TEAL },
  bandGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  bandGridItem: { width: (W - Spacing.xl * 2 - Spacing.lg * 2 - Spacing.sm) / 2 - Spacing.sm, backgroundColor: '#F8FAFC', borderRadius: Radius.lg, padding: Spacing.md },
  bandGridVal:  { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  bandGridLabel:{ fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Timeline
  timeline:     { marginBottom: Spacing.lg },
  tlRow:        { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 0 },
  tlTimeCol:    { width: 76, paddingTop: 12, paddingRight: Spacing.sm },
  tlTime:       { fontSize: 11, fontWeight: '700', color: Colors.textSecondary, textAlign: 'right' },
  tlTimeNight:  { color: '#A78BFA' },
  tlConnector:  { width: 20, alignItems: 'center' },
  tlDot:        { width: 10, height: 10, borderRadius: 5, marginTop: 14, zIndex: 1 },
  tlLine:       { width: 2, flex: 1, marginTop: 2, minHeight: 24 },
  tlCard: {
    flex: 1, borderRadius: Radius.lg, borderLeftWidth: 3,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    marginBottom: 4, marginLeft: 6,
  },
  tlCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  tlIcon:       { fontSize: 16 },
  tlLabel:      { fontSize: Typography.sm, fontWeight: '700', flex: 1 },
  tlDurBadge:   { borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  tlDurText:    { fontSize: 10, fontWeight: '700' },
  tlDetail:     { fontSize: 11, marginTop: 2 },

  // Tips
  tipsCard: {
    backgroundColor: '#F0FDF4', borderRadius: Radius['2xl'],
    padding: Spacing.lg, marginBottom: Spacing.md, borderLeftWidth: 3, borderLeftColor: '#16A34A',
  },
  tipsTitle:    { fontSize: Typography.sm, fontWeight: '800', color: '#15803D', marginBottom: Spacing.sm },
  tipRow:       { flexDirection: 'row', gap: 8, marginBottom: 6, alignItems: 'flex-start' },
  tipDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: '#16A34A', marginTop: 6 },
  tipText:      { fontSize: Typography.xs, color: '#166534', lineHeight: 18, flex: 1 },

  // Bedtime
  bedtimeCard: {
    flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start',
    backgroundColor: '#1E1B4B', borderRadius: Radius['2xl'],
    padding: Spacing.lg, marginBottom: Spacing.md,
  },
  bedtimeIcon:  { fontSize: 32 },
  bedtimeLabel: { fontSize: Typography.xs, color: '#A5B4FC', fontWeight: '700', marginBottom: 4 },
  bedtimeTime:  { fontSize: Typography.xl, fontWeight: '900', color: '#fff', marginBottom: 4 },
  bedtimeSub:   { fontSize: Typography.xs, color: '#C4B5FD', lineHeight: 18 },

  // Disclaimer
  disclaimer: {
    flexDirection: 'row', gap: 8, alignItems: 'flex-start',
    backgroundColor: '#F3F4F6', borderRadius: Radius.lg,
    padding: Spacing.md, marginBottom: Spacing.md,
  },
  disclaimerText: { fontSize: 11, color: Colors.textSecondary, lineHeight: 16, flex: 1 },

  // Share
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#25D366',
    paddingVertical: Spacing.md, borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  shareText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },

  // Loading / empty
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyEmoji:  { fontSize: 48, marginBottom: Spacing.md },
  emptyText:   { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, textAlign: 'center' },
});
