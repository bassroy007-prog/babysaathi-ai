import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, Share, ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { format, differenceInMinutes } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import { fetchHandoffData, buildHandoffText, buildHandoffHTML, type HandoffData } from '@utils/caregiverCard';

function toDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') return new Date(v);
  if (v && typeof (v as any).toDate === 'function') return (v as any).toDate();
  return new Date();
}

function timeAgo(d: Date): string {
  const mins = differenceInMinutes(new Date(), d);
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value, accent }: { icon: string; label: string; value: string; accent?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoText}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={[styles.infoValue, accent ? { color: accent } : {}]}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Section Card ─────────────────────────────────────────────────────────────

function SectionCard({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <View style={[styles.sectionCard, { borderLeftColor: color }]}>
      <Text style={[styles.sectionTitle, { color }]}>{title}</Text>
      {children}
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CaregiverCardScreen() {
  const { activeBaby } = useBabyStore();
  const {
    feeds, sleepEntries, getTodayDiaperCount,
    fetchFeeds, fetchSleep, fetchTodayDiapers,
  } = useTrackerStore();

  const [caregiverName, setCaregiverName] = useState('');
  const [notes, setNotes]                 = useState('');
  const [data, setData]                   = useState<HandoffData | null>(null);
  const [loading, setLoading]             = useState(true);
  const [sharing, setSharing]             = useState(false);

  const refresh = useCallback(async () => {
    if (!activeBaby) return;
    setLoading(true);
    try {
      await Promise.all([
        fetchFeeds(activeBaby.id),
        fetchSleep(activeBaby.id),
        fetchTodayDiapers(activeBaby.id),
      ]);
      const d = await fetchHandoffData(
        activeBaby, feeds, sleepEntries, getTodayDiaperCount(),
        caregiverName, notes,
      );
      setData(d);
    } finally {
      setLoading(false);
    }
  }, [activeBaby, caregiverName, notes]);

  useEffect(() => { refresh(); }, [activeBaby]);

  // Rebuild data whenever name/notes/core data changes (no extra Firestore fetch)
  useEffect(() => {
    if (!activeBaby || loading) return;
    fetchHandoffData(
      activeBaby, feeds, sleepEntries, getTodayDiaperCount(),
      caregiverName, notes,
    ).then(setData).catch(() => {});
  }, [caregiverName, notes, feeds, sleepEntries]);

  const shareWhatsApp = async () => {
    if (!data) return;
    try {
      await Share.share({ message: buildHandoffText(data) });
    } catch { /* cancelled */ }
  };

  const exportPDF = async () => {
    if (!data) return;
    setSharing(true);
    try {
      const html   = buildHandoffHTML(data);
      const result = await Print.printToFileAsync({ html, base64: false });
      await Sharing.shareAsync(result.uri, {
        mimeType: 'application/pdf',
        dialogTitle: `${activeBaby?.name ?? 'Baby'} Care Card`,
      });
    } catch (e) {
      Alert.alert('Export failed', 'Could not generate the PDF. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  if (!activeBaby) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Add a baby profile first</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#14532D', '#16A34A']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🤝 Caregiver Card</Text>
            <Text style={styles.headerSub}>Share everything the caregiver needs — in one tap</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Caregiver name */}
        <View style={styles.inputCard}>
          <Text style={styles.inputLabel}>Who's watching today?</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Nani, Dadi, Riya Didi…"
            placeholderTextColor={Colors.textSecondary}
            value={caregiverName}
            onChangeText={setCaregiverName}
            returnKeyType="done"
          />
        </View>

        {/* Loading */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color="#16A34A" />
            <Text style={styles.loadingText}>Fetching {activeBaby.name}'s data…</Text>
          </View>
        ) : data ? (
          <>
            {/* Baby summary */}
            <View style={styles.babyCard}>
              <Text style={styles.babyEmoji}>{activeBaby.gender === 'female' ? '👧' : '👦'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.babyName}>{activeBaby.name}</Text>
                <Text style={styles.babySub}>
                  {activeBaby.bloodGroup && activeBaby.bloodGroup !== 'Unknown'
                    ? `Blood: ${activeBaby.bloodGroup}` : ''}
                  {activeBaby.pediatricianName ? `  ·  Dr. ${activeBaby.pediatricianName}` : ''}
                </Text>
              </View>
              <View style={styles.generatedBadge}>
                <Text style={styles.generatedText}>{format(data.generatedAt, 'h:mm a')}</Text>
              </View>
            </View>

            {/* Feeding section */}
            <SectionCard title="🍼 Feeding" color="#C05A00">
              {data.lastFeed ? (
                <>
                  <InfoRow
                    icon="🕐"
                    label="Last feed"
                    value={`${format(toDate(data.lastFeed.startTime), 'h:mm a')} · ${timeAgo(toDate(data.lastFeed.startTime))}`}
                  />
                  <InfoRow
                    icon="🍼"
                    label="Type"
                    value={
                      data.lastFeed.type === 'breastfeed'
                        ? `Breastfeed${data.lastFeed.side ? ` (${data.lastFeed.side})` : ''}${data.lastFeed.duration ? ` · ${data.lastFeed.duration} min` : ''}`
                        : data.lastFeed.type === 'formula'
                        ? `Formula${data.lastFeed.amount ? ` · ${data.lastFeed.amount} ml` : ''}`
                        : `Solids${data.lastFeed.foodType ? ` · ${data.lastFeed.foodType}` : ''}`
                    }
                  />
                  {data.nextFeedEstimate && (
                    <InfoRow
                      icon="⏰"
                      label="Next feed expected"
                      value={`~${format(data.nextFeedEstimate, 'h:mm a')} · every ~${(data.avgFeedIntervalMins / 60).toFixed(1)}h`}
                      accent="#C05A00"
                    />
                  )}
                </>
              ) : (
                <Text style={styles.emptySection}>No feeds logged yet today</Text>
              )}
            </SectionCard>

            {/* Sleep section */}
            <SectionCard title="😴 Sleep" color="#1A3A6B">
              {data.currentSleep ? (
                <InfoRow
                  icon="💤"
                  label="Currently sleeping"
                  value={`Since ${format(toDate(data.currentSleep.startTime), 'h:mm a')} (${timeAgo(toDate(data.currentSleep.startTime))})`}
                  accent="#1A3A6B"
                />
              ) : data.lastCompletedSleep ? (
                (() => {
                  const start = toDate(data.lastCompletedSleep.startTime);
                  const end   = data.lastCompletedSleep.endTime ? toDate(data.lastCompletedSleep.endTime) : new Date();
                  const dur   = differenceInMinutes(end, start);
                  const h = Math.floor(dur / 60), m = dur % 60;
                  return (
                    <InfoRow
                      icon="🕐"
                      label="Last nap"
                      value={`${format(start, 'h:mm a')}–${format(end, 'h:mm a')} · ${h > 0 ? `${h}h ` : ''}${m}m · ended ${timeAgo(end)}`}
                    />
                  );
                })()
              ) : (
                <Text style={styles.emptySection}>No sleep sessions logged today</Text>
              )}
            </SectionCard>

            {/* Diapers */}
            <SectionCard title="👶 Diapers" color="#5B3FA8">
              <InfoRow
                icon="📊"
                label="Changes today"
                value={`${data.todayDiaperCount} diaper change${data.todayDiaperCount !== 1 ? 's' : ''}`}
              />
            </SectionCard>

            {/* Medications */}
            {data.activeMedications.length > 0 && (
              <SectionCard title="💊 Medications" color="#2D7A3A">
                {data.activeMedications.map((med) => (
                  <View key={med.id} style={styles.medRow}>
                    <View style={styles.medDot} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.medName}>{med.medicineName}</Text>
                      <Text style={styles.medDetail}>
                        {med.dose} {med.unit}
                        {med.reason ? ` · ${med.reason}` : ''}
                      </Text>
                      <Text style={styles.medDetail}>
                        Last: {format(toDate(med.givenAt), 'h:mm a')}
                        {med.nextDoseAt ? ` · Next: ${format(toDate(med.nextDoseAt), 'h:mm a')}` : ''}
                      </Text>
                    </View>
                  </View>
                ))}
              </SectionCard>
            )}

            {/* Allergies */}
            {data.allergicFoods.length > 0 && (
              <View style={styles.allergyCard}>
                <Text style={styles.allergyTitle}>⚠️ Food Allergies — Do NOT give</Text>
                {data.allergicFoods.map((f) => (
                  <View key={f.id} style={styles.allergyRow}>
                    <Ionicons name="close-circle" size={16} color="#B91C1C" />
                    <Text style={styles.allergyFood}>{f.foodName}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Emergency contacts */}
            <View style={styles.emergencyCard}>
              <Text style={styles.emergencyTitle}>🚨 Emergency Numbers</Text>
              <View style={styles.emergencyGrid}>
                {[
                  { label: 'Ambulance',     number: '108'           },
                  { label: 'Poison Control', number: '011-26593677' },
                ].map((e) => (
                  <View key={e.label} style={styles.emergencyItem}>
                    <Text style={styles.emergencyLabel}>{e.label}</Text>
                    <Text style={styles.emergencyNumber}>{e.number}</Text>
                  </View>
                ))}
                {activeBaby.pediatricianName && (
                  <View style={styles.emergencyItem}>
                    <Text style={styles.emergencyLabel}>Dr. {activeBaby.pediatricianName}</Text>
                    <Text style={[styles.emergencyNumber, { fontSize: Typography.sm }]}>Paediatrician</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.inputCard}>
              <Text style={styles.inputLabel}>📝 Notes for today</Text>
              <TextInput
                style={[styles.textInput, { minHeight: 80, textAlignVertical: 'top' }]}
                placeholder="e.g. She didn't sleep well last night. Give her the blue blanket. Nap if cranky after 2 PM."
                placeholderTextColor={Colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
              />
            </View>
          </>
        ) : null}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Sticky share bar */}
      {data && !loading && (
        <View style={styles.shareBar}>
          <TouchableOpacity style={styles.whatsappBtn} onPress={shareWhatsApp} activeOpacity={0.8}>
            <Ionicons name="logo-whatsapp" size={20} color="#fff" />
            <Text style={styles.shareText}>Send on WhatsApp</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pdfBtn} onPress={exportPDF} disabled={sharing} activeOpacity={0.8}>
            {sharing ? (
              <ActivityIndicator color="#16A34A" size="small" />
            ) : (
              <>
                <Ionicons name="document-text-outline" size={20} color="#16A34A" />
                <Text style={[styles.shareText, { color: '#16A34A' }]}>PDF</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
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

  // Input card
  inputCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg, ...Shadows.sm,
  },
  inputLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm },
  textInput: {
    backgroundColor: Colors.background, borderRadius: Radius.lg,
    padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
    borderWidth: 1.5, borderColor: Colors.border,
  },

  // Baby card
  babyCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: '#F0FDF4', borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.lg,
    borderWidth: 1.5, borderColor: '#BBF7D0',
  },
  babyEmoji:   { fontSize: 40 },
  babyName:    { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  babySub:     { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  generatedBadge: {
    backgroundColor: '#DCFCE7', borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm, paddingVertical: 4,
  },
  generatedText: { fontSize: Typography.xs, fontWeight: '700', color: '#15803D' },

  // Section cards
  sectionCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.lg, marginBottom: Spacing.md,
    borderLeftWidth: 4, ...Shadows.sm,
  },
  sectionTitle: { fontSize: Typography.sm, fontWeight: '800', marginBottom: Spacing.md, textTransform: 'uppercase', letterSpacing: 0.5 },

  // Info rows
  infoRow:     { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoIcon:    { fontSize: 16, width: 22, textAlign: 'center', marginTop: 1 },
  infoText:    { flex: 1 },
  infoLabel:   { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  infoValue:   { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600', marginTop: 1 },

  // Med rows
  medRow:      { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm, marginBottom: Spacing.md },
  medDot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2D7A3A', marginTop: 6 },
  medName:     { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  medDetail:   { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },

  // Allergy card
  allergyCard: {
    backgroundColor: '#FEF2F2', borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 2, borderColor: '#FECACA', marginBottom: Spacing.md,
  },
  allergyTitle: { fontSize: Typography.sm, fontWeight: '800', color: '#B91C1C', marginBottom: Spacing.sm },
  allergyRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 4 },
  allergyFood:  { fontSize: Typography.sm, color: '#7F1D1D', fontWeight: '600' },

  // Emergency card
  emergencyCard: {
    backgroundColor: '#FFF7ED', borderRadius: Radius.xl, padding: Spacing.lg,
    borderWidth: 2, borderColor: '#FED7AA', marginBottom: Spacing.md,
  },
  emergencyTitle: { fontSize: Typography.sm, fontWeight: '800', color: '#C2410C', marginBottom: Spacing.md },
  emergencyGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  emergencyItem: {
    flex: 1, minWidth: '45%', backgroundColor: '#fff',
    borderRadius: Radius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: '#FED7AA',
  },
  emergencyLabel:  { fontSize: Typography.xs, color: '#9A3412', fontWeight: '700' },
  emergencyNumber: { fontSize: Typography.lg, fontWeight: '800', color: '#7C2D12', marginTop: 2 },

  // Empty / loading
  center:      { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  loadingText: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: Spacing.md },
  emptyText:   { fontSize: Typography.base, color: Colors.textSecondary },
  emptySection:{ fontSize: Typography.sm, color: Colors.textSecondary, fontStyle: 'italic' },

  // Share bar
  shareBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', gap: Spacing.md,
    backgroundColor: Colors.surface, padding: Spacing.lg,
    borderTopWidth: 1, borderTopColor: Colors.border, ...Shadows.lg,
  },
  whatsappBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#25D366',
    paddingVertical: Spacing.md, borderRadius: Radius.xl,
  },
  pdfBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, paddingHorizontal: Spacing.xl,
    borderRadius: Radius.xl, borderWidth: 2, borderColor: '#16A34A',
  },
  shareText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
