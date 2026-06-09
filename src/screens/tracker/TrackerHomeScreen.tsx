import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import { useRefresh } from '@hooks/useRefresh';

const TRACKER_ITEMS = [
  { id: 'feed', labelKey: 'tracker.feeding', screen: 'FeedTracker', icon: '🍼', color: Colors.feedColor, descKey: 'Breastfeed, formula & solids' },
  { id: 'sleep', labelKey: 'tracker.sleep', screen: 'SleepTracker', icon: '😴', color: Colors.sleepColor, descKey: 'Track nap & night sleep' },
  { id: 'diaper', labelKey: 'tracker.diaper', screen: 'DiaperTracker', icon: '👶', color: Colors.diaperColor, descKey: 'Wet, dirty & mixed' },
  { id: 'growth', labelKey: 'tracker.growth', screen: 'GrowthTracker', icon: '📏', color: Colors.growthColor, descKey: 'Weight, height & head' },
  { id: 'vaccine', labelKey: 'tracker.vaccination', screen: 'VaccinationTracker', icon: '💉', color: Colors.warning, descKey: 'India vaccine schedule' },
  { id: 'milestone', labelKey: 'tracker.milestone', screen: 'MilestoneTracker', icon: '⭐', color: Colors.accent, descKey: 'Physical, social & more' },
];

export default function TrackerHomeScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const { activeBaby, getBabyAgeText } = useBabyStore();
  const {
    getTodayFeedCount, getTodaySleepHours, getTodayDiaperCount,
    fetchTodayDiapers, fetchSleep, fetchFeeds,
  } = useTrackerStore();

  const refreshData = useCallback(async () => {
    if (!activeBaby) return;
    await Promise.all([
      fetchFeeds(activeBaby.id),
      fetchSleep(activeBaby.id),
      fetchTodayDiapers(activeBaby.id),
    ]);
  }, [activeBaby]);

  const { refreshing, refresh } = useRefresh(refreshData);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#6B8EFF', '#8B6BFF']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>{t('tracker.title')}</Text>
            {activeBaby && (
              <Text style={styles.headerSubtitle}>{activeBaby.name} • {getBabyAgeText()}</Text>
            )}
            <View style={styles.quickStats}>
              {[
                { v: getTodayFeedCount(), icon: '🍼', label: 'Feeds' },
                { v: getTodaySleepHours(), icon: '😴', label: 'Sleep hrs' },
                { v: getTodayDiaperCount(), icon: '👶', label: 'Diapers' },
              ].map((s) => (
                <View key={s.label} style={styles.quickStat}>
                  <Text style={styles.quickStatIcon}>{s.icon}</Text>
                  <Text style={styles.quickStatValue}>{s.v}</Text>
                  <Text style={styles.quickStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.secondary} />}
      >
        <View style={styles.grid}>
          {TRACKER_ITEMS.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.trackerCard}
              onPress={() => navigation.navigate(item.screen)}
              activeOpacity={0.7}
            >
              <View style={[styles.trackerIconBg, { backgroundColor: item.color + '20' }]}>
                <Text style={styles.trackerIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.trackerLabel}>{t(item.labelKey)}</Text>
              <Text style={styles.trackerDesc}>{item.descKey}</Text>
              <View style={[styles.trackerArrow, { backgroundColor: item.color + '20' }]}>
                <Ionicons name="arrow-forward" size={14} color={item.color} />
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing['2xl'] },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: Spacing.lg },
  quickStats: { flexDirection: 'row', gap: Spacing.md },
  quickStat: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center',
  },
  quickStatIcon: { fontSize: 20, marginBottom: 4 },
  quickStatValue: { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  quickStatLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.8)' },
  scroll: { padding: Spacing.xl },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  trackerCard: {
    flex: 1, minWidth: '44%', backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'], padding: Spacing.lg, ...Shadows.md,
  },
  trackerIconBg: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md },
  trackerIcon: { fontSize: 28 },
  trackerLabel: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  trackerDesc: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  trackerArrow: { alignSelf: 'flex-end', width: 28, height: 28, borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
});
