import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ScrollView, ListRenderItemInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Typography, Shadows } from '@theme/index';
import RangoliBorder from '@components/common/RangoliBorder';
import { useBabyStore } from '@store/babyStore';
import { differenceInWeeks } from 'date-fns';

// ─── Food data ────────────────────────────────────────────────────────────────

interface FoodItem {
  id: string;
  name: string;
  hindiName: string;
  emoji: string;
  minAgeWeeks: number;
  category: FoodCategory;
  benefits: string;
  howTo: string;
  caution?: string;
}

type FoodCategory = 'grain' | 'vegetable' | 'fruit' | 'protein' | 'dairy' | 'spice';

const CATEGORY_LABELS: Record<FoodCategory, { label: string; emoji: string; color: string }> = {
  grain:     { label: 'Grains / Anaj',    emoji: '🌾', color: Colors.secondary },
  vegetable: { label: 'Veggies / Sabzi',  emoji: '🥦', color: Colors.mehendi },
  fruit:     { label: 'Fruits / Phal',    emoji: '🍎', color: Colors.rose },
  protein:   { label: 'Protein / Dal',    emoji: '🫘', color: Colors.primary },
  dairy:     { label: 'Dairy / Dudh',     emoji: '🥛', color: Colors.accent },
  spice:     { label: 'Spices / Masale',  emoji: '🌿', color: Colors.peacock },
};

const AGE_STAGES = [
  { label: '6 months', weeks: 26 },
  { label: '7 months', weeks: 30 },
  { label: '8 months', weeks: 34 },
  { label: '9 months', weeks: 39 },
  { label: '12 months', weeks: 52 },
];

