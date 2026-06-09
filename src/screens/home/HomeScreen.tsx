import React, { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, RefreshControl, useColorScheme, Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import { useAIStore } from '@store/aiStore';
import { SkeletonStatGrid, SkeletonCard } from '@components/common/Skeleton';
import { useRefresh } from '@hooks/useRefresh';

// Animated stat card that slides in on mount
function StatCard({
  stat,
  index,
  onPress,
  isDark,
}: {
  stat: { key: string; label: string; value: number; unit: string; icon: string; color: string; target: number | null };
  index: number;
  onPress: () => void;
  isDark: boolean;
}) {
  const translateY = useRef(new Animated.Value(30)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 400, delay: index * 80, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, tension: 80, friction: 8, delay: index * 80, useNativeDriver: true }),
    ]).start();
  }, []);

  const progress = stat.target ? Math.min((stat.value / stat.target) * 100, 100) : 0;

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }], flex: 1, minWidth: '44%' }}>
      <TouchableOpacity
        style={[styles.statCard, isDark && { backgroundColor: Colors.dark.surface }]}
        activeOpacity={0.75}
        onPress={async () => {
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
      >
        <View style={[styles.statIconBg, { backgroundColor: stat.color + '22' }]}>
          <Text style={styles.statIcon}>{stat.icon}</Text>
        </View>
        <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
        <Text style={[styles.statUnit, isDark && { color: Colors.dark.textSecondary }]}>{stat.unit}</Text>
        <Text style={[styles.statLabel, isDark && { color: Colors.dark.textSecondary }]}>{stat.label}</Text>
        {stat.target && (
          <View style={styles.progressBar}>
            <Animated.View
              style={[styles.progressFill, { width: `${progress}%` as any, backgroundColor: stat.color }]}
            />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const { activeBaby, getBabyAgeText } = useBabyStore();
  const {
    fetchTodayFeeds, fetchTodaySleep, fetchTodayDiapers,
    getTodayFeedCount, getTodaySleepHours, getTodayDiaperCount,
    getNextVaccination, fetchVaccinations,
  } = useTrackerStore();
  const { insights, fetchInsights } = useAIStore();
  const [initialLoading, setInitialLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!activeBaby) return;
    await Promise.all([
      fetchTodayFeeds(activeBaby.id),
      fetchTodaySleep(activeBaby.id),
      fetchTodayDiapers(activeBaby.id),
      fetchVaccinations(activeBaby.id),
      fetchInsights(activeBaby.id),
    ]);
  }, [activeBaby]);

  useEffect(() => {
    loadData().finally(() => setInitialLoading(false));
  }, [loadData]);

  const { refreshing, refresh } = useRefresh(loadData);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return t('home.goodMorning');
    if (h < 17) return t('home.goodAfternoon');
    return t('home.goodEvening');
  };

  const nextVaccine = getNextVaccination();
  const feedCount = getTodayFeedCount();
  const sleepHours = getTodaySleepHours();
  const diaperCount = getTodayDiaperCount();

  const statsData = [
    { key: 'feeds', label: t('home.feeds'), value: feedCount, unit: 'times', icon: '🍼', color: Colors.feedColor, target: 8 },
    { key: 'sleep', label: t('home.sleep'), value: sleepHours, unit: 'hrs', icon: '😴', color: Colors.sleepColor, target: 16 },
    { key: 'diapers', label: t('home.diapers'), value: diaperCount, unit: 'times', icon: '👶', color: Colors.diaperColor, target: 6 },
    { key: 'cries', label: t('home.cries'), value: 0, unit: 'events', icon: '🎤', color: Colors.primary, target: null },
  ];

  return (
    <View style={[styles.container, isDark && { backgroundColor: Colors.dark.background }]}>
      <StatusBar barStyle="light-content" />

      <LinearGradient colors={['#FF6B8A', '#FF8E53']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.headerGradient}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.userName}>{user?.displayName?.split(' ')[0] ?? 'Parent'} 👋</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn} onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
              <Ionicons name="notifications-outline" size={22} color="#fff" />
              <View style={styles.notificationDot} />
            </TouchableOpacity>
          </View>

          {activeBaby && (
            <TouchableOpacity
              style={styles.babyCard}
              onPress={() => navigation.navigate('Profile')}
              activeOpacity={0.85}
            >
              <View style={styles.babyAvatarContainer}>
                <Text style={styles.babyAvatar}>
                  {activeBaby.gender === 'male' ? '👦' : activeBaby.gender === 'female' ? '👧' : '👶'}
                </Text>
              </View>
              <View style={styles.babyInfo}>
                <Text style={styles.babyName}>{activeBaby.name}</Text>
                <Text style={styles.babyAge}>{getBabyAgeText()}</Text>
                <Text style={styles.babyDate}>Born {format(activeBaby.birthDate, 'dd MMM yyyy')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </TouchableOpacity>
          )}
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} colors={[Colors.primary]} />
        }
      >
        {/* Today's Stats */}
        <Text style={[styles.sectionTitle, isDark && { color: Colors.dark.textPrimary }]}>{t('home.todaySummary')}</Text>

        {initialLoading ? (
          <SkeletonStatGrid />
        ) : (
          <View style={styles.statsGrid}>
            {statsData.map((stat, i) => (
              <StatCard
                key={stat.key}
                stat={stat}
                index={i}
                isDark={isDark}
                onPress={() => navigation.navigate('Tracker')}
              />
            ))}
          </View>
        )}

        {/* AI Insight */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, isDark && { color: Colors.dark.textPrimary }]}>{t('home.aiInsight')}</Text>
          <TouchableOpacity onPress={() => navigation.navigate('AI')}>
            <Text style={styles.seeAll}>See all →</Text>
          </TouchableOpacity>
        </View>

        {initialLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : insights.length > 0 ? (
          insights.slice(0, 2).map((insight) => (
            <TouchableOpacity
              key={insight.id}
              style={[styles.insightCard, isDark && { backgroundColor: Colors.dark.surface }]}
              onPress={() => navigation.navigate('AI')}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#FF6B8A14', '#FF8E530A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.insightGradient}>
                <View style={styles.insightIcon}>
                  <Text style={{ fontSize: 24 }}>
                    {insight.type === 'feeding' ? '🍼' : insight.type === 'sleep' ? '😴' : insight.type === 'cry' ? '🎤' : '💡'}
                  </Text>
                </View>
                <View style={styles.insightContent}>
                  <Text style={[styles.insightTitle, isDark && { color: Colors.dark.textPrimary }]}>{insight.title}</Text>
                  <Text style={[styles.insightMessage, isDark && { color: Colors.dark.textSecondary }]} numberOfLines={2}>{insight.message}</Text>
                </View>
                <View style={[styles.confidenceBadge, { backgroundColor: Colors.primary + '20' }]}>
                  <Text style={[styles.confidenceText, { color: Colors.primary }]}>{insight.confidence}%</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyInsight, isDark && { backgroundColor: Colors.dark.surface }]}>
            <Text style={styles.emptyInsightEmoji}>🤖</Text>
            <Text style={[styles.emptyInsightText, isDark && { color: Colors.dark.textSecondary }]}>
              Track a few more days and AI will share personalized insights about {activeBaby?.name ?? 'your baby'}.
            </Text>
          </View>
        )}

        {/* Next Vaccine */}
        {!initialLoading && nextVaccine && (
          <>
            <Text style={[styles.sectionTitle, isDark && { color: Colors.dark.textPrimary }]}>{t('home.nextVaccine')}</Text>
            <TouchableOpacity
              style={[styles.vaccineCard, isDark && { backgroundColor: Colors.dark.surface }, nextVaccine.status === 'overdue' && styles.vaccineCardOverdue]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                navigation.navigate('Tracker', { screen: 'VaccinationTracker' });
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.vaccineIcon, nextVaccine.status === 'overdue' && { backgroundColor: Colors.error + '20' }]}>
                <Text style={{ fontSize: 28 }}>💉</Text>
              </View>
              <View style={styles.vaccineInfo}>
                <Text style={[styles.vaccineName, isDark && { color: Colors.dark.textPrimary }]}>{nextVaccine.vaccineName}</Text>
                <Text style={[styles.vaccineDate, { color: nextVaccine.status === 'overdue' ? Colors.error : Colors.textSecondary }]}>
                  {nextVaccine.status === 'overdue' ? '⚠️ Overdue: ' : `${t('home.due')}: `}
                  {format(nextVaccine.scheduledDate, 'dd MMM yyyy')}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          </>
        )}

        {/* Quick Log */}
        <Text style={[styles.sectionTitle, isDark && { color: Colors.dark.textPrimary }]}>{t('home.quickLog')}</Text>
        <View style={styles.quickLogGrid}>
          {[
            { icon: '🍼', label: 'Feed', screen: 'FeedTracker', color: Colors.feedColor },
            { icon: '😴', label: 'Sleep', screen: 'SleepTracker', color: Colors.sleepColor },
            { icon: '👶', label: 'Diaper', screen: 'DiaperTracker', color: Colors.diaperColor },
            { icon: '📏', label: 'Growth', screen: 'GrowthTracker', color: Colors.growthColor },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.quickLogBtn, isDark && { backgroundColor: Colors.dark.surface }]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('Tracker', { screen: item.screen });
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.quickLogIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={{ fontSize: 24 }}>{item.icon}</Text>
              </View>
              <Text style={[styles.quickLogLabel, isDark && { color: Colors.dark.textPrimary }]}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Feature shortcuts */}
        <Text style={[styles.sectionTitle, isDark && { color: Colors.dark.textPrimary }]}>
          Useful Tools / Zaruri Tools
        </Text>
        <View style={styles.toolsRow}>
          {[
            { icon: '🍲', label: 'Baby Food\nGuide', screen: 'BabyFoodGuide', color: Colors.mehendi },
            { icon: '🩺', label: 'Symptom\nChecker', screen: 'SymptomChecker', color: Colors.rose },
            { icon: '🧿', label: 'AI\nGuru', tab: 'AI', color: Colors.peacock },
            { icon: '👨‍👩‍👧', label: 'Community\nSamaj', tab: 'Community', color: Colors.primary },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={[styles.toolBtn, isDark && { backgroundColor: Colors.dark.surface }]}
              onPress={async () => {
                await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (item.screen) navigation.navigate(item.screen as any);
                else if (item.tab) navigation.navigate(item.tab as any);
              }}
              activeOpacity={0.75}
            >
              <View style={[styles.toolIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={{ fontSize: 22 }}>{item.icon}</Text>
              </View>
              <Text style={[styles.toolLabel, isDark && { color: Colors.dark.textSecondary }]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  headerGradient: { paddingBottom: Spacing['2xl'] },
  headerContent: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm,
  },
  greeting: { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)' },
  userName: { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  notificationBtn: { position: 'relative', padding: Spacing.sm },
  notificationDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colors.warning, borderWidth: 1.5, borderColor: '#fff',
  },
  babyCard: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: Spacing.xl, marginTop: Spacing.lg,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius['2xl'], padding: Spacing.md,
  },
  babyAvatarContainer: {
    width: 56, height: 56, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center', justifyContent: 'center', marginRight: Spacing.md,
  },
  babyAvatar: { fontSize: 30 },
  babyInfo: { flex: 1 },
  babyName: { fontSize: Typography.lg, fontWeight: '800', color: '#fff' },
  babyAge: { fontSize: Typography.base, color: 'rgba(255,255,255,0.9)', fontWeight: '600' },
  babyDate: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.7)' },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md, marginTop: Spacing.sm },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md, marginTop: Spacing.sm },
  seeAll: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md, marginBottom: Spacing.xl },
  statCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.md, alignItems: 'center', ...Shadows.md,
  },
  statIconBg: { width: 48, height: 48, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  statIcon: { fontSize: 24 },
  statValue: { fontSize: Typography['2xl'], fontWeight: '800' },
  statUnit: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  statLabel: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500', marginTop: 4 },
  progressBar: { width: '100%', height: 4, backgroundColor: Colors.border, borderRadius: 2, marginTop: Spacing.sm, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 2 },
  insightCard: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md, ...Shadows.sm },
  insightGradient: { flexDirection: 'row', alignItems: 'center', padding: Spacing.md, gap: Spacing.md },
  insightIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,107,138,0.15)', alignItems: 'center', justifyContent: 'center' },
  insightContent: { flex: 1 },
  insightTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  insightMessage: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 18 },
  confidenceBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  confidenceText: { fontSize: Typography.xs, fontWeight: '700' },
  emptyInsight: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing['2xl'], alignItems: 'center', marginBottom: Spacing.xl, ...Shadows.sm,
  },
  emptyInsightEmoji: { fontSize: 40, marginBottom: Spacing.sm },
  emptyInsightText: { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  vaccineCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
    marginBottom: Spacing.xl, ...Shadows.md,
  },
  vaccineCardOverdue: { borderWidth: 1.5, borderColor: Colors.error + '50' },
  vaccineIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: Colors.warning + '20', alignItems: 'center', justifyContent: 'center' },
  vaccineInfo: { flex: 1 },
  vaccineName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  vaccineDate: { fontSize: Typography.sm, marginTop: 2 },
  quickLogGrid: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  quickLogBtn: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center',
    gap: Spacing.sm, ...Shadows.sm,
  },
  quickLogIcon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  quickLogLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  toolsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.xl },
  toolBtn: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.sm, alignItems: 'center', gap: 6, ...Shadows.sm,
  },
  toolIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  toolLabel: { fontSize: 10, fontWeight: '600', color: Colors.textSecondary, textAlign: 'center', lineHeight: 13 },
});
