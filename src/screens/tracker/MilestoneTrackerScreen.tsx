import React, { useEffect, useState, useCallback, memo, useMemo, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView, Alert, ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import ConfettiOverlay, { ConfettiHandle } from '@components/common/ConfettiOverlay';
import { shareViaWhatsApp, buildMilestoneShareMessage } from '@utils/share';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { SkeletonListItem, EmptyState } from '@components/common/index';
import { useRefresh } from '@hooks/useRefresh';
import { MILESTONE_DEFINITIONS } from '@constants/index';
import { MilestoneCategory } from '@types/index';
import { addMilestone } from '@services/firebase/firestore';

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  physical: Colors.feedColor,
  social: Colors.primary,
  language: Colors.secondary,
  cognitive: Colors.growthColor,
};

const CATEGORY_EMOJIS: Record<MilestoneCategory, string> = {
  physical: '🤸',
  social: '😊',
  language: '💬',
  cognitive: '🧠',
};

type ListItem =
  | { _type: 'sectionHeader'; title: string }
  | { _type: 'milestone'; id: string; milestone: any };

const MilestoneItem = memo(({ item, babyAgeWeeks, onAchieve, babyName }: {
  item: any;
  babyAgeWeeks: number;
  onAchieve: (id: string, title: string) => void;
  babyName: string;
}) => {
  const color = CATEGORY_COLORS[item.category as MilestoneCategory];
  const isApproaching = item.expectedAgeWeeks <= babyAgeWeeks + 4;
  const isDone = item.achieved;

  if (isDone) {
    return (
      <View style={[styles.milestoneCard, styles.milestoneAchieved]}>
        <View style={[styles.milestoneIconBg, { backgroundColor: Colors.success + '20' }]}>
          <Text style={styles.milestoneIconEmoji}>🏆</Text>
        </View>
        <View style={styles.milestoneInfo}>
          <Text style={styles.milestoneTitle}>{item.title}</Text>
          {item.achievedDate && (
            <Text style={styles.achievedDate}>
              Achieved: {format(item.achievedDate, 'dd MMM yyyy')}
            </Text>
          )}
          <TouchableOpacity
            style={styles.shareInline}
            onPress={() =>
              shareViaWhatsApp(
                buildMilestoneShareMessage(
                  babyName,
                  item.title,
                  item.achievedDate ? format(item.achievedDate, 'dd MMM yyyy') : 'Aaj'
                )
              )
            }
          >
            <Ionicons name="logo-whatsapp" size={13} color="#25D366" />
            <Text style={styles.shareInlineText}>Share</Text>
          </TouchableOpacity>
        </View>
        <Ionicons name="checkmark-circle" size={28} color={Colors.success} />
      </View>
    );
  }

  return (
    <View style={[styles.milestoneCard, isApproaching && { borderColor: color + '50', borderWidth: 1.5 }]}>
      <View style={[styles.milestoneIconBg, { backgroundColor: color + '20' }]}>
        <Text style={styles.milestoneIconEmoji}>{CATEGORY_EMOJIS[item.category as MilestoneCategory]}</Text>
      </View>
      <View style={styles.milestoneInfo}>
        <Text style={styles.milestoneTitle}>{item.title}</Text>
        <Text style={styles.milestoneDesc}>Expected at {item.expectedAgeWeeks} weeks</Text>
        {isApproaching && (
          <View style={[styles.approachingBadge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.approachingText, { color }]}>Approaching soon!</Text>
          </View>
        )}
      </View>
      <TouchableOpacity
        style={[styles.achieveBtn, { backgroundColor: color }]}
        onPress={() => onAchieve(item.id, item.title)}
      >
        <Ionicons name="checkmark" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );
});

