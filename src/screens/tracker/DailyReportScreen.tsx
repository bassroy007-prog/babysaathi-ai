import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Alert, Share, RefreshControl, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, isToday } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import { buildReportHTML, buildReportText, DailyReportData } from '@utils/reportGenerator';

export default function DailyReportScreen() {
  const { activeBaby, getBabyAgeText } = useBabyStore();
  const {
    todayFeeds, todaySleep, todayDiapers, growthEntries,
    temperatures, medications, vaccinations,
    fetchTodayFeeds, fetchTodaySleep, fetchTodayDiapers,
    fetchGrowth, fetchTemperatures, fetchMedications, fetchVaccinations,
    getNextVaccination,
  } = useTrackerStore();

  const [generating, setGenerating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBaby) return;
    await Promise.all([
      fetchTodayFeeds(activeBaby.id),
      fetchTodaySleep(activeBaby.id),
      fetchTodayDiapers(activeBaby.id),
      fetchGrowth(activeBaby.id),
      fetchTemperatures(activeBaby.id),
      fetchMedications(activeBaby.id),
      fetchVaccinations(activeBaby.id),
    ]);
  }, [activeBaby?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const todayTemps = useMemo(() => temperatures.filter((t) => isToday(t.time)),    [temperatures]);
  const todayMeds  = useMemo(() => medications.filter((m)  => isToday(m.givenAt)), [medications]);
  const latestGrowth = useMemo(
    () => [...growthEntries].sort((a, b) => b.date.getTime() - a.date.getTime())[0],
    [growthEntries]
  );
  const nextVaccine = getNextVaccination();

  const reportData = useMemo<DailyReportData | null>(() => {
    if (!activeBaby) return null;
    return {
      baby: activeBaby,
      ageText: getBabyAgeText(),
      date: new Date(),
      feeds: todayFeeds,
      sleep: todaySleep,
      diapers: todayDiapers,
      latestGrowth,
      temperatures: todayTemps,
      medications: todayMeds,
      nextVaccine,
    };
  }, [activeBaby, todayFeeds, todaySleep, todayDiapers, latestGrowth, todayTemps, todayMeds, nextVaccine]);

  const handleSharePDF = useCallback(async () => {
    if (!reportData) return;
    setGenerating(true);
    try {
      const html = buildReportHTML(reportData);
      const { uri } = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch {
      Alert.alert('Could not generate PDF', 'Try sharing as text instead.');
    } finally {
      setGenerating(false);
    }
  }, [reportData]);

  const handleShareText = useCallback(async () => {
    if (!reportData) return;
    await Share.share({ message: buildReportText(reportData) });
  }, [reportData]);

  if (!activeBaby || !reportData) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No baby profile found.</Text>
      </View>
    );
  }

  const totalSleepMin = todaySleep.reduce((a, s) => a + (s.duration ?? 0), 0);
  const wetDiapers    = todayDiapers.filter((d) => d.type === 'wet'   || d.type === 'mixed').length;
  const dirtyDiapers  = todayDiapers.filter((d) => d.type === 'dirty' || d.type === 'mixed').length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <LinearGradient colors={['#1a3a5c', '#2C5282']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📋 Daily Report</Text>
            <Text style={styles.headerSub}>
              {activeBaby.name} · {getBabyAgeText()} · {format(new Date(), 'd MMM yyyy')}
            </Text>

            {/* Summary stat bar */}
            <View style={styles.statsRow}>
              {[
                { emoji: '🍼', val: String(todayFeeds.length),               label: 'Feeds' },
                { emoji: '😴', val: (totalSleepMin / 60).toFixed(1) + 'h',  label: 'Sleep' },
                { emoji: '👶', val: String(todayDiapers.length),             label: 'Diapers' },
              ].map((s, i) => (
                <View key={i} style={styles.statCard}>
                  <Text style={styles.statEmoji}>{s.emoji}</Text>
                  <Text style={styles.statVal}>{s.val}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Report preview ─────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2C5282" />}
      >

        {/* Feeding */}
        <SectionCard title="🍼 Feeding" count={`${todayFeeds.length} today`}>
          {todayFeeds.length === 0
            ? <EmptyRow text="No feeds logged yet" />
            : todayFeeds.map((f) => (
              <DataRow
                key={f.id}
                left={format(f.startTime, 'h:mm a')}
                right={
                  f.type === 'breastfeed' ? `Breastfeed${f.side ? ` · ${f.side}` : ''}${f.duration ? ` · ${f.duration} min` : ''}`
                  : f.type === 'formula'  ? `Formula${f.amount ? ` · ${f.amount} ml` : ''}`
                  :                         `Solids${f.foodType ? ` · ${f.foodType}` : ''}`
                }
              />
            ))}
        </SectionCard>

        {/* Sleep */}
        <SectionCard title="😴 Sleep" count={`${(totalSleepMin / 60).toFixed(1)} hrs`}>
          {todaySleep.length === 0
            ? <EmptyRow text="No sleep logged yet" />
            : todaySleep.map((s) => (
              <DataRow
                key={s.id}
                left={`${format(s.startTime, 'h:mm a')} – ${s.endTime ? format(s.endTime, 'h:mm a') : 'ongoing'}`}
                right={s.duration ? `${Math.floor(s.duration / 60)}h ${s.duration % 60}m` : ''}
              />
            ))}
        </SectionCard>

        {/* Diapers */}
        <SectionCard title="👶 Diapers" count={`${todayDiapers.length} total`}>
          {todayDiapers.length === 0
            ? <EmptyRow text="No diapers logged yet" />
            : (
              <View style={styles.diaperSummary}>
                <View style={styles.diaperItem}>
                  <Text style={styles.diaperEmoji}>💧</Text>
                  <Text style={styles.diaperVal}>{wetDiapers}</Text>
                  <Text style={styles.diaperLabel}>Wet</Text>
                </View>
                <View style={styles.diaperDivider} />
                <View style={styles.diaperItem}>
                  <Text style={styles.diaperEmoji}>💩</Text>
                  <Text style={styles.diaperVal}>{dirtyDiapers}</Text>
                  <Text style={styles.diaperLabel}>Dirty</Text>
                </View>
                <View style={styles.diaperDivider} />
                <View style={styles.diaperItem}>
                  <Text style={styles.diaperEmoji}>✅</Text>
                  <Text style={styles.diaperVal}>{todayDiapers.length}</Text>
                  <Text style={styles.diaperLabel}>Total</Text>
                </View>
              </View>
            )}
        </SectionCard>

        {/* Growth */}
        {latestGrowth && (
          <SectionCard title="📏 Latest Growth" count={format(latestGrowth.date, 'd MMM')}>
            {[
              latestGrowth.weight          && { left: 'Weight',           right: `${(latestGrowth.weight > 50 ? latestGrowth.weight / 1000 : latestGrowth.weight).toFixed(2)} kg` },
              latestGrowth.height          && { left: 'Height',           right: `${latestGrowth.height} cm` },
              latestGrowth.headCircumference && { left: 'Head Circumference', right: `${latestGrowth.headCircumference} cm` },
            ].filter(Boolean).map((row: any, i) => (
              <DataRow key={i} left={row.left} right={row.right} />
            ))}
          </SectionCard>
        )}

        {/* Temperature */}
        {todayTemps.length > 0 && (
          <SectionCard title="🌡️ Temperature" count={`${todayTemps.length} reading${todayTemps.length !== 1 ? 's' : ''}`}>
            {todayTemps.map((t) => (
              <DataRow
                key={t.id}
                left={format(t.time, 'h:mm a')}
                right={`${t.temperature}°C`}
                rightColor={t.feverStatus === 'normal' ? Colors.success ?? '#2D7A3A' : Colors.error}
                tag={t.feverStatus.replace('_', ' ')}
              />
            ))}
          </SectionCard>
        )}

        {/* Medicines */}
        {todayMeds.length > 0 && (
          <SectionCard title="💊 Medicines" count={`${todayMeds.length} given`}>
            {todayMeds.map((m) => (
              <DataRow
                key={m.id}
                left={format(m.givenAt, 'h:mm a')}
                right={`${m.medicineName} · ${m.dose} ${m.unit}`}
                tag={m.reason}
              />
            ))}
          </SectionCard>
        )}

        {/* Next Vaccine */}
        {nextVaccine && (
          <View style={styles.vaccineCard}>
            <Ionicons name="medical" size={18} color="#B8860B" />
            <View style={{ flex: 1 }}>
              <Text style={styles.vaccineTitle}>Next Vaccine Due</Text>
              <Text style={styles.vaccineDetail}>
                {nextVaccine.vaccineName} — {format(nextVaccine.scheduledDate, 'd MMMM yyyy')}
              </Text>
            </View>
          </View>
        )}

        {/* Bottom padding for CTA */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* ── Share buttons (sticky bottom) ──────────────────────────── */}
      <View style={styles.ctaBar}>
        <TouchableOpacity style={styles.ctaSecondary} onPress={handleShareText}>
          <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
          <Text style={styles.ctaSecondaryText}>Share as Text</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.ctaPrimary, generating && { opacity: 0.6 }]}
          onPress={handleSharePDF}
          disabled={generating}
        >
          <LinearGradient colors={['#1a3a5c', '#2C5282']} style={styles.ctaGrad}>
            {generating
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Ionicons name="document-text" size={18} color="#fff" />
                  <Text style={styles.ctaPrimaryText}>Share PDF</Text>
                </>}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function SectionCard({ title, count, children }: { title: string; count: string; children: React.ReactNode }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <Text style={styles.sectionCount}>{count}</Text>
      </View>
      {children}
    </View>
  );
}

function DataRow({ left, right, rightColor, tag }: { left: string; right: string; rightColor?: string; tag?: string }) {
  return (
    <View style={styles.dataRow}>
      <Text style={styles.dataLeft}>{left}</Text>
      <View style={styles.dataRightGroup}>
        <Text style={[styles.dataRight, rightColor ? { color: rightColor } : null]}>{right}</Text>
        {tag && <View style={styles.tagPill}><Text style={styles.tagText}>{tag}</Text></View>}
      </View>
    </View>
  );
}

function EmptyRow({ text }: { text: string }) {
  return <Text style={styles.emptyRow}>{text}</Text>;
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary },

  // Header
  header:        { paddingBottom: Spacing.xl },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:   { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: Spacing.lg },
  statsRow:      { flexDirection: 'row', gap: Spacing.md },
  statCard:      { flex: 1, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center' },
  statEmoji:     { fontSize: 20, marginBottom: 2 },
  statVal:       { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  statLabel:     { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)', marginTop: 1 },

  // Scroll content
  scroll: { padding: Spacing.lg, paddingBottom: 20 },

  // Section card
  sectionCard:   { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, paddingBottom: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border },
  sectionTitle:  { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  sectionCount:  { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },

  // Data row
  dataRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: Colors.background },
  dataLeft:       { fontSize: Typography.sm, color: Colors.textSecondary, flex: 0.35 },
  dataRightGroup: { flex: 0.65, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap' },
  dataRight:      { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '500', textAlign: 'right' },
  tagPill:        { backgroundColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 7, paddingVertical: 2 },
  tagText:        { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },
  emptyRow:       { fontSize: Typography.sm, color: Colors.textSecondary, fontStyle: 'italic', paddingVertical: Spacing.sm, textAlign: 'center' },

  // Diaper summary
  diaperSummary: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingVertical: Spacing.md },
  diaperItem:    { alignItems: 'center', flex: 1 },
  diaperEmoji:   { fontSize: 24, marginBottom: 4 },
  diaperVal:     { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  diaperLabel:   { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  diaperDivider: { width: 1, height: 40, backgroundColor: Colors.border },

  // Vaccine card
  vaccineCard:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, backgroundColor: '#FFFDE7', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#F9A825' + '50' },
  vaccineTitle:  { fontSize: Typography.sm, fontWeight: '700', color: '#7A5A00', marginBottom: 2 },
  vaccineDetail: { fontSize: Typography.sm, color: '#555' },

  // CTA bar
  ctaBar:         { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', gap: Spacing.md, padding: Spacing.lg, backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.lg },
  ctaSecondary:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: '#25D366', borderRadius: Radius.xl, paddingVertical: 13 },
  ctaSecondaryText: { fontSize: Typography.base, fontWeight: '700', color: '#25D366' },
  ctaPrimary:     { flex: 1.4, borderRadius: Radius.xl, overflow: 'hidden' },
  ctaGrad:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 13 },
  ctaPrimaryText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
