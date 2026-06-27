import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Share, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, differenceInDays } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { VaccinationEntry } from '@types/index';
import {
  getVaccineGuide, PRE_VISIT_CHECKLIST, POST_VACCINE_CARE,
  type VaccineGuideEntry,
} from '@constants/vaccineGuide';
import {
  fetchVaccinePrepData, buildVisitPrepText,
  type VaccinePrepData, type VaccineVisit,
} from '@utils/vaccinePrep';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (v && typeof (v as any).toDate === 'function') return (v as any).toDate();
  return new Date(v as any);
}

// ─── Vaccine detail card (expandable) ────────────────────────────────────────

function VaccineCard({ entry, guide }: { entry: VaccinationEntry; guide: VaccineGuideEntry | null }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={styles.vaccineCard}>
      <TouchableOpacity style={styles.vaccineCardHeader} onPress={() => setOpen(!open)} activeOpacity={0.75}>
        <Text style={styles.vaccineEmoji}>{guide?.emoji ?? '💉'}</Text>
        <View style={{ flex: 1 }}>
          <Text style={styles.vaccineCardTitle}>{entry.vaccineName}</Text>
          {guide && (
            <Text style={styles.vaccineCardSub} numberOfLines={1}>
              {guide.protectsAgainst.slice(0, 2).join(' · ')}
            </Text>
          )}
        </View>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textSecondary} />
      </TouchableOpacity>

      {open && guide && (
        <View style={styles.vaccineCardBody}>
          {/* Route */}
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{guide.route}</Text>
          </View>

          {/* Protects against */}
          <Text style={styles.subHeading}>Protects against</Text>
          {guide.protectsAgainst.map((p, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>✓</Text>
              <Text style={styles.bulletText}>{p}</Text>
            </View>
          ))}

          {/* Side effects */}
          <Text style={styles.subHeading}>What to expect</Text>
          {guide.sideEffects.map((se, i) => {
            const color  = se.severity === 'urgent' ? '#B91C1C' : se.severity === 'watch' ? '#B45309' : '#15803D';
            const bg     = se.severity === 'urgent' ? '#FEF2F2' : se.severity === 'watch' ? '#FFFBEB' : '#F0FDF4';
            const prefix = se.severity === 'urgent' ? '🔴' : se.severity === 'watch' ? '🟡' : '🟢';
            return (
              <View key={i} style={[styles.seBadge, { backgroundColor: bg }]}>
                <Text style={styles.sePrefix}>{prefix}</Text>
                <Text style={[styles.seText, { color }]}>{se.text}</Text>
              </View>
            );
          })}

          <Text style={[styles.durationText]}>⏱️ Duration: {guide.duration}</Text>

          {/* Comfort tips */}
          <Text style={styles.subHeading}>Comfort tips</Text>
          {guide.comfortTips.map((t, i) => (
            <Text key={i} style={styles.tipText}>{t}</Text>
          ))}

          {/* See doctor if */}
          {guide.doctorIf.length > 0 && (
            <>
              <Text style={[styles.subHeading, { color: '#B91C1C' }]}>See doctor if…</Text>
              {guide.doctorIf.map((d, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Text style={styles.bulletDot}>⚠️</Text>
                  <Text style={[styles.bulletText, { color: '#7F1D1D' }]}>{d}</Text>
                </View>
              ))}
            </>
          )}

          {/* Important note */}
          {guide.importantNote && (
            <View style={styles.noteBox}>
              <Text style={styles.noteText}>💡 {guide.importantNote}</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Visit group ──────────────────────────────────────────────────────────────

function VisitGroup({ visit, overdue = false }: { visit: VaccineVisit; overdue?: boolean }) {
  const days = visit.daysUntil;
  const countdownLabel = overdue
    ? `${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''} overdue`
    : days === 0 ? 'Today!'
    : days === 1 ? 'Tomorrow'
    : `In ${days} days`;

  const borderColor = overdue ? '#B91C1C' : days <= 7 ? '#D97706' : '#2563EB';

  return (
    <View style={[styles.visitGroup, { borderLeftColor: borderColor }]}>
      <View style={styles.visitGroupHeader}>
        <View>
          <Text style={[styles.visitDate, { color: borderColor }]}>
            {format(visit.date, 'd MMMM yyyy')}
          </Text>
          <Text style={[styles.visitCountdown, { color: borderColor }]}>{countdownLabel}</Text>
        </View>
        <View style={[styles.countBadge, { backgroundColor: borderColor + '18' }]}>
          <Text style={[styles.countBadgeText, { color: borderColor }]}>
            {visit.vaccines.length} vaccine{visit.vaccines.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {visit.vaccines.map((v) => (
        <VaccineCard key={v.id} entry={v} guide={getVaccineGuide(v.vaccineId)} />
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function VaccinePrepScreen() {
  const { activeBaby } = useBabyStore();
  const [data, setData]         = useState<VaccinePrepData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [checked, setChecked]   = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!activeBaby) { setLoading(false); return; }
    setLoading(true);
    try {
      const d = await fetchVaccinePrepData(activeBaby);
      setData(d);
    } catch {
      Alert.alert('Error', 'Could not load vaccine data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [activeBaby]);

  useEffect(() => { load(); }, [load]);

  const toggleCheck = (id: string) =>
    setChecked((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const share = () => {
    if (!data) return;
    Share.share({ message: buildVisitPrepText(data) }).catch(() => {});
  };

  const checkedCount = checked.size;
  const totalItems   = PRE_VISIT_CHECKLIST.length;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#0C4A6E', '#0369A1']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>💉 Vaccine Prep Guide</Text>
            <Text style={styles.headerSub}>
              {activeBaby ? `${activeBaby.name} · ${data ? `${data.ageWeeks} weeks old` : '…'}` : 'Loading…'}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#0369A1" size="large" />
          <Text style={styles.loadingText}>Loading vaccine schedule…</Text>
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Text style={styles.emptyEmoji}>💉</Text>
          <Text style={styles.emptyText}>No baby profile found</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* ── Overdue alert ─────────────────────────────────────────── */}
          {data.overdueVisits.length > 0 && (
            <View style={styles.overdueAlert}>
              <Ionicons name="alert-circle" size={20} color="#B91C1C" />
              <Text style={styles.overdueText}>
                {data.overdueVisits.reduce((s, v) => s + v.vaccines.length, 0)} overdue vaccine{data.overdueVisits.reduce((s, v) => s + v.vaccines.length, 0) !== 1 ? 's' : ''} — schedule catch-up appointment
              </Text>
            </View>
          )}

          {/* ── No vaccines set up ─────────────────────────────────────── */}
          {!data.nextVisit && data.overdueVisits.length === 0 && (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyCardText}>No pending vaccines found.</Text>
              <Text style={styles.emptyCardSub}>Set up the vaccine schedule in the Vaccination Tracker first.</Text>
            </View>
          )}

          {/* ── Overdue visits ─────────────────────────────────────────── */}
          {data.overdueVisits.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: '#B91C1C' }]}>⚠️ Overdue</Text>
              {data.overdueVisits.map((v) => <VisitGroup key={v.dateKey} visit={v} overdue />)}
            </View>
          )}

          {/* ── Next visit ────────────────────────────────────────────── */}
          {data.nextVisit && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Next Visit</Text>
              <VisitGroup visit={data.nextVisit} />
            </View>
          )}

          {/* ── Pre-visit checklist ───────────────────────────────────── */}
          <View style={styles.section}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>✅ Pre-visit Checklist</Text>
              <Text style={styles.checkProgress}>{checkedCount}/{totalItems} done</Text>
            </View>
            <View style={styles.checklistCard}>
              {PRE_VISIT_CHECKLIST.map((item) => {
                const done = checked.has(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={[styles.checkItem, done && styles.checkItemDone]}
                    onPress={() => toggleCheck(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkbox, done && styles.checkboxDone]}>
                      {done && <Ionicons name="checkmark" size={14} color="#fff" />}
                    </View>
                    <Text style={styles.checkItemIcon}>{item.icon}</Text>
                    <Text style={[styles.checkItemText, done && styles.checkItemTextDone]}>{item.text}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Paracetamol dose calculator ───────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💊 Paracetamol Dose</Text>
            <View style={styles.paraCard}>
              <View style={styles.paraHeader}>
                <Text style={styles.paraTitle}>For Crocin / Calpol 120 mg / 5 ml</Text>
                <View style={styles.paraWarningBadge}>
                  <Text style={styles.paraWarningText}>AFTER vaccine only</Text>
                </View>
              </View>
              {data.paracetamolDoseMl !== null ? (
                <>
                  <View style={styles.paraDoseRow}>
                    <Text style={styles.paraDoseNumber}>{data.paracetamolDoseMl}</Text>
                    <Text style={styles.paraDoseUnit}>ml</Text>
                  </View>
                  <Text style={styles.paraDoseSub}>
                    = {data.paracetamolMg} mg · based on {data.latestWeightKg?.toFixed(1)} kg body weight
                  </Text>
                  <Text style={styles.paraDoseSub}>Every 4–6 hours · maximum 4 doses per day</Text>
                  <View style={styles.paraWarnBox}>
                    <Ionicons name="warning-outline" size={14} color="#B45309" />
                    <Text style={styles.paraWarnText}>
                      Do NOT give paracetamol before vaccination — it reduces the antibody response.
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={styles.paraNoWeight}>
                  Add a weight measurement in the Growth Tracker to calculate the dose.
                </Text>
              )}
            </View>
          </View>

          {/* ── Post-vaccine care ─────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🏠 Post-vaccine Care</Text>
            {POST_VACCINE_CARE.map((day) => (
              <View key={day.day} style={[styles.careCard, { borderLeftColor: day.color }]}>
                <Text style={[styles.careDayTitle, { color: day.color }]}>{day.day}</Text>
                {day.steps.map((step, i) => (
                  <View key={i} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={styles.bulletText}>{step}</Text>
                  </View>
                ))}
              </View>
            ))}
          </View>

          {/* ── Recent vaccines ───────────────────────────────────────── */}
          {data.recentAdministered.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📚 Recent Vaccines</Text>
              <View style={styles.recentCard}>
                {data.recentAdministered.map((v) => (
                  <View key={v.id} style={styles.recentRow}>
                    <View style={styles.recentDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recentName}>{v.vaccineName}</Text>
                      <Text style={styles.recentDate}>
                        {v.administeredDate ? format(toDate(v.administeredDate), 'd MMM yyyy') : '—'}
                        {v.doctorName ? ` · Dr. ${v.doctorName}` : ''}
                      </Text>
                    </View>
                    <View style={styles.doneBadge}>
                      <Text style={styles.doneBadgeText}>✓ Done</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Share button ──────────────────────────────────────────── */}
          <TouchableOpacity style={styles.shareBtn} onPress={share} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.shareText}>Share Vaccine Prep Summary</Text>
          </TouchableOpacity>

          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: Colors.background },

  // Header
  header:      { paddingBottom: Spacing['2xl'] },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:   { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  scroll:      { padding: Spacing.xl },

  // Overdue alert
  overdueAlert: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: '#FEF2F2', borderRadius: Radius.xl,
    padding: Spacing.md, borderWidth: 1.5, borderColor: '#FECACA',
    marginBottom: Spacing.lg,
  },
  overdueText: { flex: 1, fontSize: Typography.sm, fontWeight: '700', color: '#B91C1C' },

  // Sections
  section:         { marginBottom: Spacing.xl },
  sectionTitle:    { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  checkProgress:   { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },

  // Visit group
  visitGroup: {
    borderLeftWidth: 4, paddingLeft: Spacing.md,
    marginBottom: Spacing.md,
  },
  visitGroupHeader: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  visitDate:        { fontSize: Typography.base, fontWeight: '800' },
  visitCountdown:   { fontSize: Typography.sm, fontWeight: '600', marginTop: 2 },
  countBadge:       { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  countBadgeText:   { fontSize: Typography.xs, fontWeight: '700' },

  // Vaccine card
  vaccineCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    marginBottom: Spacing.sm, overflow: 'hidden', ...Shadows.sm,
  },
  vaccineCardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    padding: Spacing.md,
  },
  vaccineEmoji:     { fontSize: 22 },
  vaccineCardTitle: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  vaccineCardSub:   { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  vaccineCardBody:  { paddingHorizontal: Spacing.md, paddingBottom: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.border },

  // Info rows inside card
  infoRow:    { flexDirection: 'row', gap: Spacing.sm, paddingTop: Spacing.sm, alignItems: 'flex-start' },
  infoIcon:   { fontSize: 14, marginTop: 1 },
  infoText:   { flex: 1, fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 18 },
  subHeading: { fontSize: Typography.xs, fontWeight: '800', color: Colors.textSecondary, marginTop: Spacing.md, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 0.5 },
  bulletRow:  { flexDirection: 'row', gap: 8, marginBottom: 4, alignItems: 'flex-start' },
  bulletDot:  { fontSize: 13, color: Colors.textSecondary, marginTop: 1 },
  bulletText: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  seBadge:    { flexDirection: 'row', gap: 8, borderRadius: Radius.md, padding: 8, marginBottom: 4, alignItems: 'flex-start' },
  sePrefix:   { fontSize: 12 },
  seText:     { flex: 1, fontSize: Typography.xs, lineHeight: 18 },
  durationText: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: Spacing.sm, fontStyle: 'italic' },
  tipText:    { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 22, marginBottom: 4 },
  noteBox: {
    backgroundColor: '#EFF6FF', borderRadius: Radius.lg,
    padding: Spacing.sm, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: '#BFDBFE',
  },
  noteText:   { fontSize: Typography.xs, color: '#1E40AF', lineHeight: 18 },

  // Checklist
  checklistCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, ...Shadows.sm,
  },
  checkItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  checkItemDone:     { opacity: 0.6 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2,
    borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  checkboxDone:      { backgroundColor: '#0369A1', borderColor: '#0369A1' },
  checkItemIcon:     { fontSize: 16 },
  checkItemText:     { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  checkItemTextDone: { textDecorationLine: 'line-through', color: Colors.textSecondary },

  // Paracetamol card
  paraCard: {
    backgroundColor: '#EFF6FF', borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1.5, borderColor: '#BFDBFE',
  },
  paraHeader:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.md },
  paraTitle:       { fontSize: Typography.sm, fontWeight: '700', color: '#1E40AF', flex: 1 },
  paraWarningBadge:{ backgroundColor: '#FEF3C7', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  paraWarningText: { fontSize: 10, fontWeight: '800', color: '#92400E' },
  paraDoseRow:     { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  paraDoseNumber:  { fontSize: 52, fontWeight: '900', color: '#1D4ED8', lineHeight: 60 },
  paraDoseUnit:    { fontSize: Typography.xl, fontWeight: '700', color: '#1D4ED8', marginBottom: 8 },
  paraDoseSub:     { fontSize: Typography.xs, color: '#1E40AF', marginTop: 4 },
  paraWarnBox:     { flexDirection: 'row', gap: 6, marginTop: Spacing.md, alignItems: 'flex-start', backgroundColor: '#FFFBEB', borderRadius: Radius.md, padding: Spacing.sm },
  paraWarnText:    { flex: 1, fontSize: Typography.xs, color: '#B45309', lineHeight: 18 },
  paraNoWeight:    { fontSize: Typography.sm, color: Colors.textSecondary, fontStyle: 'italic' },

  // Post-vaccine care
  careCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, borderLeftWidth: 4, marginBottom: Spacing.sm, ...Shadows.sm,
  },
  careDayTitle: { fontSize: Typography.base, fontWeight: '800', marginBottom: Spacing.sm },

  // Recent vaccines
  recentCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, ...Shadows.sm,
  },
  recentRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  recentDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: '#15803D' },
  recentName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  recentDate: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  doneBadge:  { backgroundColor: '#DCFCE7', paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: Radius.full },
  doneBadgeText: { fontSize: 11, fontWeight: '700', color: '#15803D' },

  // Empty states
  center:       { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  loadingText:  { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyEmoji:   { fontSize: 48 },
  emptyText:    { fontSize: Typography.base, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyCard:    { alignItems: 'center', paddingVertical: 40 },
  emptyCardText:{ fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginTop: Spacing.md },
  emptyCardSub: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', marginTop: 4 },

  // Share
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#25D366',
    paddingVertical: Spacing.md, borderRadius: Radius.xl,
    marginBottom: Spacing.md,
  },
  shareText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
