import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { differenceInWeeks } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import {
  KB_ARTICLES, CATEGORY_META, getArticlesForAge, getReadTime,
  type KBArticle, type KBCategory,
} from '@constants/knowledgeBase';

const { width: W } = Dimensions.get('window');

const ALL = 'all';
type Filter = KBCategory | typeof ALL;

const CATEGORY_FILTERS: Array<{ key: Filter; emoji: string; label: string }> = [
  { key: ALL,           emoji: '📚', label: 'All'         },
  { key: 'development', emoji: '🧠', label: 'Dev'         },
  { key: 'feeding',     emoji: '🍼', label: 'Feeding'     },
  { key: 'sleep',       emoji: '😴', label: 'Sleep'       },
  { key: 'health',      emoji: '💊', label: 'Health'      },
  { key: 'concerns',    emoji: '⚠️',  label: 'Concerns'   },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryChip({ item, active, onPress }: {
  item: typeof CATEGORY_FILTERS[0]; active: boolean; onPress: () => void;
}) {
  const meta = item.key !== ALL ? CATEGORY_META[item.key as KBCategory] : null;
  const activeColor = meta?.color ?? Colors.primary;
  return (
    <TouchableOpacity
      style={[styles.chip, active && { backgroundColor: activeColor, borderColor: activeColor }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.chipEmoji}>{item.emoji}</Text>
      <Text style={[styles.chipLabel, active && { color: '#fff' }]}>{item.label}</Text>
    </TouchableOpacity>
  );
}

function ArticleCard({ article, onPress }: { article: KBArticle; onPress: () => void }) {
  const meta = CATEGORY_META[article.category];
  return (
    <TouchableOpacity style={[styles.articleCard, { borderLeftColor: meta.color }]} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.articleCardTop}>
        <Text style={styles.articleEmoji}>{article.emoji}</Text>
        <View style={[styles.categoryBadge, { backgroundColor: meta.bg }]}>
          <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.label}</Text>
        </View>
      </View>
      <Text style={styles.articleTitle} numberOfLines={2}>{article.title}</Text>
      <Text style={styles.articleSummary} numberOfLines={2}>{article.summary}</Text>
      <View style={styles.articleMeta}>
        <Text style={styles.articleReadTime}>⏱️ {getReadTime(article)}</Text>
        <Text style={styles.articleAge}>
          {article.minWeeks < 8
            ? `Week ${article.minWeeks}–${article.maxWeeks}`
            : `${Math.floor(article.minWeeks / 4)}–${Math.floor(article.maxWeeks / 4)} mo`}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function FeaturedCard({ article, onPress }: { article: KBArticle; onPress: () => void }) {
  const meta = CATEGORY_META[article.category];
  return (
    <TouchableOpacity
      style={[styles.featuredCard, { borderColor: meta.color + '40' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <LinearGradient colors={[meta.bg, '#fff']} style={styles.featuredGradient}>
        <View style={styles.featuredTopRow}>
          <Text style={styles.featuredEmoji}>{article.emoji}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: meta.color + '20' }]}>
            <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.featuredReadTime}>{getReadTime(article)}</Text>
        </View>
        <Text style={styles.featuredTitle}>{article.title}</Text>
        <Text style={styles.featuredSummary} numberOfLines={2}>{article.summary}</Text>
        <View style={[styles.readMoreBtn, { backgroundColor: meta.color }]}>
          <Text style={styles.readMoreText}>Read article</Text>
          <Ionicons name="arrow-forward" size={14} color="#fff" />
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Article Detail Modal ─────────────────────────────────────────────────────

function ArticleModal({ article, onClose }: { article: KBArticle; onClose: () => void }) {
  const meta = CATEGORY_META[article.category];
  const navigation = useNavigation<any>();

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn}>
            <Ionicons name="close" size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={[styles.categoryBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.categoryBadgeText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.modalReadTime}>{getReadTime(article)}</Text>
        </View>

        <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
          {/* Hero */}
          <LinearGradient colors={[meta.bg, '#fff']} style={styles.modalHero}>
            <Text style={styles.modalHeroEmoji}>{article.emoji}</Text>
            <Text style={styles.modalTitle}>{article.title}</Text>
            <Text style={styles.modalAgeBadge}>
              {article.minWeeks === 0 && article.maxWeeks >= 100
                ? 'All ages'
                : article.maxWeeks < 8
                ? `Week ${article.minWeeks} – ${article.maxWeeks}`
                : `${Math.floor(article.minWeeks / 4)} – ${Math.floor(article.maxWeeks / 4)} months`}
            </Text>
          </LinearGradient>

          <View style={styles.modalBody}>
            {/* Content paragraphs */}
            {article.content.map((para, i) => (
              <Text key={i} style={styles.modalPara}>{para}</Text>
            ))}

            {/* Tips */}
            <View style={[styles.tipsBox, { borderLeftColor: meta.color }]}>
              <Text style={[styles.tipsTitle, { color: meta.color }]}>Practical Tips</Text>
              {article.tips.map((tip, i) => (
                <Text key={i} style={styles.tipText}>{tip}</Text>
              ))}
            </View>

            {/* Doctor If */}
            {article.doctorIf && article.doctorIf.length > 0 && (
              <View style={styles.doctorBox}>
                <View style={styles.doctorBoxHeader}>
                  <Ionicons name="medical" size={16} color="#B91C1C" />
                  <Text style={styles.doctorBoxTitle}>See a doctor if…</Text>
                </View>
                {article.doctorIf.map((sign, i) => (
                  <View key={i} style={styles.doctorRow}>
                    <Text style={styles.doctorBullet}>⚠️</Text>
                    <Text style={styles.doctorText}>{sign}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Tracker Link */}
            {article.trackerLink && (
              <TouchableOpacity
                style={[styles.trackerLinkBtn, { backgroundColor: meta.color }]}
                onPress={() => { onClose(); navigation.navigate(article.trackerLink!.screen); }}
                activeOpacity={0.8}
              >
                <Ionicons name="arrow-forward-circle-outline" size={20} color="#fff" />
                <Text style={styles.trackerLinkText}>{article.trackerLink.label}</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function KnowledgeHubScreen() {
  const { activeBaby } = useBabyStore();
  const [filter, setFilter] = useState<Filter>(ALL);
  const [selected, setSelected] = useState<KBArticle | null>(null);

  const ageWeeks = useMemo(() => {
    if (!activeBaby?.birthDate) return 0;
    return Math.max(0, differenceInWeeks(new Date(), activeBaby.birthDate));
  }, [activeBaby]);

  const ageLabel = useMemo(() => {
    if (ageWeeks < 8)  return `Week ${ageWeeks}`;
    const mo = Math.floor(ageWeeks / 4.33);
    return `${mo} month${mo !== 1 ? 's' : ''} old`;
  }, [ageWeeks]);

  const thisWeekArticles = useMemo(() => getArticlesForAge(ageWeeks), [ageWeeks]);

  const allFiltered = useMemo(() => {
    return filter === ALL
      ? KB_ARTICLES
      : KB_ARTICLES.filter((a) => a.category === filter);
  }, [filter]);

  const otherArticles = useMemo(
    () => allFiltered.filter((a) => !thisWeekArticles.some((t) => t.id === a.id)),
    [allFiltered, thisWeekArticles],
  );

  const thisWeekFiltered = useMemo(
    () => filter === ALL ? thisWeekArticles : thisWeekArticles.filter((a) => a.category === filter),
    [filter, thisWeekArticles],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <LinearGradient colors={['#92400E', '#D97706']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>📚 Knowledge Hub</Text>
            {activeBaby ? (
              <Text style={styles.headerSubtitle}>
                {activeBaby.name} · {ageLabel} · {thisWeekArticles.length} article{thisWeekArticles.length !== 1 ? 's' : ''} for you
              </Text>
            ) : (
              <Text style={styles.headerSubtitle}>Your parenting mini-library</Text>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Category Chips */}
      <View style={styles.chipsWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {CATEGORY_FILTERS.map((f) => (
            <CategoryChip key={f.key} item={f} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* This Week Section */}
        {thisWeekFiltered.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🌟 For You This Week</Text>
            <Text style={styles.sectionSubtitle}>Curated for {ageLabel}</Text>
            {thisWeekFiltered.map((a) => (
              <FeaturedCard key={a.id} article={a} onPress={() => setSelected(a)} />
            ))}
          </View>
        )}

        {/* Browse All / Other Articles */}
        {otherArticles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {thisWeekFiltered.length > 0 ? 'Browse All Topics' : '📖 All Articles'}
            </Text>
            <View style={styles.cardGrid}>
              {otherArticles.map((a) => (
                <ArticleCard key={a.id} article={a} onPress={() => setSelected(a)} />
              ))}
            </View>
          </View>
        )}

        {allFiltered.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={styles.emptyText}>No articles in this category yet</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Article Detail */}
      {selected && (
        <ArticleModal article={selected} onClose={() => setSelected(null)} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const CARD_W = (W - Spacing.xl * 2 - Spacing.md) / 2;

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },

  // Header
  header:             { paddingBottom: Spacing['2xl'] },
  headerContent:      { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:        { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSubtitle:     { fontSize: Typography.sm, color: 'rgba(255,255,255,0.88)', marginTop: 4 },

  // Chips
  chipsWrapper:       { backgroundColor: Colors.surface, ...Shadows.sm },
  chips:              { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, gap: Spacing.sm, flexDirection: 'row' },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipEmoji:          { fontSize: 14 },
  chipLabel:          { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },

  // Scroll
  scroll:             { padding: Spacing.xl },

  // Sections
  section:            { marginBottom: Spacing['2xl'] },
  sectionTitle:       { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  sectionSubtitle:    { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2, marginBottom: Spacing.md },

  // Featured cards
  featuredCard: {
    borderRadius: Radius['2xl'], borderWidth: 1.5,
    overflow: 'hidden', marginBottom: Spacing.md, ...Shadows.sm,
  },
  featuredGradient:   { padding: Spacing.lg },
  featuredTopRow:     { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  featuredEmoji:      { fontSize: 28 },
  featuredReadTime:   { fontSize: Typography.xs, color: Colors.textSecondary, marginLeft: 'auto' },
  featuredTitle:      { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, marginBottom: 6 },
  featuredSummary:    { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  readMoreBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start',
    paddingHorizontal: Spacing.md, paddingVertical: 7, borderRadius: Radius.full,
  },
  readMoreText:       { fontSize: Typography.sm, fontWeight: '700', color: '#fff' },

  // Article cards (grid)
  cardGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  articleCard: {
    width: CARD_W, backgroundColor: Colors.surface,
    borderRadius: Radius.xl, padding: Spacing.md,
    borderLeftWidth: 4, ...Shadows.sm,
  },
  articleCardTop:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  articleEmoji:       { fontSize: 24 },
  articleTitle:       { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  articleSummary:     { fontSize: Typography.xs, color: Colors.textSecondary, lineHeight: 16, marginBottom: 8 },
  articleMeta:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  articleReadTime:    { fontSize: 10, color: Colors.textTertiary ?? Colors.textSecondary },
  articleAge:         { fontSize: 10, color: Colors.textTertiary ?? Colors.textSecondary },

  // Category badge
  categoryBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.full },
  categoryBadgeText:  { fontSize: 10, fontWeight: '700' },

  // Empty state
  emptyState:         { alignItems: 'center', paddingVertical: 60 },
  emptyEmoji:         { fontSize: 48, marginBottom: Spacing.md },
  emptyText:          { fontSize: Typography.base, color: Colors.textSecondary },

  // ── Modal ──────────────────────────────────────────────────────────────────
  modalContainer:     { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalCloseBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center',
    marginRight: 4,
  },
  modalReadTime:      { fontSize: Typography.xs, color: Colors.textSecondary, marginLeft: 'auto' },
  modalScroll:        { flex: 1 },

  // Hero section
  modalHero:          { padding: Spacing.xl, alignItems: 'center', paddingBottom: Spacing['2xl'] },
  modalHeroEmoji:     { fontSize: 56, marginBottom: Spacing.md },
  modalTitle:         { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  modalAgeBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: Radius.full,
  },

  // Body
  modalBody:          { padding: Spacing.xl },
  modalPara: {
    fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 24,
    marginBottom: Spacing.lg,
  },

  // Tips box
  tipsBox: {
    backgroundColor: '#F8F8F8', borderRadius: Radius.xl,
    padding: Spacing.lg, borderLeftWidth: 4,
    marginBottom: Spacing.lg,
  },
  tipsTitle:          { fontSize: Typography.sm, fontWeight: '800', marginBottom: Spacing.sm },
  tipText: {
    fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 22,
    marginBottom: 6,
  },

  // Doctor box
  doctorBox: {
    backgroundColor: '#FEF2F2', borderRadius: Radius.xl,
    padding: Spacing.lg, borderWidth: 1.5, borderColor: '#FECACA',
    marginBottom: Spacing.lg,
  },
  doctorBoxHeader:    { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: Spacing.sm },
  doctorBoxTitle:     { fontSize: Typography.sm, fontWeight: '800', color: '#B91C1C' },
  doctorRow:          { flexDirection: 'row', gap: 8, marginBottom: 6 },
  doctorBullet:       { fontSize: 14 },
  doctorText:         { flex: 1, fontSize: Typography.sm, color: '#7F1D1D', lineHeight: 20 },

  // Tracker link CTA
  trackerLinkBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, paddingVertical: Spacing.md, borderRadius: Radius.xl,
    marginTop: Spacing.sm,
  },
  trackerLinkText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
