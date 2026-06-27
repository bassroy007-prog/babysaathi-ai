import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView, StatusBar,
  TouchableOpacity, ActivityIndicator, Share, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, subDays } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { fetchVisitData, buildVisitHTML, buildVisitText } from '@utils/visitPrep';
import type { VisitSummaryData, VisitQuestion } from '@utils/visitPrep';

const TEAL      = '#0B6E6E';
const TEAL_DARK = '#06545A';
const TEAL_LIGHT = '#E0F5F5';

export default function VisitPrepScreen() {
  const { activeBaby } = useBabyStore();
  const [data,    setData]    = useState<VisitSummaryData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  // Local check state — tracks which questions the parent has discussed
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!activeBaby) return;
    setLoading(true);
    try {
      const result = await fetchVisitData(activeBaby);
      setData(result);
      setChecked(new Set());
    } catch {
      Alert.alert('Error', 'Could not load visit data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeBaby?.id]);

  useEffect(() => { load(); }, [load]);

  const toggleQ = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleShareText = useCallback(async () => {
    if (!data) return;
    await Share.share({ message: buildVisitText(data) });
  }, [data]);

  const handleSharePDF = useCallback(async () => {
    if (!data) return;
    setSharing(true);
    try {
      const { uri } = await Print.printToFileAsync({ html: buildVisitHTML(data) });
      await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
    } catch {
      Alert.alert('Error', 'Could not generate PDF.');
    } finally {
      setSharing(false);
    }
  }, [data]);

  // Group questions by category
  const groupedQuestions = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, VisitQuestion[]>();
    data.questions.forEach((q) => {
      const list = map.get(q.category) ?? [];
      list.push(q);
      map.set(q.category, list);
    });
    return Array.from(map.entries());
  }, [data]);

  const totalQ   = data?.questions.length ?? 0;
  const doneQ    = checked.size;

  if (!activeBaby) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No baby profile found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <LinearGradient colors={[TEAL_DARK, TEAL]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🩺 Visit Prep</Text>
            <Text style={styles.headerSub}>
              {activeBaby.name} · {data ? `${data.ageMonths}m ${data.ageWeeks % 4}w old` : '…'}
            </Text>
            <View style={styles.headerMeta}>
              <Ionicons name="calendar-outline" size={12} color="rgba(255,255,255,0.7)" />
              <Text style={styles.headerMetaText}>
                Generated {format(new Date(), 'd MMMM yyyy')} · Last {14} days
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={TEAL} />
          <Text style={styles.loadingText}>Pulling {activeBaby.name}'s data…</Text>
        </View>
      ) : !data ? null : (
        <>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

            {/* ── 2-week snapshot ───────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>
                📊 2-Week Snapshot
                <Text style={styles.cardSub}>  {format(subDays(new Date(), 14), 'd MMM')} – {format(new Date(), 'd MMM')}</Text>
              </Text>
              <View style={styles.snapGrid}>
                <SnapBox emoji="🍼" label="Feeds/day" value={String(data.avgFeedsPerDay)} color="#FF6B35" />
                <SnapBox emoji="😴" label="Sleep hrs/day" value={String(data.avgSleepHrsPerDay)} color={TEAL} />
                <SnapBox emoji="👶" label="Diapers/day" value={String(data.avgDiapersPerDay)} color="#1A69C4" />
              </View>
            </View>

            {/* ── Growth ───────────────────────────────────────────────── */}
            {(data.latestWeight !== null || data.latestHeight !== null) && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📏 Growth</Text>
                <View style={styles.growthRow}>
                  {data.latestWeight !== null && (
                    <GrowthBox
                      emoji="⚖️"
                      label="Weight"
                      value={`${data.latestWeight.toFixed(2)} kg`}
                      percentile={data.weightPercentile}
                      bg="#FFF3E0"
                      color="#E65100"
                    />
                  )}
                  {data.latestHeight !== null && (
                    <GrowthBox
                      emoji="📐"
                      label="Height"
                      value={`${data.latestHeight} cm`}
                      percentile={data.heightPercentile}
                      bg="#E8F5E9"
                      color="#2E7D32"
                    />
                  )}
                </View>
              </View>
            )}

            {/* ── Vaccines ─────────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💉 Vaccines</Text>

              <Text style={styles.subHeading}>Recent (last 14 days)</Text>
              {data.recentVaccines.length > 0
                ? data.recentVaccines.map((v) => (
                    <View key={v.id} style={styles.listRow}>
                      <View style={[styles.statusDot, { backgroundColor: '#2D7A3A' }]} />
                      <Text style={styles.listText}>{v.vaccineName}</Text>
                      <Text style={styles.listDate}>
                        {v.administeredDate ? format(v.administeredDate, 'd MMM') : ''}
                      </Text>
                    </View>
                  ))
                : <Text style={styles.emptyRowText}>None in the last 14 days</Text>}

              {data.upcomingVaccines.length > 0 && (
                <>
                  <Text style={[styles.subHeading, { marginTop: Spacing.md }]}>Upcoming</Text>
                  {data.upcomingVaccines.map((v) => (
                    <View key={v.id} style={styles.listRow}>
                      <View style={[styles.statusDot, { backgroundColor: '#C05A00' }]} />
                      <Text style={styles.listText}>{v.vaccineName}</Text>
                      <Text style={styles.listDate}>{format(v.scheduledDate, 'd MMM yyyy')}</Text>
                    </View>
                  ))}
                </>
              )}
            </View>

            {/* ── Medications ──────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>💊 Medications (last 14 days)</Text>
              {data.recentMedications.length > 0
                ? data.recentMedications.map((m) => (
                    <View key={m.id} style={styles.listRow}>
                      <View style={[styles.statusDot, { backgroundColor: '#7B2D8B' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listText}>{m.medicineName}</Text>
                        <Text style={styles.listDate}>{m.dose}{m.unit}{m.reason ? ` · ${m.reason}` : ''}</Text>
                      </View>
                      <Text style={styles.listDate}>{format(m.givenAt, 'd MMM')}</Text>
                    </View>
                  ))
                : <Text style={styles.emptyRowText}>No medications in the last 14 days</Text>}
            </View>

            {/* ── Open milestones ───────────────────────────────────────── */}
            {data.openMilestones.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>⏳ Pending Milestones</Text>
                <Text style={styles.cardHint}>Share with doctor if you have concerns</Text>
                {data.openMilestones.map((m) => (
                  <View key={m.id} style={styles.listRow}>
                    <View style={[styles.statusDot, { backgroundColor: '#B8860B' }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.listText}>{m.title}</Text>
                      <Text style={styles.listDate}>{m.category} · expected ~{Math.round(m.expectedAgeWeeks / 4.3)}m</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* ── Questions to ask ─────────────────────────────────────── */}
            <View style={styles.card}>
              <View style={styles.qHeader}>
                <Text style={styles.cardTitle}>❓ Questions to Ask</Text>
                <View style={styles.qProgress}>
                  <Text style={styles.qProgressText}>{doneQ}/{totalQ} asked</Text>
                </View>
              </View>
              <Text style={styles.cardHint}>Tap each question to mark as discussed</Text>

              {groupedQuestions.map(([category, questions]) => (
                <View key={category} style={styles.qCategory}>
                  <Text style={styles.qCategoryLabel}>{category}</Text>
                  {questions.map((q) => {
                    const done = checked.has(q.id);
                    return (
                      <TouchableOpacity
                        key={q.id}
                        style={[styles.questionRow, done && styles.questionRowDone]}
                        onPress={() => toggleQ(q.id)}
                        activeOpacity={0.7}
                      >
                        <View style={[styles.qCheckbox, done && styles.qCheckboxDone]}>
                          {done && <Ionicons name="checkmark" size={12} color="#fff" />}
                        </View>
                        <Text style={[styles.questionText, done && styles.questionTextDone]}>
                          {q.text}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>

          {/* ── Share bar ──────────────────────────────────────────────── */}
          <View style={styles.shareBar}>
            <TouchableOpacity style={styles.shareTextBtn} onPress={handleShareText}>
              <Ionicons name="logo-whatsapp" size={18} color="#2D7A3A" />
              <Text style={styles.shareTextLabel}>Share Summary</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.sharePDFBtn, sharing && { opacity: 0.6 }]}
              onPress={handleSharePDF}
              disabled={sharing}
            >
              <LinearGradient colors={[TEAL_DARK, TEAL]} style={styles.sharePDFGrad}>
                {sharing
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <>
                      <Ionicons name="document-text-outline" size={18} color="#fff" />
                      <Text style={styles.sharePDFLabel}>Doctor PDF</Text>
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

function SnapBox({ emoji, label, value, color }: { emoji: string; label: string; value: string; color: string }) {
  return (
    <View style={[styles.snapBox, { borderTopColor: color, borderTopWidth: 3 }]}>
      <Text style={styles.snapEmoji}>{emoji}</Text>
      <Text style={[styles.snapValue, { color }]}>{value}</Text>
      <Text style={styles.snapLabel}>{label}</Text>
    </View>
  );
}

function GrowthBox({ emoji, label, value, percentile, bg, color }: {
  emoji: string; label: string; value: string;
  percentile: number | null; bg: string; color: string;
}) {
  return (
    <View style={[styles.growthBox, { backgroundColor: bg }]}>
      <Text style={styles.growthEmoji}>{emoji}</Text>
      <Text style={[styles.growthVal, { color }]}>{value}</Text>
      <Text style={styles.growthLabel}>{label}</Text>
      {percentile !== null && (
        <View style={[styles.percentilePill, { backgroundColor: color }]}>
          <Text style={styles.percentilePillText}>P{percentile} WHO</Text>
        </View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },
  center:      { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  emptyText:   { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  loadingText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },

  header:        { paddingBottom: Spacing.xl },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:   { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', marginTop: 2, fontWeight: '600' },
  headerMeta:    { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  headerMetaText: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.7)' },

  scroll:   { padding: Spacing.lg },
  card:     { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  cardTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  cardSub:   { fontSize: Typography.xs, fontWeight: '400', color: Colors.textSecondary },
  cardHint:  { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: -Spacing.sm, marginBottom: Spacing.md },

  snapGrid: { flexDirection: 'row', gap: Spacing.sm },
  snapBox:  { flex: 1, backgroundColor: Colors.background, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: 2 },
  snapEmoji: { fontSize: 22 },
  snapValue: { fontSize: Typography.xl, fontWeight: '900' },
  snapLabel: { fontSize: 9, color: Colors.textSecondary, fontWeight: '700', textAlign: 'center' },

  growthRow: { flexDirection: 'row', gap: Spacing.md },
  growthBox: { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center', gap: 4 },
  growthEmoji: { fontSize: 24 },
  growthVal:   { fontSize: Typography.xl, fontWeight: '900' },
  growthLabel: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  percentilePill:     { borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4 },
  percentilePillText: { fontSize: 10, color: '#fff', fontWeight: '800' },

  subHeading: { fontSize: Typography.xs, fontWeight: '800', color: TEAL, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: Spacing.sm },

  listRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.border },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  listText:  { flex: 1, fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  listDate:  { fontSize: Typography.xs, color: Colors.textSecondary },
  emptyRowText: { fontSize: Typography.sm, color: Colors.textSecondary, paddingVertical: 4 },

  qHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  qProgress:     { backgroundColor: TEAL_LIGHT, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 3 },
  qProgressText: { fontSize: Typography.xs, fontWeight: '800', color: TEAL },

  qCategory:      { marginBottom: Spacing.md },
  qCategoryLabel: { fontSize: Typography.xs, fontWeight: '800', color: TEAL, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },

  questionRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  questionRowDone: { opacity: 0.5 },
  qCheckbox:     { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: TEAL, alignItems: 'center', justifyContent: 'center', marginTop: 1, flexShrink: 0 },
  qCheckboxDone: { backgroundColor: TEAL, borderColor: TEAL },
  questionText:     { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  questionTextDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },

  shareBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border,
    ...Shadows.lg,
  },
  shareTextBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#2D7A3A', borderRadius: Radius.xl, paddingVertical: 12 },
  shareTextLabel: { fontSize: Typography.sm, fontWeight: '700', color: '#2D7A3A' },
  sharePDFBtn:    { flex: 2, borderRadius: Radius.xl, overflow: 'hidden' },
  sharePDFGrad:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12 },
  sharePDFLabel:  { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },
});
