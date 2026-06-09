import React, { useEffect, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { SkeletonListItem, EmptyState } from '@components/common/index';
import { useRefresh } from '@hooks/useRefresh';
import { DiaperEntry, DiaperType } from '@types/index';

const DIAPER_OPTIONS: { type: DiaperType; icon: string; label: string; color: string }[] = [
  { type: 'wet', icon: '💧', label: 'Wet', color: Colors.diaperColor },
  { type: 'dirty', icon: '💩', label: 'Dirty', color: Colors.warning },
  { type: 'mixed', icon: '🔄', label: 'Mixed', color: Colors.accent },
  { type: 'dry', icon: '✅', label: 'Dry', color: Colors.success },
];

const DiaperItem = memo(({ item }: { item: DiaperEntry }) => {
  const opt = DIAPER_OPTIONS.find((o) => o.type === item.type) ?? DIAPER_OPTIONS[0];
  return (
    <View style={styles.diaperItem}>
      <View style={[styles.dot, { backgroundColor: opt.color }]} />
      <View style={styles.itemInfo}>
        <Text style={styles.itemType}>{opt.icon} {opt.label} Diaper</Text>
        <Text style={styles.itemTime}>{format(item.time, 'hh:mm a')}</Text>
      </View>
      <View style={[styles.itemBadge, { backgroundColor: opt.color + '20' }]}>
        <Text style={[styles.itemBadgeText, { color: opt.color }]}>{opt.icon}</Text>
      </View>
    </View>
  );
});

export default function DiaperTrackerScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();
  const { diapers, todayDiapers, addDiaper: logDiaper, fetchTodayDiapers, diaperLoading } = useTrackerStore();

  const loadDiapers = useCallback(async () => {
    if (activeBaby) await fetchTodayDiapers(activeBaby.id);
  }, [activeBaby]);

  useEffect(() => { loadDiapers(); }, [loadDiapers]);

  const { refreshing, refresh } = useRefresh(loadDiapers);

  const handleLog = async (type: DiaperType) => {
    if (!activeBaby || !user) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await logDiaper({ babyId: activeBaby.id, userId: user.uid, time: new Date(), type });
      const opt = DIAPER_OPTIONS.find((o) => o.type === type)!;
      toast.success(`${opt.icon} ${opt.label} diaper logged!`);
    } catch {
      toast.error('Failed to log diaper. Please try again.');
    }
  };

  const wetCount = todayDiapers.filter((d) => d.type === 'wet' || d.type === 'mixed').length;
  const dirtyCount = todayDiapers.filter((d) => d.type === 'dirty' || d.type === 'mixed').length;

  const renderItem = useCallback(({ item }: ListRenderItemInfo<DiaperEntry>) => (
    <DiaperItem item={item} />
  ), []);

  const keyExtractor = useCallback((item: DiaperEntry) => item.id, []);

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Summary */}
      <LinearGradient colors={[Colors.diaperColor + '25', Colors.diaperColor + '05']} style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today's Summary</Text>
        <View style={styles.statsRow}>
          {[
            { value: todayDiapers.length, label: 'Total', color: Colors.diaperColor },
            { value: wetCount, label: 'Wet 💧', color: Colors.diaperColor },
            { value: dirtyCount, label: 'Dirty 💩', color: Colors.warning },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.statDivider} />}
              <View style={styles.statItem}>
                <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
        {todayDiapers.length < 4 && (
          <View style={styles.alertBanner}>
            <Text style={styles.alertText}>
              {todayDiapers.length === 0
                ? '⚠️ No diapers logged today. Normal for infants: 6–8 changes/day.'
                : `Tip: ${6 - Math.min(todayDiapers.length, 6)} more changes expected for a healthy day.`}
            </Text>
          </View>
        )}
      </LinearGradient>

      {/* Quick Log Grid */}
      <Text style={styles.sectionTitle}>Quick Log</Text>
      <View style={styles.diaperGrid}>
        {DIAPER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.type}
            style={styles.diaperBtn}
            onPress={() => handleLog(option.type)}
            activeOpacity={0.7}
          >
            <LinearGradient colors={[option.color + '28', option.color + '0C']} style={styles.diaperBtnGradient}>
              <Text style={styles.diaperIcon}>{option.icon}</Text>
              <Text style={[styles.diaperLabel, { color: option.color }]}>{option.label}</Text>
              <Text style={styles.diaperTap}>Tap to log</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionTitle}>Today's Changes</Text>

      {diaperLoading && todayDiapers.length === 0 && (
        <>
          <SkeletonListItem />
          <SkeletonListItem />
        </>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={diaperLoading && todayDiapers.length === 0 ? [] : [...todayDiapers].reverse()}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        diaperLoading ? null : (
          <EmptyState emoji="👶" title="No diaper changes yet" subtitle="Tap any button above to quickly log a diaper change" />
        )
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={refresh}
      refreshing={refreshing}
      removeClippedSubviews
      maxToRenderPerBatch={15}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.xl, paddingBottom: 100 },
  listHeader: { gap: Spacing.lg, marginBottom: Spacing.md },
  summaryCard: { borderRadius: Radius['2xl'], padding: Spacing.lg },
  summaryTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statItem: { flex: 1, alignItems: 'center' },
  statValue: { fontSize: Typography.xl, fontWeight: '800' },
  statLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  statDivider: { width: 1, backgroundColor: Colors.border },
  alertBanner: { marginTop: Spacing.md, backgroundColor: Colors.warning + '20', borderRadius: Radius.lg, padding: Spacing.md },
  alertText: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 18 },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  diaperGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  diaperBtn: { flex: 1, minWidth: '44%', borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadows.sm },
  diaperBtnGradient: { padding: Spacing.lg, alignItems: 'center', gap: 6 },
  diaperIcon: { fontSize: 36 },
  diaperLabel: { fontSize: Typography.base, fontWeight: '700' },
  diaperTap: { fontSize: Typography.xs, color: Colors.textSecondary },
  diaperItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  itemInfo: { flex: 1 },
  itemType: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  itemTime: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  itemBadge: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemBadgeText: { fontSize: 18 },
});
