import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { SkeletonListItem, EmptyState } from '@components/common/index';
import { useRefresh } from '@hooks/useRefresh';
import { FeedType, BreastSide, FeedEntry } from '@types/index';

// Memoized feed list item for performance
const FeedItem = memo(({ item }: { item: FeedEntry }) => (
  <View style={styles.feedItem}>
    <View style={[styles.feedDot, { backgroundColor: Colors.feedColor }]} />
    <View style={styles.feedInfo}>
      <Text style={styles.feedType}>
        {item.type === 'breastfeed'
          ? `🤱 Breastfeed${item.side ? ` (${item.side})` : ''}`
          : item.type === 'formula'
          ? `🍼 Formula${item.amount ? ` — ${item.amount}ml` : ''}`
          : `🥣 Solid — ${item.foodType || 'food'}`}
      </Text>
      <Text style={styles.feedTime}>{format(item.startTime, 'hh:mm a')}</Text>
    </View>
    {item.duration != null && (
      <View style={styles.durationBadge}>
        <Text style={styles.durationText}>{item.duration} min</Text>
      </View>
    )}
  </View>
));

export default function FeedTrackerScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();
  const { feeds, activeFeed, startFeed, stopFeed, fetchFeeds, feedLoading } = useTrackerStore();

  const [feedType, setFeedType] = useState<FeedType>('breastfeed');
  const [side, setSide] = useState<BreastSide>('left');
  const [amount, setAmount] = useState('');
  const [brand, setBrand] = useState('');
  const [foodType, setFoodType] = useState('');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const loadFeeds = useCallback(async () => {
    if (activeBaby) await fetchFeeds(activeBaby.id);
  }, [activeBaby]);

  useEffect(() => { loadFeeds(); }, [loadFeeds]);

  const { refreshing, refresh } = useRefresh(loadFeeds);

  useEffect(() => {
    if (activeFeed) {
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - activeFeed.startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsedSeconds(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [activeFeed]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleStart = async () => {
    if (!activeBaby || !user) return;
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await startFeed({
        babyId: activeBaby.id,
        userId: user.uid,
        type: feedType,
        startTime: new Date(),
        side: feedType === 'breastfeed' ? side : undefined,
        amount: feedType === 'formula' ? parseFloat(amount) || undefined : undefined,
        brand: feedType === 'formula' ? brand.trim() || undefined : undefined,
        foodType: feedType === 'solid' ? foodType.trim() || undefined : undefined,
      });
      toast.success('Feed session started!');
    } catch {
      toast.error('Failed to start feed. Please try again.');
    }
  };

  const handleStop = async () => {
    if (!activeFeed) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      await stopFeed(activeFeed.id, new Date());
      toast.success(`Feed logged — ${formatTime(elapsedSeconds)}`);
    } catch {
      toast.error('Failed to save feed. Please try again.');
    }
  };

  const renderFeedItem = useCallback(({ item }: ListRenderItemInfo<FeedEntry>) => (
    <FeedItem item={item} />
  ), []);

  const keyExtractor = useCallback((item: FeedEntry) => item.id, []);

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Feed Type Selector */}
      <View style={styles.typeSelector}>
        {(['breastfeed', 'formula', 'solid'] as FeedType[]).map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, feedType === type && styles.typeBtnActive]}
            onPress={async () => {
              setFeedType(type);
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Text style={styles.typeIcon}>{type === 'breastfeed' ? '🤱' : type === 'formula' ? '🍼' : '🥣'}</Text>
            <Text style={[styles.typeBtnText, feedType === type && styles.typeBtnTextActive]}>
              {t(`tracker.${type}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Timer Card */}
      <View style={styles.timerCard}>
        <LinearGradient colors={[Colors.feedColor + '20', Colors.feedColor + '05']} style={styles.timerGradient}>
          {activeFeed ? (
            <View style={styles.timerActive}>
              <Text style={styles.timerLabel}>Currently Feeding 🤱</Text>
              <Text style={styles.timerDisplay}>{formatTime(elapsedSeconds)}</Text>
              <Text style={styles.timerSubtext}>
                {feedType === 'breastfeed' ? `Side: ${activeFeed.side}` : 'In progress...'}
              </Text>
              <TouchableOpacity style={styles.actionBtn} onPress={handleStop}>
                <LinearGradient colors={[Colors.feedColor, Colors.primary]} style={styles.actionGradient}>
                  <Ionicons name="stop-circle" size={22} color="#fff" />
                  <Text style={styles.actionText}>{t('tracker.stopFeeding')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.timerIdle}>
              <Text style={styles.timerIdleEmoji}>🍼</Text>
              <Text style={styles.timerIdleText}>Ready to track a feeding session</Text>
            </View>
          )}
        </LinearGradient>
      </View>

      {/* Options */}
      {!activeFeed && (
        <View style={styles.optionsCard}>
          {feedType === 'breastfeed' && (
            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>Which side?</Text>
              <View style={styles.sideRow}>
                {(['left', 'right', 'both'] as BreastSide[]).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sideBtn, side === s && styles.sideBtnActive]}
                    onPress={() => setSide(s)}
                  >
                    <Text style={[styles.sideBtnText, side === s && styles.sideBtnTextActive]}>
                      {s === 'left' ? '◀ ' + t('tracker.leftSide') : s === 'right' ? t('tracker.rightSide') + ' ▶' : '↔ ' + t('tracker.both')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {feedType === 'formula' && (
            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>{t('tracker.amount')} (ml)</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={amount} onChangeText={setAmount} placeholder="120" placeholderTextColor={Colors.textDisabled} keyboardType="numeric" />
                <Text style={styles.inputUnit}>ml</Text>
              </View>
              <Text style={[styles.optionLabel, { marginTop: Spacing.sm }]}>{t('tracker.brand')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={brand} onChangeText={setBrand} placeholder="e.g., Nan, Similac" placeholderTextColor={Colors.textDisabled} />
              </View>
            </View>
          )}

          {feedType === 'solid' && (
            <View style={styles.optionGroup}>
              <Text style={styles.optionLabel}>{t('tracker.foodType')}</Text>
              <View style={styles.inputWrapper}>
                <TextInput style={styles.input} value={foodType} onChangeText={setFoodType} placeholder="e.g., Rice, Banana, Dal" placeholderTextColor={Colors.textDisabled} />
              </View>
            </View>
          )}

          <TouchableOpacity style={styles.actionBtn} onPress={handleStart}>
            <LinearGradient colors={[Colors.feedColor, Colors.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.actionGradient}>
              <Ionicons name="play-circle" size={22} color="#fff" />
              <Text style={styles.actionText}>{t('tracker.startFeeding')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      <Text style={styles.sectionTitle}>Recent Feeds</Text>

      {feedLoading && feeds.length === 0 && (
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
      data={feedLoading && feeds.length === 0 ? [] : feeds.slice(0, 20)}
      renderItem={renderFeedItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        feedLoading ? null : (
          <EmptyState
            emoji="🍼"
            title="No feeds logged yet"
            subtitle="Tap 'Start Feeding' above to log your first session"
          />
        )
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={refresh}
      refreshing={refreshing}
      removeClippedSubviews
      maxToRenderPerBatch={10}
      windowSize={5}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.xl, gap: Spacing.lg, paddingBottom: 100 },
  listHeader: { gap: Spacing.lg, marginBottom: Spacing.md },
  typeSelector: { flexDirection: 'row', backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl, padding: 4, gap: 4 },
  typeBtn: { flex: 1, alignItems: 'center', paddingVertical: Spacing.sm, borderRadius: Radius.lg, gap: 4 },
  typeBtnActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  typeIcon: { fontSize: 18 },
  typeBtnText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  typeBtnTextActive: { color: Colors.feedColor },
  timerCard: { borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadows.md },
  timerGradient: { padding: Spacing.xl, alignItems: 'center' },
  timerActive: { alignItems: 'center', gap: Spacing.sm, width: '100%' },
  timerLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  timerDisplay: { fontSize: 52, fontWeight: '800', color: Colors.feedColor, fontVariant: ['tabular-nums'] },
  timerSubtext: { fontSize: Typography.sm, color: Colors.textSecondary },
  timerIdle: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.lg },
  timerIdleEmoji: { fontSize: 40 },
  timerIdleText: { fontSize: Typography.base, color: Colors.textSecondary },
  optionsCard: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, gap: Spacing.md, ...Shadows.sm },
  optionGroup: { gap: Spacing.sm },
  optionLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  sideRow: { flexDirection: 'row', gap: Spacing.sm },
  sideBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border },
  sideBtnActive: { borderColor: Colors.feedColor, backgroundColor: Colors.feedColor + '15' },
  sideBtnText: { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  sideBtnTextActive: { color: Colors.feedColor },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.surfaceVariant, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, height: 48 },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  inputUnit: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  actionBtn: { borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.sm },
  actionGradient: { height: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  actionText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  feedItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  feedDot: { width: 10, height: 10, borderRadius: 5 },
  feedInfo: { flex: 1 },
  feedType: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  feedTime: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  durationBadge: { backgroundColor: Colors.feedColor + '20', paddingHorizontal: 10, paddingVertical: 4, borderRadius: Radius.full },
  durationText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.feedColor },
});
