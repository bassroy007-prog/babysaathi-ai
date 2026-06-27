import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Modal, Alert, ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { differenceInMonths } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useTrackerStore } from '@store/trackerStore';
import {
  WEANING_FOODS, CATEGORY_COLORS, CATEGORY_LABELS, TEXTURE_LABELS,
  getFoodsForAge, generateMealPlan, WeaningFood,
} from '@constants/weaningGuide';

type FilterTab = 'this-month' | 'all' | 'introduced';
type MainTab = 'foods' | 'meals';

const REACTION_OPTIONS: { value: 'good' | 'mild' | 'allergic'; emoji: string; label: string; color: string }[] = [
  { value: 'good',     emoji: '😊', label: 'Good!',       color: '#3A7A2E' },
  { value: 'mild',     emoji: '😐', label: 'Mild Reaction', color: '#B8860B' },
  { value: 'allergic', emoji: '🚨', label: 'Allergic',    color: '#C0392B' },
];

export default function BabyFoodGuideScreen() {
  const { activeBaby } = useBabyStore();
  const { introducedFoods, weaningLoading, fetchIntroducedFoods, markFoodIntroduced, removeIntroducedFood } = useTrackerStore();

  const [mainTab, setMainTab]       = useState<MainTab>('foods');
  const [filterTab, setFilterTab]   = useState<FilterTab>('this-month');
  const [selectedFood, setSelectedFood] = useState<WeaningFood | null>(null);
  const [modalReaction, setModalReaction] = useState<'good' | 'mild' | 'allergic'>('good');
  const [modalNotes, setModalNotes] = useState('');
  const [saving, setSaving]         = useState(false);

  const ageMonths = activeBaby
    ? Math.max(0, differenceInMonths(new Date(), activeBaby.birthDate))
    : 0;

  useEffect(() => {
    if (activeBaby) fetchIntroducedFoods(activeBaby.id);
  }, [activeBaby?.id]);

  const introducedMap = useMemo(() => {
    const m = new Map<string, typeof introducedFoods[0]>();
    introducedFoods.forEach((f) => m.set(f.foodId, f));
    return m;
  }, [introducedFoods]);

  const introducedIds = useMemo(() => new Set(introducedFoods.map((f) => f.foodId)), [introducedFoods]);

  const availableFoods = useMemo(() => getFoodsForAge(ageMonths < 6 ? 6 : ageMonths), [ageMonths]);

  const filteredFoods = useMemo(() => {
    if (filterTab === 'this-month') {
      const lo = Math.max(6, ageMonths - 1);
      const hi = ageMonths + 1;
      return availableFoods.filter((f) => f.minMonths >= lo && f.minMonths <= hi);
    }
    if (filterTab === 'introduced') return availableFoods.filter((f) => introducedIds.has(f.id));
    return availableFoods;
  }, [filterTab, availableFoods, introducedIds, ageMonths]);

  const mealPlan = useMemo(() => generateMealPlan(ageMonths, introducedIds), [ageMonths, introducedIds]);

  const openModal = useCallback((food: WeaningFood) => {
    setSelectedFood(food);
    setModalReaction('good');
    setModalNotes('');
  }, []);

  const handleIntroduce = useCallback(async () => {
    if (!activeBaby || !selectedFood) return;
    setSaving(true);
    try {
      await markFoodIntroduced({
        babyId: activeBaby.id,
        foodId: selectedFood.id,
        foodName: selectedFood.name,
        dateIntroduced: new Date(),
        reaction: modalReaction,
        notes: modalNotes.trim() || undefined,
      });
      setSelectedFood(null);
    } finally {
      setSaving(false);
    }
  }, [activeBaby, selectedFood, modalReaction, modalNotes]);

  const handleRemove = useCallback(() => {
    if (!selectedFood) return;
    const entry = introducedMap.get(selectedFood.id);
    if (!entry) return;
    Alert.alert(
      'Remove Introduction?',
      `Mark "${selectedFood.name}" as not yet introduced?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove', style: 'destructive',
          onPress: async () => { await removeIntroducedFood(entry.id); setSelectedFood(null); },
        },
      ]
    );
  }, [selectedFood, introducedMap]);

  if (!activeBaby) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No baby profile found.</Text>
      </View>
    );
  }

  const introEntry = selectedFood ? introducedMap.get(selectedFood.id) : null;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ─────────────────────────────────────────────────── */}
      <LinearGradient colors={['#2D7A3A', '#1A5228']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🥗 Baby Food Guide</Text>
            <Text style={styles.headerSub}>
              {activeBaby.name} · {ageMonths < 6 ? 'Under 6 months' : `${ageMonths} months old`}
            </Text>
            <View style={styles.progressRow}>
              <View style={styles.progressPill}>
                <Text style={styles.progressText}>
                  ✅ {introducedFoods.length} / {availableFoods.length} foods introduced
                </Text>
              </View>
              {ageMonths < 6 && (
                <View style={[styles.progressPill, { backgroundColor: 'rgba(255,200,0,0.3)' }]}>
                  <Text style={styles.progressText}>⏳ Weaning starts at 6 months</Text>
                </View>
              )}
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Main Tabs ──────────────────────────────────────────────── */}
      <View style={styles.mainTabs}>
        {(['foods', 'meals'] as MainTab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.mainTab, mainTab === tab && styles.mainTabActive]}
            onPress={() => setMainTab(tab)}
          >
            <Text style={[styles.mainTabText, mainTab === tab && styles.mainTabTextActive]}>
              {tab === 'foods' ? '🍽 Foods' : '📅 Today\'s Meals'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {mainTab === 'foods' ? (
        <>
          {/* ── Filter chips ─────────────────────────────────────── */}
          <View style={styles.filterRow}>
            {([
              { key: 'this-month', label: `This Month (${ageMonths}m)` },
              { key: 'all',        label: `All (${availableFoods.length})` },
              { key: 'introduced', label: `Introduced (${introducedFoods.length})` },
            ] as { key: FilterTab; label: string }[]).map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, filterTab === f.key && styles.filterChipActive]}
                onPress={() => setFilterTab(f.key)}
              >
                <Text style={[styles.filterChipText, filterTab === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {weaningLoading ? (
              <ActivityIndicator color="#2D7A3A" style={{ marginTop: 40 }} />
            ) : filteredFoods.length === 0 ? (
              <View style={styles.center}>
                <Text style={styles.emptyEmoji}>🍼</Text>
                <Text style={styles.emptyText}>
                  {filterTab === 'introduced'
                    ? 'No foods introduced yet. Tap a food to mark it!'
                    : 'No foods for this filter.'}
                </Text>
              </View>
            ) : (
              <View style={styles.grid}>
                {filteredFoods.map((food) => {
                  const entry = introducedMap.get(food.id);
                  const catColor = CATEGORY_COLORS[food.category];
                  return (
                    <TouchableOpacity
                      key={food.id}
                      style={[styles.foodCard, entry && styles.foodCardIntroduced]}
                      onPress={() => openModal(food)}
                      activeOpacity={0.75}
                    >
                      {entry && (
                        <View style={styles.checkBadge}>
                          <Text style={{ fontSize: 12 }}>
                            {REACTION_OPTIONS.find((r) => r.value === entry.reaction)?.emoji ?? '✅'}
                          </Text>
                        </View>
                      )}
                      {food.isAllergen && (
                        <View style={styles.allergenBadge}>
                          <Text style={styles.allergenText}>⚠️</Text>
                        </View>
                      )}
                      <Text style={styles.foodEmoji}>{food.emoji}</Text>
                      <Text style={styles.foodName} numberOfLines={2}>{food.name}</Text>
                      <Text style={styles.foodHindi} numberOfLines={1}>{food.hindiName}</Text>
                      <View style={[styles.catBadge, { backgroundColor: catColor + '20' }]}>
                        <Text style={[styles.catBadgeText, { color: catColor }]}>
                          {CATEGORY_LABELS[food.category]}
                        </Text>
                      </View>
                      <Text style={styles.ageBadge}>{food.minMonths}m+</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </>
      ) : (
        /* ── Meal Plan Tab ─────────────────────────────────────────── */
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {ageMonths < 6 ? (
            <View style={[styles.center, { paddingTop: 40 }]}>
              <Text style={{ fontSize: 48 }}>🍼</Text>
              <Text style={[styles.emptyText, { textAlign: 'center', marginTop: 12 }]}>
                {"Exclusive breast milk or formula until 6 months.\nWeaning meal plan will appear here!"}
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.mealPlanHeader}>
                <Text style={styles.mealPlanTitle}>Today's Meal Plan</Text>
                <Text style={styles.mealPlanSub}>Based on {activeBaby.name}'s age & introduced foods</Text>
              </View>
              {mealPlan.map((meal) => (
                <View key={meal.slot} style={styles.mealCard}>
                  <View style={styles.mealCardTop}>
                    <Text style={styles.mealEmoji}>{meal.emoji}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.mealSlot}>
                        {meal.slot === 'breakfast' ? '☀️ Breakfast' : meal.slot === 'lunch' ? '🌤 Lunch' : '🌙 Dinner'}
                      </Text>
                      <Text style={styles.mealTitle}>{meal.title}</Text>
                      <Text style={styles.mealDesc}>{meal.description}</Text>
                    </View>
                  </View>
                  <View style={styles.mealTip}>
                    <Ionicons name="bulb-outline" size={14} color="#B8860B" />
                    <Text style={styles.mealTipText}>{meal.tip}</Text>
                  </View>
                </View>
              ))}
              <View style={styles.mealNote}>
                <Text style={styles.mealNoteText}>
                  💡 Introduce one new food at a time, wait 3 days before the next.
                  Always offer breast milk / formula first until 12 months.
                </Text>
              </View>
            </>
          )}
        </ScrollView>
      )}

      {/* ── Food Detail Modal ───────────────────────────────────────── */}
      <Modal visible={!!selectedFood} animationType="slide" transparent onRequestClose={() => setSelectedFood(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <View style={styles.modalHandle} />

            {selectedFood && (
              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalEmoji}>{selectedFood.emoji}</Text>
                <Text style={styles.modalFoodName}>{selectedFood.name}</Text>
                <Text style={styles.modalHindi}>{selectedFood.hindiName}</Text>

                <View style={styles.modalBadgeRow}>
                  <View style={[styles.catBadge, { backgroundColor: CATEGORY_COLORS[selectedFood.category] + '20' }]}>
                    <Text style={[styles.catBadgeText, { color: CATEGORY_COLORS[selectedFood.category] }]}>
                      {CATEGORY_LABELS[selectedFood.category]}
                    </Text>
                  </View>
                  <View style={styles.textureBadge}>
                    <Text style={styles.textureBadgeText}>{TEXTURE_LABELS[selectedFood.texture]}</Text>
                  </View>
                  <View style={styles.agePillBadge}>
                    <Text style={styles.agePillText}>{selectedFood.minMonths}m+</Text>
                  </View>
                </View>

                {selectedFood.isAllergen && (
                  <View style={styles.allergenBox}>
                    <Text style={styles.allergenBoxText}>
                      ⚠️ Common Allergen — introduce alone & wait 3 days
                    </Text>
                  </View>
                )}

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>✨ Benefits</Text>
                  <Text style={styles.modalBody}>{selectedFood.benefits}</Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalLabel}>🥄 How to Introduce</Text>
                  <Text style={styles.modalBody}>{selectedFood.howToIntroduce}</Text>
                </View>

                {selectedFood.warning && (
                  <View style={[styles.modalSection, styles.warningBox]}>
                    <Text style={styles.warningText}>⚠️ {selectedFood.warning}</Text>
                  </View>
                )}

                {introEntry ? (
                  /* Already introduced */
                  <View style={styles.alreadyIntroduced}>
                    <Text style={styles.alreadyTitle}>
                      {REACTION_OPTIONS.find((r) => r.value === introEntry.reaction)?.emoji}{' '}
                      Introduced on {introEntry.dateIntroduced.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </Text>
                    {introEntry.notes && <Text style={styles.alreadyNotes}>{introEntry.notes}</Text>}
                    <TouchableOpacity style={styles.removeBtn} onPress={handleRemove}>
                      <Text style={styles.removeBtnText}>Remove Introduction</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  /* Mark as introduced */
                  <View style={styles.introduceSection}>
                    <Text style={styles.modalLabel}>How did it go?</Text>
                    <View style={styles.reactionRow}>
                      {REACTION_OPTIONS.map((r) => (
                        <TouchableOpacity
                          key={r.value}
                          style={[styles.reactionBtn, modalReaction === r.value && { borderColor: r.color, backgroundColor: r.color + '15' }]}
                          onPress={() => setModalReaction(r.value)}
                        >
                          <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                          <Text style={[styles.reactionLabel, modalReaction === r.value && { color: r.color }]}>{r.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Notes (optional)…"
                      placeholderTextColor={Colors.textSecondary}
                      value={modalNotes}
                      onChangeText={setModalNotes}
                      multiline
                    />
                    <TouchableOpacity
                      style={[styles.introduceBtn, saving && { opacity: 0.6 }]}
                      onPress={handleIntroduce}
                      disabled={saving}
                    >
                      <LinearGradient colors={['#2D7A3A', '#1A5228']} style={styles.introduceBtnGrad}>
                        {saving
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.introduceBtnText}>✅ Mark as Introduced</Text>}
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelectedFood(null)}>
                  <Text style={styles.closeBtnText}>Close</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container:          { flex: 1, backgroundColor: Colors.background },
  center:             { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing['2xl'] },
  emptyEmoji:         { fontSize: 48, marginBottom: Spacing.md },
  emptyText:          { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },

  // Header
  header:             { paddingBottom: Spacing.xl },
  headerContent:      { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:        { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:          { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: Spacing.md },
  progressRow:        { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  progressPill:       { backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: Radius.full, paddingHorizontal: Spacing.md, paddingVertical: 4 },
  progressText:       { fontSize: Typography.sm, color: '#fff', fontWeight: '600' },

  // Main tabs
  mainTabs:           { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  mainTab:            { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  mainTabActive:      { borderBottomWidth: 2, borderBottomColor: '#2D7A3A' },
  mainTabText:        { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  mainTabTextActive:  { color: '#2D7A3A' },

  // Filter chips
  filterRow:          { flexDirection: 'row', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm, backgroundColor: Colors.surface },
  filterChip:         { paddingHorizontal: Spacing.md, paddingVertical: 6, borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.background },
  filterChipActive:   { borderColor: '#2D7A3A', backgroundColor: '#2D7A3A15' },
  filterChipText:     { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  filterChipTextActive: { color: '#2D7A3A' },

  // Food grid
  scroll:             { padding: Spacing.lg, paddingBottom: 40 },
  grid:               { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  foodCard:           {
    width: '47%', backgroundColor: Colors.surface, borderRadius: Radius['2xl'],
    padding: Spacing.md, ...Shadows.md, position: 'relative',
  },
  foodCardIntroduced: { borderWidth: 1.5, borderColor: '#2D7A3A' },
  checkBadge:         { position: 'absolute', top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: '#2D7A3A20', alignItems: 'center', justifyContent: 'center' },
  allergenBadge:      { position: 'absolute', top: 8, left: 8 },
  allergenText:       { fontSize: 12 },
  foodEmoji:          { fontSize: 32, marginBottom: 6 },
  foodName:           { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 2 },
  foodHindi:          { fontSize: Typography.xs, color: Colors.textSecondary, marginBottom: Spacing.sm },
  catBadge:           { alignSelf: 'flex-start', borderRadius: Radius.full, paddingHorizontal: 8, paddingVertical: 2, marginBottom: 4 },
  catBadgeText:       { fontSize: 10, fontWeight: '700' },
  ageBadge:           { fontSize: 10, color: Colors.textSecondary },

  // Meal plan
  mealPlanHeader:     { marginBottom: Spacing.lg },
  mealPlanTitle:      { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  mealPlanSub:        { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  mealCard:           { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  mealCardTop:        { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  mealEmoji:          { fontSize: 36 },
  mealSlot:           { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600', marginBottom: 2 },
  mealTitle:          { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  mealDesc:           { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  mealTip:            { flexDirection: 'row', gap: 6, marginTop: Spacing.md, padding: Spacing.sm, backgroundColor: '#B8860B10', borderRadius: Radius.lg, alignItems: 'flex-start' },
  mealTipText:        { fontSize: Typography.xs, color: '#7A5A00', flex: 1, lineHeight: 18 },
  mealNote:           { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, marginTop: Spacing.sm },
  mealNoteText:       { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },

  // Modal
  modalOverlay:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalSheet:         { backgroundColor: Colors.surface, borderTopLeftRadius: Radius['2xl'], borderTopRightRadius: Radius['2xl'], padding: Spacing.xl, maxHeight: '90%' },
  modalHandle:        { width: 40, height: 4, backgroundColor: Colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: Spacing.lg },
  modalEmoji:         { fontSize: 56, textAlign: 'center', marginBottom: Spacing.sm },
  modalFoodName:      { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary, textAlign: 'center' },
  modalHindi:         { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', marginBottom: Spacing.md },
  modalBadgeRow:      { flexDirection: 'row', gap: Spacing.sm, justifyContent: 'center', marginBottom: Spacing.md, flexWrap: 'wrap' },
  textureBadge:       { backgroundColor: Colors.background, borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  textureBadgeText:   { fontSize: Typography.xs, color: Colors.textSecondary, fontWeight: '600' },
  agePillBadge:       { backgroundColor: '#006B6B20', borderRadius: Radius.full, paddingHorizontal: 10, paddingVertical: 4 },
  agePillText:        { fontSize: Typography.xs, color: '#006B6B', fontWeight: '700' },
  allergenBox:        { backgroundColor: '#C0392B15', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#C0392B40' },
  allergenBoxText:    { fontSize: Typography.sm, color: '#C0392B', fontWeight: '600' },
  modalSection:       { marginBottom: Spacing.md },
  modalLabel:         { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary, marginBottom: 4 },
  modalBody:          { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  warningBox:         { backgroundColor: '#F39C1215', borderRadius: Radius.lg, padding: Spacing.md, borderWidth: 1, borderColor: '#F39C1240' },
  warningText:        { fontSize: Typography.sm, color: '#7A5A00', lineHeight: 20 },

  // Already introduced
  alreadyIntroduced:  { backgroundColor: '#2D7A3A10', borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md, borderWidth: 1, borderColor: '#2D7A3A30' },
  alreadyTitle:       { fontSize: Typography.base, fontWeight: '700', color: '#2D7A3A', marginBottom: 4 },
  alreadyNotes:       { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  removeBtn:          { marginTop: Spacing.md, alignSelf: 'flex-start', borderWidth: 1, borderColor: Colors.error, borderRadius: Radius.lg, paddingHorizontal: Spacing.md, paddingVertical: 6 },
  removeBtnText:      { fontSize: Typography.sm, color: Colors.error, fontWeight: '600' },

  // Mark as introduced
  introduceSection:   { marginBottom: Spacing.md },
  reactionRow:        { flexDirection: 'row', gap: Spacing.sm, marginVertical: Spacing.md },
  reactionBtn:        { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.sm, alignItems: 'center', gap: 4 },
  reactionEmoji:      { fontSize: 22 },
  reactionLabel:      { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  notesInput:         { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.sm, color: Colors.textPrimary, minHeight: 60, marginBottom: Spacing.md },
  introduceBtn:       { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md },
  introduceBtnGrad:   { paddingVertical: 14, alignItems: 'center' },
  introduceBtnText:   { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  closeBtn:           { alignItems: 'center', paddingVertical: Spacing.md },
  closeBtnText:       { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
});