export default function MilestoneTrackerScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby, getBabyAgeWeeks } = useBabyStore();
  const { milestones, fetchMilestones, markMilestoneAchieved, milestoneLoading } = useTrackerStore();
  const [activeCategory, setActiveCategory] = useState<MilestoneCategory | 'all'>('all');
  const [initialized, setInitialized] = useState(false);
  const confettiRef = useRef<ConfettiHandle>(null);

  const babyAgeWeeks = getBabyAgeWeeks();

  const loadMilestones = useCallback(async () => {
    if (activeBaby) await fetchMilestones(activeBaby.id);
  }, [activeBaby]);

  useEffect(() => {
    if (activeBaby) {
      fetchMilestones(activeBaby.id);
      initializeMilestones();
    }
  }, [activeBaby]);

  const { refreshing, refresh } = useRefresh(loadMilestones);

  const initializeMilestones = async () => {
    if (!activeBaby || !user || initialized) return;
    for (const def of MILESTONE_DEFINITIONS) {
      if (!milestones.find((m) => m.title === def.title)) {
        try {
          await addMilestone({
            babyId: activeBaby.id,
            category: def.category as MilestoneCategory,
            title: def.title,
            description: `Expected at ${def.expectedAgeWeeks} weeks`,
            expectedAgeWeeks: def.expectedAgeWeeks,
            achieved: false,
            photoURLs: [],
            videoURLs: [],
            tags: [],
          } as any);
        } catch {}
      }
    }
    setInitialized(true);
    fetchMilestones(activeBaby.id);
  };

  const handleAchieve = useCallback((id: string, title: string) => {
    Alert.alert(
      '🎉 Celebrate!',
      `Mark "${title}" as achieved today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes!',
          onPress: async () => {
            try {
              await markMilestoneAchieved(id, new Date());
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              confettiRef.current?.burst();
              toast.success(`🏆 "${title}" milestone achieved!`);
            } catch {
              toast.error('Failed to save milestone. Please try again.');
            }
          },
        },
      ]
    );
  }, [markMilestoneAchieved, toast]);

  const categories: (MilestoneCategory | 'all')[] = ['all', 'physical', 'social', 'language', 'cognitive'];

  const filteredMilestones = activeCategory === 'all'
    ? milestones
    : milestones.filter((m) => m.category === activeCategory);

  const achieved = filteredMilestones.filter((m) => m.achieved);
  const pending = filteredMilestones.filter((m) => !m.achieved);

  const listData = useMemo((): ListItem[] => {
    const items: ListItem[] = [];
    if (pending.length > 0) {
      items.push({ _type: 'sectionHeader', title: 'Upcoming 🔜' });
      pending.slice(0, 8).forEach((m) => items.push({ _type: 'milestone', id: m.id, milestone: m }));
    }
    if (achieved.length > 0) {
      items.push({ _type: 'sectionHeader', title: 'Achieved 🎉' });
      achieved.forEach((m) => items.push({ _type: 'milestone', id: m.id, milestone: m }));
    }
    return items;
  }, [pending, achieved]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<ListItem>) => {
    if (item._type === 'sectionHeader') {
      return <Text style={styles.sectionTitle}>{item.title}</Text>;
    }
    return (
      <MilestoneItem
        item={item.milestone}
        babyAgeWeeks={babyAgeWeeks}
        onAchieve={handleAchieve}
        babyName={activeBaby?.name ?? 'Baby'}
      />
    );
  }, [babyAgeWeeks, handleAchieve, activeBaby]);

  const keyExtractor = useCallback((item: ListItem) =>
    item._type === 'sectionHeader' ? `section_${item.title}` : item.id
  , []);

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Milestone Progress</Text>
        <View style={styles.progressStats}>
          <Text style={styles.progressValue}>{achieved.length} / {filteredMilestones.length}</Text>
          <Text style={styles.progressLabel}>achieved</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, {
            width: filteredMilestones.length > 0
              ? `${(achieved.length / filteredMilestones.length) * 100}%`
              : '0%',
          }]} />
        </View>
        <Text style={styles.ageText}>Baby is {babyAgeWeeks} weeks old</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.categoryRow}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryBtn, activeCategory === cat && styles.categoryBtnActive]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={styles.categoryEmoji}>
                {cat === 'all' ? '⭐' : CATEGORY_EMOJIS[cat]}
              </Text>
              <Text style={[styles.categoryText, activeCategory === cat && styles.categoryTextActive]}>
                {cat === 'all' ? 'All' : t(`tracker.categories.${cat}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {milestoneLoading && filteredMilestones.length === 0 && (
        <>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
    <ConfettiOverlay ref={confettiRef} />
    <FlatList
      style={{ flex: 1 }}
      data={milestoneLoading && filteredMilestones.length === 0 ? [] : listData}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        milestoneLoading ? null : (
          <EmptyState emoji="⭐" title="No milestones yet" subtitle="Milestones will appear as baby grows" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.xl, paddingBottom: 100 },
  listHeader: { gap: Spacing.lg, marginBottom: Spacing.md },
  progressCard: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, ...Shadows.md },
  progressTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  progressStats: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.sm },
  progressValue: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.accent },
  progressLabel: { fontSize: Typography.base, color: Colors.textSecondary },
  progressBar: { height: 10, backgroundColor: Colors.border, borderRadius: 5, overflow: 'hidden', marginVertical: Spacing.sm },
  progressFill: { height: '100%', backgroundColor: Colors.accent, borderRadius: 5 },
  ageText: { fontSize: Typography.xs, color: Colors.textSecondary },
  categoryRow: { flexDirection: 'row', gap: Spacing.sm },
  categoryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  categoryBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent + '15' },
  categoryEmoji: { fontSize: 16 },
  categoryText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  categoryTextActive: { color: Colors.accent },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary, marginTop: Spacing.sm },
  milestoneCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  milestoneAchieved: { opacity: 0.8 },
  milestoneIconBg: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  milestoneIconEmoji: { fontSize: 24 },
  milestoneInfo: { flex: 1 },
  milestoneTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  milestoneDesc: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  approachingBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full, marginTop: 4 },
  approachingText: { fontSize: Typography.xs, fontWeight: '700' },
  achieveBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  achievedDate: { fontSize: Typography.xs, color: Colors.success, marginTop: 2 },
  shareInline: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  shareInlineText: { fontSize: Typography.xs, color: '#25D366', fontWeight: '600' },
});