const FOODS: FoodItem[] = [
  // 6 months
  {
    id: 'rice_water', name: 'Rice Water (Maand)', hindiName: 'माड़', emoji: '🍚',
    minAgeWeeks: 26, category: 'grain',
    benefits: 'Easy to digest, soothes tummy. First ever food in many Indian families.',
    howTo: 'Boil rice in 3x water. Strain the cloudy water. Cool and feed with spoon.',
  },
  {
    id: 'rice_porridge', name: 'Rice Porridge (Kanji)', hindiName: 'कांजी', emoji: '🍲',
    minAgeWeeks: 26, category: 'grain',
    benefits: 'Soft, easy-to-digest carbs. First solid food recommended by Indian pediatricians.',
    howTo: 'Cook 1 tbsp rice in 1 cup water until very soft. Mash well. No salt.',
  },
  {
    id: 'banana', name: 'Banana', hindiName: 'केला', emoji: '🍌',
    minAgeWeeks: 26, category: 'fruit',
    benefits: 'Natural energy, potassium, easy to mash. Dadi ki pehli pasand!',
    howTo: 'Mash ripe banana with a fork until smooth. Add breastmilk to thin if needed.',
  },
  {
    id: 'potato', name: 'Potato Puree', hindiName: 'आलू', emoji: '🥔',
    minAgeWeeks: 26, category: 'vegetable',
    benefits: 'Soft texture, mild taste. Good source of carbs and Vitamin C.',
    howTo: 'Boil/steam potato until very soft. Mash with breastmilk. No salt or butter yet.',
  },
  {
    id: 'sweet_potato', name: 'Sweet Potato', hindiName: 'शकरकंद', emoji: '🍠',
    minAgeWeeks: 26, category: 'vegetable',
    benefits: 'Rich in beta-carotene (Vitamin A), naturally sweet. Babies love it!',
    howTo: 'Steam until soft, blend smooth. Add water/breastmilk to desired consistency.',
  },
  {
    id: 'moong_dal', name: 'Moong Dal Water', hindiName: 'मूंग दाल', emoji: '🫘',
    minAgeWeeks: 26, category: 'protein',
    benefits: 'Lightest lentil, easy to digest, high protein. Perfect first protein source.',
    howTo: 'Soak moong dal 1hr. Boil until mushy. Strain or blend smooth. No salt initially.',
  },
  // 7 months
  {
    id: 'khichdi', name: 'Khichdi', hindiName: 'खिचड़ी', emoji: '🍛',
    minAgeWeeks: 30, category: 'grain',
    benefits: 'Complete protein+carb combination. Indian superfood for babies. Dadi swear by it!',
    howTo: 'Cook rice + moong dal in 4:1 water ratio until very mushy. Add tiny pinch of turmeric. Mash well.',
    caution: 'Add salt only after 12 months.',
  },
  {
    id: 'carrot', name: 'Carrot Puree', hindiName: 'गाजर', emoji: '🥕',
    minAgeWeeks: 30, category: 'vegetable',
    benefits: 'High Vitamin A for eye development. Natural sweetness babies enjoy.',
    howTo: 'Steam carrot pieces until soft. Blend smooth with a little water.',
  },
  {
    id: 'apple', name: 'Apple Puree / Seb', hindiName: 'सेब', emoji: '🍎',
    minAgeWeeks: 30, category: 'fruit',
    benefits: 'Fiber, Vitamin C. Helps with digestion. Naturally sweet.',
    howTo: 'Peel, core, steam apple pieces. Blend smooth or cook down to sauce.',
  },
  {
    id: 'pear', name: 'Pear / Nashpati', hindiName: 'नाशपाती', emoji: '🍐',
    minAgeWeeks: 30, category: 'fruit',
    benefits: 'Gentle on tummy, helps prevent constipation. High water content.',
    howTo: 'Steam pear until very soft. Mash or blend with a little cooking liquid.',
  },
  {
    id: 'pumpkin', name: 'Pumpkin / Kaddu', hindiName: 'कद्दू', emoji: '🎃',
    minAgeWeeks: 30, category: 'vegetable',
    benefits: 'Beta-carotene, Vitamin A & C. Naturally sweet, very easy to digest.',
    howTo: 'Peel, cube, steam pumpkin. Mash or blend smooth.',
  },
  // 8 months
  {
    id: 'paneer', name: 'Soft Paneer', hindiName: 'पनीर', emoji: '🧀',
    minAgeWeeks: 34, category: 'dairy',
    benefits: 'Excellent protein & calcium for bone growth. Easy for babies to mash with gums.',
    howTo: 'Crumble or cut fresh soft paneer into tiny pieces. Mix with khichdi or puree.',
    caution: 'Use fresh homemade paneer. Avoid market paneer which may be hard.',
  },
  {
    id: 'curd', name: 'Curd / Dahi', hindiName: 'दही', emoji: '🥛',
    minAgeWeeks: 34, category: 'dairy',
    benefits: 'Probiotics for gut health, calcium, protein. Cooling in summer.',
    howTo: 'Plain full-fat homemade dahi. Mix with mashed banana or fruit puree for taste.',
    caution: 'Not in cold/rainy season if baby catches cold easily — old Indian wisdom!',
  },
  {
    id: 'spinach', name: 'Spinach / Palak', hindiName: 'पालक', emoji: '🥬',
    minAgeWeeks: 34, category: 'vegetable',
    benefits: 'Iron, folate, Vitamin K. Essential for blood development.',
    howTo: 'Blanch spinach leaves, blend smooth. Mix into khichdi or dal. Small amounts initially.',
  },
  {
    id: 'ragi', name: 'Ragi Porridge', hindiName: 'रागी', emoji: '🌾',
    minAgeWeeks: 34, category: 'grain',
    benefits: 'Highest calcium of any grain — even more than milk! Traditional South Indian baby food.',
    howTo: 'Mix ragi flour with water to thin paste. Cook 5-7 min stirring constantly. Add jaggery water.',
  },
  // 9 months
  {
    id: 'chiku', name: 'Chikoo / Sapota', hindiName: 'चीकू', emoji: '🍑',
    minAgeWeeks: 39, category: 'fruit',
    benefits: 'High natural sugar for instant energy. Rich in iron and folate.',
    howTo: 'Peel ripe chikoo, remove seeds, mash smooth. Mix with curd or banana.',
  },
  {
    id: 'dal_rice', name: 'Dal Chawal', hindiName: 'दाल चावल', emoji: '🍚',
    minAgeWeeks: 39, category: 'protein',
    benefits: 'Complete amino acid profile. The perfect Indian baby meal — every dadi knows this!',
    howTo: 'Cook toor/masoor dal and rice together until mushy. Add ghee (1/4 tsp). Mash well.',
  },
  {
    id: 'ghee', name: 'Desi Ghee', hindiName: 'देसी घी', emoji: '🧈',
    minAgeWeeks: 39, category: 'dairy',
    benefits: 'Healthy fats for brain development. Helps weight gain. Indian tradition for 1000 years!',
    howTo: 'Add 1/4 tsp of pure desi ghee to khichdi/dal. Increases calorie density.',
  },
  {
    id: 'turmeric', name: 'Haldi (tiny pinch)', hindiName: 'हल्दी', emoji: '🌿',
    minAgeWeeks: 39, category: 'spice',
    benefits: 'Anti-inflammatory, anti-bacterial. Builds immunity. Ayurvedic gold!',
    howTo: 'Add just a small pinch to khichdi or cooked vegetables. Start with very little.',
    caution: 'Only a tiny pinch — very strong. Monitor for any reactions.',
  },
  // 12 months
  {
    id: 'egg', name: 'Egg / Anda', hindiName: 'अंडा', emoji: '🥚',
    minAgeWeeks: 52, category: 'protein',
    benefits: 'Complete protein, choline for brain development, Vitamin D.',
    howTo: 'Start with well-cooked scrambled egg yolk only. Wait 3 days to check for allergy.',
    caution: 'Introduce slowly. Some families avoid egg — respect family dietary choices.',
  },
  {
    id: 'chapati', name: 'Soft Chapati', hindiName: 'चपाती', emoji: '🫓',
    minAgeWeeks: 52, category: 'grain',
    benefits: 'Iron-fortified wheat, fiber. Helps develop chewing and self-feeding skills.',
    howTo: 'Soak small pieces of soft chapati in dal or milk. Baby can also self-feed small pieces.',
  },
  {
    id: 'mango', name: 'Mango / Aam', hindiName: 'आम', emoji: '🥭',
    minAgeWeeks: 52, category: 'fruit',
    benefits: 'King of fruits! Vitamins A, C, B6. Fiber. Indian summer favourite.',
    howTo: 'Ripe Alphonso or Kesar mango — mash or blend. Avoid raw/unripe mango.',
    caution: 'Only in season. Introduce slowly — some babies get rash from excess.',
  },
];

