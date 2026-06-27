import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, ActivityIndicator, Share, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, subMonths, startOfMonth } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { fetchMonthlyData, buildMonthlyHTML, buildMonthlyText } from '@utils/monthlyReport';
import type { MonthlyReportData } from '@utils/monthlyReport';

const CORAL = '#FF6B35';
const CORAL_DARK = '#D94F20';

export default function MonthlyReportScreen() {
  const { activeBaby } = useBabyStore();

  // Month picker state — default to previous complete month
  const [selectedDate, setSelectedDate] = useState(() => subMonths(startOfMonth(new Date()), 1));
  const [report, setReport]   = useState<MonthlyReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const isCurrentMonth = useMemo(() => {
    const now = startOfMonth(new Date());
    return selectedDate >= now;
  }, [selectedDate]);

  const isOldestAllowed = useMemo(() => {
    const oldest = subMonths(startOfMonth(new Date()), 12);
    return selectedDate <= oldest;
  }, [selectedDate]);

  const load = useCallback(async () => {
    if (!activeBaby) return;
    setLoading(true);
    setReport(null);
    try {
      const data = await fetchMonthlyData(activeBaby, selectedDate.getFullYear(), selectedDate.getMonth());
      setReport(data);
    } catch (e) {
      Alert.alert('Error', 'Could not load monthly data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeBaby?.id, selectedDate]);

  useEffect(() => { load(); }, [load]);

  const goBack = () => setSelectedDate((d) => subMonths(d, 1));
  const goNext = () => setSelectedDate((d) => {
    const next = new Date(d);
    next.setMonth(next.getMonth() + 1);
    return startOfMonth(next);
  });

  const handleShareText = useCallback(async () => {
    if (!report) return;
    await Share.share({ message: buildMonthlyText(report) });
  }, [report]);

  const handleSharePDF = useCallback(async () => {
    if (!report) return;
    setSharing(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildMonthlyHTML(report) });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch {
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    } finally {
      setSharing(false);
    }
  }, [report]);

  if (!activeBaby) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No baby profile found.</Text>
      </View>
    );
  }

  const genderEmoji = activeBaby.gender === 'female' ? '👧' : activeBaby.gender === 'male' ? '👦' : '👶';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LinearGradient colors={[CORAL_DARK, CORAL]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📅 Monthly Report Card</Text>
            <Text style={styles.headerSub}>{activeBaby.name}'s monthly summary</Text>

            {/* Month picker */}
            <View style={styles.picker}>
              <TouchableOpacity
                style={[styles.pickerArrow, isOldestAllowed && styles.pickerArrowDisabled]}
                onPress={goBack}
                disabled={isOldestAllowed}
              >
                <Ionicons name="chevron-back" size={20} color={isOldestAllowed ? 'rgba(255,255,255,0.3)' : '#fff'} />
              </TouchableOpacity>

              <Text style={styles.pickerLabel}>{format(selectedDate, 'MMMM yyyy')}</Text>

              <TouchableOpacity
                style={[styles.pickerArrow, isCurrentMonth && styles.pickerArrowDisabled]}
                onPress={goNext}
                disabled={isCurrentMonth}
              >
                <Ionicons name="chevron-forward" size={20} color={isCurrentMonth ? 'rgba(255,255,255,0.3)' : '#fff'} />
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={CORAL} />
          <Text style={styles.loadingText}>Loading {format(selectedDate, 'MMMM')} data…</Text>
        </View>
      ) : !report ? null : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── Baby badge ────────────────────────────────────────────── */}
            <View style={[styles.card, styles.badgeCard]}>
              <Text style={styles.badgeEmoji}>{genderEmoji}</Text>
              <View>
                <Text style={styles.badgeName}>{activeBaby.name}</Text>
                <Text style={styles.badgeMonth}>Month {report.ageMonths} of life</Text>
              </View>
              <View style={[styles.agePill, { marginLeft: 'auto' }]}>
                <Text style={styles.agePillText}>{report.ageMonths}m</Text>
              </View>
            </View>

            {/* ── Activity stats ────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 This Month's Activity</Text>
              <View style={styles.statsGrid}>
                <StatBox
                  emoji="🍼"
                  label="Feeds"
                  value={report.stats.feedCount}
                  prev={report.prevStats.feedCount}
                  color="#FF6B35"
                  bg="#FFF3EE"
                />
                <StatBox
                  emoji="😴"
                  label="Sleep hrs"
                  value={Math.round(report.stats.sleepHours)}
                  prev={Math.round(report.prevStats.sleepHours)}
                  color="#5B3FA8"
                  bg="#F3F0FF"
                />
                <StatBox
                  emoji="👶"
                  label="Diapers"
                  value={report.stats.diaperCount}
                  prev={report.prevStats.diaperCount}
                  color="#1A69C4"
                  bg="#EFF5FF"
                />
              </View>
              <Text style={styles.vsNote}>↑↓ vs previous month</Text>
            </View>

            {/* ── Growth ───────────────────────────────────────────────── */}
            {(report.latestWeight !== null || report.latestHeight !== null) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📏 Growth</Text>
                <View style={styles.growthRow}>
                  {report.latestWeight !== null && (
                    <View style={[styles.growthBox, { backgroundColor: '#FFF3E0' }]}>
                      <Text style={styles.growthEmoji}>⚖️</Text>
                      <Text style={[styles.growthVal, { color: '#E65100' }]}>
                        {report.latestWeight.toFixed(2)} kg
                      </Text>
                      <Text style={styles.growthLabel}>Weight</Text>
                      {report.weightPercentile !== null && (
                        <View style={[styles.percentilePill, { backgroundColor: '#E65100' }]}>
                          <Text style={styles.percentilePillText}>P{report.weightPercentile}</Text>
                        </View>
                      )}
                    </View>
                  )}
                  {report.latestHeight !== null && (
                    <View style={[styles.growthBox, { backgroundColor: '#E8F5E9' }]}>
                      <Text style={styles.growthEmoji}>📐</Text>
                      <Text style={[styles.growthVal, { color: '#2E7D32' }]}>
                        {report.latestHeight} cm
                      </Text>
                      <Text style={styles.growthLabel}>Height</Text>
                      {report.heightPercentile !== null && (
                        <View style={[styles.percentilePill, { backgroundColor: '#2E7D32' }]}>
                          <Text style={styles.percentilePillText}>P{report.heightPercentile}</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
                {report.growthEntries.length > 0 && (
                  <Text style={styles.growthNote}>
                    {report.growthEntries.length} growth measurement{report.growthEntries.length > 1 ? 's' : ''} logged this month
                  </Text>
                )}
              </View>
            )}

            {/* ── Milestones ────────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>⭐ Milestones Achieved</Text>
              {report.milestonesThisMonth.length > 0 ? (
                <View style={styles.milestoneList}>
                  {report.milestonesThisMonth.map((m) => (
                    <View key={m.id} style={styles.milestoneItem}>
                      <View style={styles.milestoneDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.milestoneTitle}>{m.title}</Text>
                        <Text style={styles.milestoneCat}>{m.category}</Text>
                      </View>
                      <Text style={styles.milestoneDone}>✓</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyRow text="No milestones logged this month" />
              )}
            </View>

            {/* ── Vaccines ─────────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💉 Vaccines This Month</Text>
              {report.vaccinesThisMonth.length > 0 ? (
                <View style={styles.milestoneList}>
                  {report.vaccinesThisMonth.map((v) => (
                    <View key={v.id} style={styles.milestoneItem}>
                      <View style={[styles.milestoneDot, { backgroundColor: '#2D7A3A' }]} />
                      <Text style={[styles.milestoneTitle, { flex: 1 }]}>{v.vaccineName}</Text>
                      <View style={styles.donePill}>
                        <Text style={styles.donePillText}>Done ✓</Text>
                      </View>
                    </View>
                  ))}
                </View>
              ) : (
                <EmptyRow text="No vaccines recorded this month" />
              )}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* ── Share bar ──────────────────────────────────────────────── */}
          <View style={styles.shareBar}>
            <TouchableOpacity style={styles.shareTextBtn} onPress={handleShareText}>
              <Ionicons name="logo-whatsapp" size={18} color="#2D7A3A" />
              <Text style={styles.shareTextLabel}>Share Text</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sharePDFBtn, sharing && { opacity: 0.6 }]}
              onPress={handleSharePDF}
              disabled={sharing}
            >
              <LinearGradient colors={[CORAL_DARK, CORAL]} style={styles.sharePDFGrad}>
                {sharing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="document-text-outline" size={18} color="#fff" />
                      <Text style={styles.sharePDFLabel}>Export PDF</Text>
                    </>}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatBox({ emoji, label, value, prev, color, bg }: {
  emoji: string; label: string; value: number; prev: number; color: string; bg: string;
}) {
  const diff = value - prev;
  const arrow = diff > 0 ? '↑' : diff < 0 ? '↓' : '→';
  const arrowColor = diff > 0 ? '#2D7A3A' : diff < 0 ? '#C05A00' : Colors.textSecondary;
  return (
    <View style={[styles.statBox, { backgroundColor: bg }]}>
      <Text style={styles.statEmoji}>{emoji}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={[styles.statArrow, { color: arrowColor }]}>{arrow} {Math.abs(diff)}</Text>
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <Text style={styles.emptyRow}>{text}</Text>;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText:   { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  loadingText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },

  header:        { paddingBottom: Spacing.xl },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:   { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2, marginBottom: Spacing.lg },

  picker:             { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm },
  pickerArrow:        { padding: 4 },
  pickerArrowDisabled: { opacity: 0.4 },
  pickerLabel:        { fontSize: Typography.lg, fontWeight: '800', color: '#fff', flex: 1, textAlign: 'center' },

  scroll:  { padding: Spacing.lg },
  card:    { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  cardTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

  badgeCard:  { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  badgeEmoji: { fontSize: 40 },
  badgeName:  { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  badgeMonth: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  agePill:    { backgroundColor: CORAL + '20', borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  agePillText: { fontSize: Typography.base, fontWeight: '800', color: CORAL },

  statsGrid: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  statBox:   { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: 2 },
  statEmoji: { fontSize: 22 },
  statValue: { fontSize: Typography.xl, fontWeight: '900' },
  statLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '700' },
  statArrow: { fontSize: Typography.xs, fontWeight: '700', marginTop: 2 },
  vsNote:    { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },

  growthRow:  { flexDirection: 'row', gap: Spacing.md },
  growthBox:  { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: 4 },
  growthEmoji: { fontSize: 24 },
  growthVal:  { fontSize: Typography.xl, fontWeight: '900' },
  growthLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  growthNote: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.sm, textAlign: 'center' },
  percentilePill:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  percentilePillText: { fontSize: 10, color: '#fff', fontWeight: '800' },

  milestoneList: { gap: 2 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border },
  milestoneDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: CORAL },
  milestoneTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  milestoneCat:   { fontSize: Typography.xs, color: Colors.textSecondary, textTransform: 'capitalize' },
  milestoneDone:  { fontSize: Typography.base, color: '#2D7A3A', fontWeight: '800' },
  donePill:     { backgroundColor: '#E6F4EA', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  donePillText: { fontSize: 10, color: '#2D7A3A', fontWeight: '800' },
  emptyRow:     { fontSize: Typography.sm, color: Colors.textSecondary, paddingVertical: Spacing.sm },

  shareBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  shareTextBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#2D7A3A', borderRadius: Radius.xl, paddingVertical: 12 },
  shareTextLabel: { fontSize: Typography.sm, fontWeight: '700', color: '#2D7A3A' },
  sharePDFBtn:  { flex: 2, borderRadius: Radius.xl, overflow: 'hidden' },
  sharePDFGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  sharePDFLabel: { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },
});
