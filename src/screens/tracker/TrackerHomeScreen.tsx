import React, { useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Colors, Typography, Spacing, Radius, Shadows, TrackerSectionColors } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import { useRefresh } from '@hooks/useRefresh';
import { useGrandparentMode } from '@hooks/useGrandparentMode';
import { useNotifications } from '@hooks/useNotifications';
import { RangoliBorder, BlockPrintCorner } from '@components/common/index';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface TrackerItem {
  id: string; labelKey: string; screen: string;
  icon: string; color: string; descKey: string;
}
interface Section {
  title: keyof typeof TrackerSectionColors;
  subtitle: string;
  items: TrackerItem[];
}

const SECTIONS: Section[] = [
  {
    title: 'Daily Trackers',
    subtitle: 'Log as it happens',
    items: [
      { id: 'feed',      labelKey: 'tracker.feeding',     screen: 'FeedTracker',        icon: '🍼', color: Colors.feedColor,   descKey: 'Breastfeed, formula & solids' },
      { id: 'sleep',     labelKey: 'tracker.sleep',       screen: 'SleepTracker',       icon: '😴', color: Colors.sleepColor,  descKey: 'Track nap & night sleep' },
      { id: 'diaper',    labelKey: 'tracker.diaper',      screen: 'DiaperTracker',      icon: '👶', color: Colors.diaperColor, descKey: 'Wet, dirty & mixed' },
      { id: 'growth',    labelKey: 'tracker.growth',      screen: 'GrowthTracker',      icon: '📏', color: Colors.growthColor, descKey: 'Weight, height & head' },
      { id: 'vaccine',   labelKey: 'tracker.vaccination', screen: 'VaccinationTracker', icon: '💉', color: Colors.warning,     descKey: 'India vaccine schedule' },
      { id: 'milestone', labelKey: 'tracker.milestone',   screen: 'MilestoneTracker',   icon: '⭐', color: Colors.accent,      descKey: 'Physical, social & more' },
      { id: 'medicine',  labelKey: 'tracker.medicine',    screen: 'MedicineTracker',    icon: '🌡️', color: Colors.error,       descKey: 'Temperature & medicines' },
    ],
  },
  {
    title: 'Insights',
    subtitle: 'Patterns & predictions',
    items: [
      { id: 'sleepanalysis', labelKey: 'tracker.sleepAnalysis',  screen: 'SleepAnalysis',   icon: '📊', color: '#1A3A6B', descKey: 'Charts, trends & bedtime' },
      { id: 'feedanalytics', labelKey: 'tracker.feedAnalytics',  screen: 'FeedAnalytics',   icon: '🔍', color: '#C2410C', descKey: 'Heatmap · type ratio · clusters' },
      { id: 'growthpred',    labelKey: 'tracker.growthPred',     screen: 'GrowthPredictor', icon: '📈', color: '#4338CA', descKey: 'Weight forecast · WHO charts' },
      { id: 'schedulebuild', labelKey: 'tracker.scheduleBuilder',screen: 'ScheduleBuilder', icon: '🕐', color: '#0D9488', descKey: 'Age-based daily schedule' },
    ],
  },
  {
    title: 'Reports',
    subtitle: 'Share with your doctor',
    items: [
      { id: 'report',  labelKey: 'tracker.report',  screen: 'DailyReport',   icon: '📋', color: '#2C5282', descKey: 'PDF report · share with doctor' },
      { id: 'monthly', labelKey: 'tracker.monthly', screen: 'MonthlyReport', icon: '🗓️', color: '#FF6B35', descKey: 'Monthly summary · PDF export' },
      { id: 'visit',   labelKey: 'tracker.visit',   screen: 'VisitPrep',     icon: '🩺', color: '#0B6E6E', descKey: '2-week summary · doctor PDF' },
    ],
  },
  {
    title: 'Guides',
    subtitle: 'What to expect',
    items: [
      { id: 'knowledge',   labelKey: 'tracker.knowledge',  screen: 'KnowledgeHub',       icon: '📚', color: '#92400E',      descKey: 'What to expect this week' },
      { id: 'food',        labelKey: 'tracker.food',       screen: 'BabyFoodGuide',      icon: '🥗', color: '#2D7A3A',      descKey: 'Weaning & food introduction' },
      { id: 'vaccineprep', labelKey: 'tracker.vaccinePrep',screen: 'VaccinePrep',        icon: '🛡️', color: '#0369A1',      descKey: 'What to expect · dose guide' },
      { id: 'cultural',    labelKey: 'tracker.cultural',   screen: 'CulturalMilestones', icon: '🙏', color: Colors.primary, descKey: 'Namkaran, Annaprasan & more' },
    ],
  },
  {
    title: 'Family & Care',
    subtitle: 'Wellness, photos & handoffs',
    items: [
      { id: 'mom',       labelKey: 'tracker.mom',      screen: 'MomHealth',     icon: '💝', color: '#7B2D8B', descKey: 'Mood, recovery & EPDS screen' },
      { id: 'caregiver', labelKey: 'tracker.caregiver',screen: 'CaregiverCard', icon: '🤝', color: '#14532D', descKey: 'Handoff card for Nani/nanny' },
      { id: 'photos',    labelKey: 'tracker.photos',   screen: 'PhotoTimeline', icon: '🖼️', color: '#6B2FA0', descKey: 'Photo wall · monthly collage' },
    ],
  },
];

