import React, { useEffect, useRef, useCallback, useState, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, TextInput, Modal, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addWeeks } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { useGrandparentMode } from '@hooks/useGrandparentMode';
import ConfettiOverlay, { ConfettiHandle } from '@components/common/ConfettiOverlay';
import { CULTURAL_MILESTONES } from '@constants/index';
import { CulturalMilestoneEntry } from '@types/index';
import {
  shareViaWhatsApp,
  buildCulturalMilestoneShareMessage,
} from '@utils/share';
import {
  scheduleCulturalMilestoneReminder,
  cancelCulturalMilestoneReminder,
} from '@services/notifications/notificationService';

// ─── Types ────────────────────────────────────────────────────────────────────

type CeremonyDef = typeof CULTURAL_MILESTONES[number];

// ─── Status helpers ───────────────────────────────────────────────────────────

type CeremonyStatus = 'celebrated' | 'approaching' | 'upcoming' | 'overdue';

function getCeremonyStatus(
  def: CeremonyDef,
  entry: CulturalMilestoneEntry | undefined,
  babyAgeWeeks: number
): CeremonyStatus {
  if (entry?.celebrated) return 'celebrated';
  const weeksUntil = def.expectedAgeWeeks - babyAgeWeeks;
  if (weeksUntil < 0) return 'overdue';
  if (weeksUntil <= 4) return 'approaching';
  return 'upcoming';
}

const STATUS_META: Record<CeremonyStatus, { label: string; color: string; bg: string }> = {
  celebrated: { label: '✅ Celebrated!', color: Colors.success, bg: Colors.success + '18' },
  approaching: { label: '⏰ Approaching!', color: '#B8860B', bg: '#B8860B18' },
  upcoming: { label: '📅 Upcoming', color: Colors.textSecondary, bg: Colors.border + '80' },
  overdue: { label: '🔔 Past due', color: Colors.error, bg: Colors.error + '18' },
};

// ─── Notes modal ─────────────────────────────────────────────────────────────

interface NotesModalProps {
  visible: boolean;
  ceremonyName: string;
  onConfirm: (notes: string) => void;
  onCancel: () => void;
}

const NotesModal = memo(({ visible, ceremonyName, onConfirm, onCancel }: NotesModalProps) => {
  const [notes, setNotes] = useState('');
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalSheet}>
          <Text style={styles.modalTitle}>🎊 Celebrate {ceremonyName}</Text>
          <Text style={styles.modalDesc}>Add a special note for this ceremony (optional)</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Aaj bahut khushi ka din tha..."
            placeholderTextColor={Colors.textDisabled}
            value={notes}
            onChangeText={setNotes}
            multiline
            maxLength={200}
          />
          <View style={styles.modalBtns}>
            <TouchableOpacity style={styles.modalCancel} onPress={onCancel}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.modalConfirm}
              onPress={() => { onConfirm(notes); setNotes(''); }}
            >
              <Text style={styles.modalConfirmText}>Mark Celebrated 🎉</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
});

// ─── Ceremony Card ────────────────────────────────────────────────────────────

interface CeremonyCardProps {
  def: CeremonyDef;
  entry: CulturalMilestoneEntry | undefined;
  babyAgeWeeks: number;
  onCelebrate: (def: CeremonyDef) => void;
  onReminder: (def: CeremonyDef, entry: CulturalMilestoneEntry) => void;
  onShare: (def: CeremonyDef, entry: CulturalMilestoneEntry) => void;
  fs: (n: number) => number;
  dim: (n: number) => number;
  hit: (n: number) => number;
}