// ─── Components ───────────────────────────────────────────────────────────────

const FoodCard = memo(({ food, expanded, onPress }: {
  food: FoodItem;
  expanded: boolean;
  onPress: () => void;
}) => {
  const cat = CATEGORY_LABELS[food.category];
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <Text style={styles.cardEmoji}>{food.emoji}</Text>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{food.name}</Text>
          <Text style={styles.cardHindi}>{food.hindiName}</Text>
          <View style={[styles.catBadge, { backgroundColor: cat.color + '18' }]}>
            <Text style={[styles.catText, { color: cat.color }]}>{cat.emoji} {cat.label}</Text>
          </View>
        </View>
        <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={18} color={Colors.textTertiary} />
      </View>

      {expanded && (
        <View style={styles.cardBody}>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>💚 Faida / Benefits</Text>
            <Text style={styles.sectionText}>{food.benefits}</Text>
          </View>
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>👩‍🍳 Kaise Banayein / How to</Text>
            <Text style={styles.sectionText}>{food.howTo}</Text>
          </View>
          {food.caution && (
            <View style={[styles.section, styles.cautionBox]}>
              <Text style={styles.cautionLabel}>⚠️ Dhyan Rakhein</Text>
              <Text style={styles.cautionText}>{food.caution}</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BabyFoodGuideScreen() {
  const { activeBaby } = useBabyStore();
  const [activeCategory, setActiveCategory] = useState<FoodCategory | 'all'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [ageFilter, setAgeFilter] = useState<number | null>(null);

  const babyAgeWeeks = activeBaby
    ? differenceInWeeks(new Date(), activeBaby.birthDate)
    : 0;

  const appropriateMin = babyAgeWeeks >= 26 ? babyAgeWeeks : 26;

  const filtered = useMemo(() => {
    return FOODS.filter((f) => {
      const ageOk = ageFilter !== null ? f.minAgeWeeks <= ageFilter : f.minAgeWeeks <= appropriateMin;
      const catOk = activeCategory === 'all' || f.category === activeCategory;
      return ageOk && catOk;
    });
  }, [activeCategory, ageFilter, appropriateMin]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<FoodItem>) => (
    <FoodCard
      food={item}
      expanded={expandedId === item.id}
      onPress={() => toggleExpand(item.id)}
    />
  ), [expandedId, toggleExpand]);

  const keyExtractor = useCallback((item: FoodItem) => item.id, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={[Colors.mehendi, '#3D5020']}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>🍲 Baby Food Guide</Text>
        <Text style={styles.headerSub}>
          {activeBaby
            ? `${activeBaby.name} ke liye — ${babyAgeWeeks} weeks old`
            : 'Age-appropriate Indian foods'}
        </Text>
        <RangoliBorder style={styles.rangoli} dotSize={6} />
      </LinearGradient>

      {/* Age stage chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.ageRow}
        contentContainerStyle={styles.ageRowContent}
      >
        <TouchableOpacity
          style={[styles.ageChip, ageFilter === null && styles.ageChipActive]}
          onPress={() => setAgeFilter(null)}
        >
          <Text style={[styles.ageChipText, ageFilter === null && styles.ageChipTextActive]}>
            {activeBaby ? `${activeBaby.name} ki age` : 'Current age'}
          </Text>
        </TouchableOpacity>
        {AGE_STAGES.map((s) => (
          <TouchableOpacity
            key={s.weeks}
            style={[styles.ageChip, ageFilter === s.weeks && styles.ageChipActive]}
            onPress={() => setAgeFilter(s.weeks)}
          >
            <Text style={[styles.ageChipText, ageFilter === s.weeks && styles.ageChipTextActive]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Category filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.catRow}
        contentContainerStyle={styles.ageRowContent}
      >
        <TouchableOpacity
          style={[styles.catChip, activeCategory === 'all' && { backgroundColor: Colors.mehendi }]}
          onPress={() => setActiveCategory('all')}
        >
          <Text style={[styles.catChipText, activeCategory === 'all' && { color: '#fff' }]}>🌟 Sab</Text>
        </TouchableOpacity>
        {(Object.keys(CATEGORY_LABELS) as FoodCategory[]).map((cat) => {
          const c = CATEGORY_LABELS[cat];
          const active = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, active && { backgroundColor: c.color }]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catChipText, active && { color: '#fff' }]}>
                {c.emoji} {c.label.split(' /')[0]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Count */}
      <Text style={styles.countText}>{filtered.length} foods available now</Text>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={{ fontSize: 32 }}>🌱</Text>
            <Text style={styles.emptyText}>Koi food nahi mila. Age filter change karo.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  rangoli: { marginTop: 12 },
  ageRow: { maxHeight: 52 },
  ageRowContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: 8 },
  ageChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  ageChipActive: { backgroundColor: Colors.peacock, borderColor: Colors.peacock },
  ageChipText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  ageChipTextActive: { color: '#fff' },
  catRow: { maxHeight: 48 },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  catChipText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  countText: { fontSize: Typography.xs, color: Colors.textTertiary, paddingHorizontal: Spacing.lg, marginVertical: 8 },
  list: { paddingHorizontal: Spacing.base, paddingBottom: 100 },
  card: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    marginBottom: Spacing.sm, overflow: 'hidden', ...Shadows.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: Spacing.base, gap: Spacing.sm },
  cardEmoji: { fontSize: 32, width: 44, textAlign: 'center' },
  cardInfo: { flex: 1, gap: 2 },
  cardName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  cardHindi: { fontSize: Typography.sm, color: Colors.textSecondary },
  catBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 2, borderRadius: Radius.full, marginTop: 4 },
  catText: { fontSize: 10, fontWeight: '600' },
  cardBody: { paddingHorizontal: Spacing.base, paddingBottom: Spacing.base, gap: Spacing.sm, borderTopWidth: 1, borderTopColor: Colors.border },
  section: { gap: 4, paddingTop: Spacing.sm },
  sectionLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  sectionText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 19 },
  cautionBox: { backgroundColor: '#FFF3CD', borderRadius: Radius.md, padding: Spacing.sm, marginTop: 4 },
  cautionLabel: { fontSize: Typography.sm, fontWeight: '700', color: '#856404' },
  cautionText: { fontSize: Typography.sm, color: '#664d03', lineHeight: 18 },
  empty: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.sm },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
});