// ─── Tracker card ─────────────────────────────────────────────────────────────

function TrackerCard({
  item, sectionColor, onPress, isGP, fs, dim, hit,
}: {
  item: TrackerItem;
  sectionColor: string;
  onPress: () => void;
  isGP: boolean;
  fs: (n: number) => number;
  dim: (n: number) => number;
  hit: (n: number) => number;
}) {
  const { t } = useTranslation();
  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: sectionColor },
        isGP && { minWidth: '100%', flexDirection: 'row', alignItems: 'center', gap: Spacing.md, padding: dim(Spacing.lg), minHeight: hit(56) },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Block-print corner motif */}
      <View style={styles.cardCorner} pointerEvents="none">
        <BlockPrintCorner color={sectionColor} size={58} opacity={0.08} />
      </View>

      <View style={[
        styles.iconBg,
        { backgroundColor: sectionColor + '18', width: dim(52), height: dim(52), borderRadius: dim(16), borderWidth: 1, borderColor: sectionColor + '30' },
        isGP && { marginBottom: 0 },
      ]}>
        <Text style={{ fontSize: dim(26) }}>{item.icon}</Text>
      </View>
      <View style={isGP ? { flex: 1 } : undefined}>
        <Text style={[styles.cardLabel, { fontSize: fs(Typography.base) }]}>{t(item.labelKey)}</Text>
        <Text style={[styles.cardDesc,  { fontSize: fs(Typography.xs)   }]}>{item.descKey}</Text>
      </View>
      <View style={[styles.cardArrow, { backgroundColor: sectionColor + '18', width: dim(26), height: dim(26) }]}>
        <Ionicons name="arrow-forward" size={isGP ? 16 : 13} color={sectionColor} />
      </View>
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, subtitle, color }: { title: string; subtitle: string; color: string }) {
  return (
    <View style={styles.sectionHeader}>
      {/* Terracotta/indigo/desi accent bar */}
      <View style={[styles.sectionAccent, { backgroundColor: color }]} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.sectionTitle, { color: Colors.textPrimary }]}>{title}</Text>
        <Text style={styles.sectionSubtitle}>{subtitle}</Text>
      </View>
      {/* Tiny rangoli dots matching section color */}
      <View style={styles.sectionDots}>
        {[1, 0.6, 0.35].map((op, i) => (
          <View key={i} style={[styles.sectionDot, { backgroundColor: color, opacity: op }]} />
        ))}
      </View>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function TrackerHomeScreen() {
  const navigation = useNavigation<any>();
  const { activeBaby, getBabyAgeText } = useBabyStore();
  const { isGP, fs, dim, hit } = useGrandparentMode();
  const { getTodayFeedCount, getTodaySleepHours, getTodayDiaperCount, fetchTodayDiapers, fetchSleep, fetchFeeds } = useTrackerStore();

  // Wire up local push notifications
  useNotifications();

  const refreshData = useCallback(async () => {
    if (!activeBaby) return;
    await Promise.all([fetchFeeds(activeBaby.id), fetchSleep(activeBaby.id), fetchTodayDiapers(activeBaby.id)]);
  }, [activeBaby]);

  const { refreshing, refresh } = useRefresh(refreshData);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header — saffron → haldi → marigold (desi) ──────────── */}
      <LinearGradient
        colors={['#8F3D00', '#C05A00', '#E07B00']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🍼 Baby Tracker</Text>
            {activeBaby && (
              <Text style={styles.headerSub}>{activeBaby.name} · {getBabyAgeText()}</Text>
            )}
            <View style={styles.quickStats}>
              {[
                { v: getTodayFeedCount(),   icon: '🍼', label: 'Feeds today' },
                { v: getTodaySleepHours(),  icon: '😴', label: 'Sleep hrs'   },
                { v: getTodayDiaperCount(), icon: '👶', label: 'Diapers'     },
              ].map((s) => (
                <View key={s.label} style={[styles.quickStat, isGP && { paddingVertical: dim(Spacing.md) }]}>
                  <Text style={{ fontSize: fs(20) }}>{s.icon}</Text>
                  <Text style={[styles.quickStatValue, { fontSize: fs(Typography.xl) }]}>{s.v}</Text>
                  <Text style={[styles.quickStatLabel, { fontSize: fs(Typography.xs) }]}>{s.label}</Text>
                </View>
              ))}
            </View>
          </View>
        </SafeAreaView>
        {/* Rangoli diamond strip at the base of the header */}
        <RangoliBorder dotSize={6} gap={4} style={{ paddingVertical: 8, opacity: 0.85 }} />
      </LinearGradient>

      {/* ── Sections ─────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.primary} />}
      >
        {SECTIONS.map((section) => {
          const sectionColor = TrackerSectionColors[section.title];
          return (
            <View key={section.title} style={styles.section}>
              <SectionHeader title={section.title} subtitle={section.subtitle} color={sectionColor} />
              <View style={[styles.grid, isGP && { gap: Spacing.lg }]}>
                {section.items.map((item) => (
                  <TrackerCard
                    key={item.id}
                    item={item}
                    sectionColor={sectionColor}
                    onPress={() => navigation.navigate(item.screen)}
                    isGP={isGP} fs={fs} dim={dim} hit={hit}
                  />
                ))}
              </View>
            </View>
          );
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  // Header
  header:         { paddingBottom: 0 },
  headerContent:  { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  headerTitle:    { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:      { fontSize: Typography.base, color: 'rgba(255,255,255,0.88)', marginTop: 2, marginBottom: Spacing.lg },
  quickStats:     { flexDirection: 'row', gap: Spacing.md },
  quickStat: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  quickStatValue: { fontSize: Typography.xl, fontWeight: '800', color: '#fff', marginTop: 2 },
  quickStatLabel: { fontSize: Typography.xs, color: 'rgba(255,255,255,0.82)', marginTop: 1 },

  scroll: { padding: Spacing.xl },

  // Section
  section:         { marginBottom: Spacing.xl },
  sectionHeader:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionAccent:   { width: 4, height: 36, borderRadius: Radius.full },
  sectionTitle:    { fontSize: Typography.base, fontWeight: '800', color: Colors.textPrimary },
  sectionSubtitle: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 1 },
  sectionDots:     { flexDirection: 'row', gap: 4, marginLeft: 'auto' },
  sectionDot:      { width: 7, height: 7, borderRadius: 2, transform: [{ rotate: '45deg' }] },

  // Card
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  card: {
    flex: 1,
    minWidth: '44%',
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderLeftWidth: 3,
    overflow: 'hidden',
    ...Shadows.md,
  },
  cardCorner:  { position: 'absolute', top: 0, right: 0 },
  iconBg:      { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.sm },
  cardLabel:   { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  cardDesc:    { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 3, lineHeight: 16 },
  cardArrow:   { alignSelf: 'flex-end', borderRadius: 9, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.sm },
});
