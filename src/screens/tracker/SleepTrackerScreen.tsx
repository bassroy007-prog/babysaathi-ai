import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
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
import { SleepEntry } from '@types/index';

const SleepItem = memo(({ item }: { item: SleepEntry }) => (
  <View style={styles.sleepItem}>
    <View style={styles.sleepItemIcon}>
      <Text>🌙</Text>
    </View>
    <View style={styles.sleepItemInfo}>
      <Text style={styles.sleepItemTitle}>
        {format(item.startTime, 'hh:mm a')}
        {item.endTime ? ` → ${format(item.endTime, 'hh:mm a')}` : ' → ongoing'}
      </Text>
      <Text style={styles.sleepItemDate}>{format(item.startTime, 'EEE, dd MMM')}</Text>
    </View>
    {item.duration != null && (
      <Text style={styles.sleepDuration}>
        {Math.floor(item.duration / 60)}h {item.duration % 60}m
      </Text>
    )}
  </View>
));

export default function SleepTrackerScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();
  const {
    sleepEntries, activeSleep, startSleep, stopSleep,
    fetchSleep, sleepLoading, getTodaySleepHours,
  } = useTrackerStore();

  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadSleep = useCallback(async () => {
    if (activeBaby) await fetchSleep(activeBaby.id);
  }, [activeBaby]);

  useEffect(() => { loadSleep(); }, [loadSleep]);

  const { refreshing, refresh } = useRefresh(loadSleep);

  useEffect(() => {
    if (activeSleep) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - activeSleep.startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeSleep]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    if (!activeBaby || !user) return;
    try {
      await startSleep({ babyId: activeBaby.id, userId: user.uid, startTime: new Date(), autoDetected: false });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('😴 Sleep session started!');
    } catch {
      toast.error('Failed to start sleep session.');
    }
  };

  const handleStop = async () => {
    if (!activeSleep) return;
    try {
      await stopSleep(activeSleep.id, new Date());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('☀️ Sleep session saved!');
    } catch {
      toast.error('Failed to save sleep session.');
    }
  };

  const todayHours = getTodaySleepHours();
  const recentSleep = sleepEntries.slice(0, 10);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<SleepEntry>) => (
    <SleepItem item={item} />
  ), []);

  const keyExtractor = useCallback((item: SleepEntry) => item.id, []);

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Summary */}
      <LinearGradient colors={[Colors.sleepColor + '25', Colors.sleepColor + '05']} style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          {[
            { value: todayHours, label: 'Hours Today' },
            { value: recentSleep.length, label: 'Sessions' },
            { value: 16 - todayHours > 0 ? (16 - todayHours).toFixed(1) : '0', label: 'Hrs Remaining' },
          ].map((s, i) => (
            <React.Fragment key={s.label}>
              {i > 0 && <View style={styles.summaryDivider} />}
              <View style={styles.summaryItem}>
                <Text style={styles.summaryValue}>{s.value}</Text>
                <Text style={styles.summaryLabel}>{s.label}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
        <View style={styles.sleepGoalBar}>
          <Text style={styles.sleepGoalText}>Daily Goal: 16 hours</Text>
          <View style={styles.goalProgress}>
            <View style={[styles.goalFill, { width: `${Math.min((todayHours / 16) * 100, 100)}%` }]} />
          </View>
        </View>
      </LinearGradient>

      {/* Timer */}
      <View style={styles.timerCard}>
        {activeSleep ? (
          <View style={styles.timerActive}>
            <View style={styles.sleepingIcon}>
              <Text style={{ fontSize: 48 }}>😴</Text>
            </View>
            <Text style={styles.timerLabel}>Baby is sleeping...</Text>
            <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
            <Text style={styles.timerSince}>Since {format(activeSleep.startTime, 'hh:mm a')}</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleStop}>
              <LinearGradient colors={[Colors.sleepColor, '#448AFF']} style={styles.actionBtnGradient}>
                <Text style={styles.actionBtnText}>{t('tracker.stopSleep')} ☀️</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.timerIdle}>
            <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>🌙</Text>
            <Text style={styles.timerIdleText}>Track baby's sleep</Text>
            <Text style={styles.timerIdleSubtext}>Tap when baby falls asleep</Text>
            <TouchableOpacity style={styles.actionBtn} onPress={handleStart}>
              <LinearGradient colors={[Colors.sleepColor, '#448AFF']} style={styles.actionBtnGradient}>
                <Text style={styles.actionBtnText}>{t('tracker.startSleep')} 😴</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={styles.sectionTitle}>Sleep History</Text>

      {sleepLoading && recentSleep.length === 0 && (
        <>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={sleepLoading && recentSleep.length === 0 ? [] : recentSleep}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        sleepLoading ? null : (
          <EmptyState emoji="🌙" title="No sleep entries yet" subtitle="Tap the button above when baby falls asleep" />
        )
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={refresh}
      refreshing={refreshing}
      removeClippedSubviews
      maxToRenderPerBatch={12}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.xl, paddingBottom: 100 },
  listHeader: { gap: Spacing.lg, marginBottom: Spacing.md },
  summaryCard: { borderRadius: Radius['2xl'], padding: Spacing.lg },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.lg },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryValue: { fontSize: Typography.xl, fontWeight: '800', color: Colors.sleepColor },
  summaryLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  summaryDivider: { width: 1, backgroundColor: Colors.border },
  sleepGoalBar: { gap: 6 },
  sleepGoalText: { fontSize: Typography.sm, color: Colors.textSecondary },
  goalProgress: { height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  goalFill: { height: '100%', backgroundColor: Colors.sleepColor, borderRadius: 4 },
  timerCard: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.xl, alignItems: 'center', ...Shadows.md },
  timerActive: { alignItems: 'center', gap: Spacing.sm, width: '100%' },
  sleepingIcon: { width: 80, height: 80, borderRadius: 24, backgroundColor: Colors.sleepColor + '20', alignItems: 'center', justifyContent: 'center' },
  timerLabel: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  timerDisplay: { fontSize: 48, fontWeight: '800', color: Colors.sleepColor },
  timerSince: { fontSize: Typography.sm, color: Colors.textSecondary },
  timerIdle: { alignItems: 'center', gap: Spacing.sm, width: '100%' },
  timerIdleText: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  timerIdleSubtext: { fontSize: Typography.base, color: Colors.textSecondary },
  actionBtn: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.md },
  actionBtnGradient: { height: 50, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  sleepItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  sleepItemIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: Colors.sleepColor + '20', alignItems: 'center', justifyContent: 'center' },
  sleepItemInfo: { flex: 1 },
  sleepItemTitle: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  sleepItemDate: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  sleepDuration: { fontSize: Typography.base, fontWeight: '700', color: Colors.sleepColor },
});