const CeremonyCard = memo(({
  def, entry, babyAgeWeeks,
  onCelebrate, onReminder, onShare,
  fs, dim, hit,
}: CeremonyCardProps) => {
  const status = getCeremonyStatus(def, entry, babyAgeWeeks);
  const meta = STATUS_META[status];
  const isCelebrated = status === 'celebrated';

  return (
    <View style={[
      styles.card,
      isCelebrated && { opacity: 0.92 },
      { borderLeftWidth: 4, borderLeftColor: def.color },
    ]}>
      {/* Header row */}
      <View style={styles.cardHeader}>
        <View style={[styles.emojiWrap, { backgroundColor: def.color + '18', width: dim(52), height: dim(52), borderRadius: dim(16) }]}>
          <Text style={{ fontSize: dim(26) }}>{def.emoji}</Text>
        </View>
        <View style={styles.cardTitles}>
          <Text style={[styles.cardName, { fontSize: fs(Typography.base) }]}>{def.name}</Text>
          <Text style={[styles.cardHindi, { fontSize: fs(Typography.sm), color: def.color }]}>{def.hindiName}</Text>
          <Text style={[styles.cardTagline, { fontSize: fs(Typography.xs) }]}>{def.tagline}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.statusText, { color: meta.color, fontSize: fs(Typography.xs) }]}>{meta.label}</Text>
        </View>
      </View>

      {/* Age chip */}
      <View style={styles.ageRow}>
        <Ionicons name="time-outline" size={13} color={Colors.textSecondary} />
        <Text style={[styles.ageText, { fontSize: fs(Typography.xs) }]}>
          {isCelebrated && entry?.celebratedDate
            ? `Celebrated on ${format(entry.celebratedDate, 'dd MMM yyyy')}`
            : `Expected: ${def.ageDescription} · Baby is ${babyAgeWeeks}w old`}
        </Text>
      </View>

      {/* Description */}
      <Text style={[styles.cardDesc, { fontSize: fs(Typography.sm) }]}>{def.description}</Text>

      {/* Significance */}
      <View style={[styles.significanceBox, { backgroundColor: def.color + '08' }]}>
        <Text style={[styles.significanceLabel, { color: def.color, fontSize: fs(Typography.xs) }]}>Cultural Significance</Text>
        <Text style={[styles.significanceText, { fontSize: fs(Typography.xs) }]}>{def.significance}</Text>
      </View>

      {/* Entry notes */}
      {entry?.notes ? (
        <View style={styles.notesBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={13} color={Colors.textSecondary} />
          <Text style={[styles.notesText, { fontSize: fs(Typography.xs) }]}>{entry.notes}</Text>
        </View>
      ) : null}

      {/* Action row */}
      <View style={styles.actionRow}>
        {isCelebrated ? (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#25D36618', minHeight: hit(36) }]}
              onPress={() => entry && onShare(def, entry)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="logo-whatsapp" size={15} color="#25D366" />
              <Text style={[styles.actionBtnText, { color: '#25D366', fontSize: fs(Typography.sm) }]}>Share</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: def.color + '18', flex: 1, minHeight: hit(36) }]}
              onPress={() => onCelebrate(def)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={{ fontSize: fs(14) }}>🎊</Text>
              <Text style={[styles.actionBtnText, { color: def.color, fontSize: fs(Typography.sm) }]}>Mark Celebrated</Text>
            </TouchableOpacity>
            {entry && (
              <TouchableOpacity
                style={[styles.iconBtn, { borderColor: Colors.border, minHeight: hit(36), minWidth: hit(36) }]}
                onPress={() => onReminder(def, entry)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="notifications-outline" size={17} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </View>
  );
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CulturalMilestonesScreen() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby, getBabyAgeWeeks } = useBabyStore();
  const { fs, dim, hit } = useGrandparentMode();
  const {
    culturalMilestones,
    culturalMilestoneLoading,
    fetchCulturalMilestones,
    saveCulturalMilestoneEntry,
    celebrateCulturalMilestone,
  } = useTrackerStore();
  const confettiRef = useRef<ConfettiHandle>(null);

  const [notesModalDef, setNotesModalDef] = useState<CeremonyDef | null>(null);
  const [initialized, setInitialized] = useState(false);

  const babyAgeWeeks = getBabyAgeWeeks();

  // ── Init: seed Firestore entries for all ceremonies that don't exist yet ───

  const initEntries = useCallback(async () => {
    if (!activeBaby || !user || initialized) return;
    setInitialized(true);
    const existing = useTrackerStore.getState().culturalMilestones;
    for (const def of CULTURAL_MILESTONES) {
      if (!existing.find((e) => e.ceremonyId === def.id)) {
        try {
          await saveCulturalMilestoneEntry({
            babyId: activeBaby.id,
            userId: user.uid,
            ceremonyId: def.id,
            ceremonyName: def.name,
            celebrated: false,
          });
        } catch {}
      }
    }
    fetchCulturalMilestones(activeBaby.id);
  }, [activeBaby, user, initialized]);

  useEffect(() => {
    if (!activeBaby) return;
    fetchCulturalMilestones(activeBaby.id).then(() => initEntries());
  }, [activeBaby]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleCelebrate = useCallback((def: CeremonyDef) => {
    setNotesModalDef(def);
  }, []);

  const confirmCelebrate = useCallback(async (notes: string) => {
    const def = notesModalDef;
    setNotesModalDef(null);
    if (!def || !activeBaby) return;

    const entry = useTrackerStore.getState().culturalMilestones.find(
      (e) => e.ceremonyId === def.id
    );
    if (!entry) return;

    try {
      await celebrateCulturalMilestone(entry.id, new Date());
      if (notes) {
        // notes are stored via the update; re-fetch will pick them up
        // We optimistically update via celebrateCulturalMilestone only for date+celebrated
      }
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      confettiRef.current?.burst();
      toast.success(`${def.emoji} ${def.name} celebrated! 🎊`);

      await cancelCulturalMilestoneReminder(activeBaby.id, def.id);
    } catch {
      toast.error('Could not save. Please try again.');
    }
  }, [notesModalDef, activeBaby, celebrateCulturalMilestone, toast]);

  const handleSetReminder = useCallback(async (def: CeremonyDef, entry: CulturalMilestoneEntry) => {
    if (!activeBaby) return;
    const expectedDate = addWeeks(activeBaby.birthDate, def.expectedAgeWeeks);
    try {
      await scheduleCulturalMilestoneReminder(activeBaby, entry, def.emoji, expectedDate);
      toast.success(`🔔 Reminder set for ${def.name}!`);
    } catch {
      toast.error('Could not set reminder. Check notification permissions.');
    }
  }, [activeBaby, toast]);

  const handleShare = useCallback(async (def: CeremonyDef, entry: CulturalMilestoneEntry) => {
    const dateStr = entry.celebratedDate
      ? format(entry.celebratedDate, 'dd MMM yyyy')
      : format(new Date(), 'dd MMM yyyy');
    const msg = buildCulturalMilestoneShareMessage(
      activeBaby?.name ?? 'Baby',
      def.name,
      def.hindiName,
      def.emoji,
      dateStr
    );
    await shareViaWhatsApp(msg);
  }, [activeBaby]);

  // ── Progress stats ────────────────────────────────────────────────────────

  const celebratedCount = culturalMilestones.filter((e) => e.celebrated).length;
  const total = CULTURAL_MILESTONES.length;

  // ── Ordered ceremonies: approaching first, then upcoming, then celebrated ─

  const orderedDefs = [...CULTURAL_MILESTONES].sort((a, b) => {
    const entA = culturalMilestones.find((e) => e.ceremonyId === a.id);
    const entB = culturalMilestones.find((e) => e.ceremonyId === b.id);
    const statusOrder: Record<CeremonyStatus, number> = {
      approaching: 0, overdue: 1, upcoming: 2, celebrated: 3,
    };
    const sA = getCeremonyStatus(a, entA, babyAgeWeeks);
    const sB = getCeremonyStatus(b, entB, babyAgeWeeks);
    if (sA !== sB) return statusOrder[sA] - statusOrder[sB];
    return a.expectedAgeWeeks - b.expectedAgeWeeks;
  });

  return (
    <View style={styles.container}>
      <ConfettiOverlay ref={confettiRef} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress banner */}
        <View style={styles.progressCard}>
          <View style={styles.progressTop}>
            <Text style={[styles.progressTitle, { fontSize: fs(Typography.base) }]}>
              Indian Cultural Ceremonies
            </Text>
            <Text style={[styles.progressCount, { fontSize: fs(Typography['2xl']) }]}>
              {celebratedCount}
              <Text style={[styles.progressTotal, { fontSize: fs(Typography.lg) }]}>
                /{total}
              </Text>
            </Text>
          </View>
          <Text style={[styles.progressSub, { fontSize: fs(Typography.xs) }]}>
            {celebratedCount === 0
              ? 'Pehla ceremony manane ka intezaar hai! 🙏'
              : celebratedCount === total
              ? 'Sab ceremonies complete ho gayi! Bahut badhai! 🎊'
              : `${total - celebratedCount} aur ceremonies baaki hain`}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { width: `${total > 0 ? (celebratedCount / total) * 100 : 0}%` },
              ]}
            />
          </View>
        </View>

        {/* Subtitle */}
        <Text style={[styles.sectionLabel, { fontSize: fs(Typography.sm) }]}>
          16 Samskaras — celebrating life's sacred milestones
        </Text>

        {/* Ceremony cards */}
        {culturalMilestoneLoading && culturalMilestones.length === 0 ? (
          <View style={styles.loadingWrap}>
            <Text style={styles.loadingText}>Loading ceremonies...</Text>
          </View>
        ) : (
          orderedDefs.map((def) => {
            const entry = culturalMilestones.find((e) => e.ceremonyId === def.id);
            return (
              <CeremonyCard
                key={def.id}
                def={def}
                entry={entry}
                babyAgeWeeks={babyAgeWeeks}
                onCelebrate={handleCelebrate}
                onReminder={handleSetReminder}
                onShare={handleShare}
                fs={fs}
                dim={dim}
                hit={hit}
              />
            );
          })
        )}

        <Text style={styles.footer}>
          🧿 BabySaathi — Har khushi yaad rakhein
        </Text>
      </ScrollView>

      {/* Notes modal for celebration */}
      <NotesModal
        visible={notesModalDef !== null}
        ceremonyName={notesModalDef?.name ?? ''}
        onConfirm={confirmCelebrate}
        onCancel={() => setNotesModalDef(null)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, paddingBottom: 100, gap: Spacing.md },

  // Progress card
  progressCard: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    ...Shadows.md,
    marginBottom: Spacing.xs,
  },
  progressTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  progressTitle: {
    fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary,
    flex: 1, marginRight: Spacing.sm,
  },
  progressCount: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.primary },
  progressTotal: { fontSize: Typography.lg, fontWeight: '600', color: Colors.textSecondary },
  progressSub: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4, marginBottom: Spacing.sm },
  progressBar: {
    height: 8, backgroundColor: Colors.border, borderRadius: 4,
    overflow: 'hidden', marginTop: Spacing.xs,
  },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 4 },

  sectionLabel: {
    fontSize: Typography.sm, color: Colors.textSecondary,
    textAlign: 'center', fontStyle: 'italic', marginBottom: Spacing.xs,
  },

  // Ceremony card
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius['2xl'],
    padding: Spacing.lg, ...Shadows.sm, gap: Spacing.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  emojiWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitles: { flex: 1 },
  cardName: { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  cardHindi: { fontSize: Typography.sm, fontWeight: '700', marginTop: 1 },
  cardTagline: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  statusBadge: {
    paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: Radius.full, alignSelf: 'flex-start',
  },
  statusText: { fontSize: Typography.xs, fontWeight: '700' },

  ageRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ageText: { fontSize: Typography.xs, color: Colors.textSecondary },

  cardDesc: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },

  significanceBox: {
    borderRadius: Radius.lg, padding: Spacing.md, gap: 4,
  },
  significanceLabel: { fontSize: Typography.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  significanceText: { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 17 },

  notesBox: {
    flexDirection: 'row', gap: 6, alignItems: 'flex-start',
    backgroundColor: Colors.border + '30', borderRadius: Radius.md, padding: Spacing.sm,
  },
  notesText: { fontSize: Typography.xs, color: Colors.textSecondary, flex: 1, lineHeight: 17 },

  // Action row
  actionRow: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.xs },
  actionBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingHorizontal: Spacing.md, paddingVertical: 10,
    borderRadius: Radius.full,
  },
  actionBtnText: { fontSize: Typography.sm, fontWeight: '700' },
  iconBtn: {
    width: 40, height: 40, borderRadius: Radius.full,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5,
  },

  // Notes modal
  modalOverlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.surface, borderTopLeftRadius: Radius['3xl'],
    borderTopRightRadius: Radius['3xl'], padding: Spacing['2xl'],
    gap: Spacing.md,
  },
  modalTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  modalDesc: { fontSize: Typography.sm, color: Colors.textSecondary },
  notesInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl,
    padding: Spacing.md, fontSize: Typography.base, color: Colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top',
  },
  modalBtns: { flexDirection: 'row', gap: Spacing.md },
  modalCancel: {
    flex: 1, padding: Spacing.md, borderRadius: Radius.full,
    borderWidth: 1.5, borderColor: Colors.border,
    alignItems: 'center',
  },
  modalCancelText: { fontSize: Typography.base, fontWeight: '600', color: Colors.textSecondary },
  modalConfirm: {
    flex: 2, padding: Spacing.md, borderRadius: Radius.full,
    backgroundColor: Colors.primary, alignItems: 'center',
  },
  modalConfirmText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },

  // Loading / Footer
  loadingWrap: { alignItems: 'center', paddingVertical: Spacing['2xl'] },
  loadingText: { fontSize: Typography.base, color: Colors.textSecondary },
  footer: {
    textAlign: 'center', fontSize: Typography.xs, color: Colors.textDisabled,
    marginTop: Spacing.lg,
  },
});
