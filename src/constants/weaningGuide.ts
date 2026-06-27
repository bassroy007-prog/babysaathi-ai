// ─── Baby Food & Weaning Guide ────────────────────────────────────────────────
// Indian food-first weaning guide for 6–18+ months

export type FoodCategory = 'grain' | 'lentil' | 'veggie' | 'fruit' | 'dairy' | 'protein' | 'fat';
export type FoodTexture = 'liquid' | 'puree' | 'mash' | 'soft-lumps' | 'finger-food';
export type AllergenType = 'dairy' | 'egg' | 'wheat' | 'nut' | 'fish';

export interface WeaningFood {
  id: string;
  name: string;
  hindiName: string;
  emoji: string;
  category: FoodCategory;
  minMonths: number;
  texture: FoodTexture;
  isAllergen: boolean;
  allergenType?: AllergenType;
  benefits: string;
  howToIntroduce: string;
  warning?: string;
}

export interface MealSuggestion {
  slot: 'breakfast' | 'lunch' | 'dinner';
  emoji: string;
  title: string;
  description: string;
  tip: string;
}

export const CATEGORY_COLORS: Record<FoodCategory, string> = {
  grain:   '#B8860B',
  lentil:  '#C05A00',
  veggie:  '#3A7A2E',
  fruit:   '#A0325A',
  dairy:   '#006B6B',
  protein: '#7A4010',
  fat:     '#8B6914',
};

export const CATEGORY_LABELS: Record<FoodCategory, string> = {
  grain:   'Grain',
  lentil:  'Dal',
  veggie:  'Veggie',
  fruit:   'Fruit',
  dairy:   'Dairy',
  protein: 'Protein',
  fat:     'Healthy Fat',
};

export const TEXTURE_LABELS: Record<FoodTexture, string> = {
  'liquid':       'Liquid',
  'puree':        'Smooth Puree',
  'mash':         'Soft Mash',
  'soft-lumps':   'Soft Lumps',
  'finger-food':  'Finger Food',
};

export const WEANING_FOODS: WeaningFood[] = [

  // ── 6 months ────────────────────────────────────────────────────────────────
  {
    id: 'moong_dal_water', name: 'Moong Dal Water', hindiName: 'मूंग दाल पानी', emoji: '🟡',
    category: 'lentil', minMonths: 6, texture: 'liquid', isAllergen: false,
    benefits: 'Easy to digest, protein, iron — ideal first food',
    howToIntroduce: 'Soak moong dal 2 hrs, boil well, strain the water. Start with 2–3 tsp, increase slowly over a week.',
  },
  {
    id: 'rice_kanji', name: 'Rice Kanji', hindiName: 'चावल कांजी', emoji: '🍚',
    category: 'grain', minMonths: 6, texture: 'liquid', isAllergen: false,
    benefits: 'Easily digestible, energy-rich, very gentle on baby tummy',
    howToIntroduce: 'Cook rice with 5× water until very soft. Blend smooth, strain. Offer after breast milk.',
  },
  {
    id: 'apple_puree', name: 'Apple Puree', hindiName: 'सेब प्यूरी', emoji: '🍎',
    category: 'fruit', minMonths: 6, texture: 'puree', isAllergen: false,
    benefits: 'Vitamin C, fiber, gentle natural sweetness',
    howToIntroduce: 'Peel, steam apple pieces until soft, blend smooth. No sugar needed. Start with 1–2 tsp.',
  },
  {
    id: 'banana_mash', name: 'Banana Mash', hindiName: 'केला मैश', emoji: '🍌',
    category: 'fruit', minMonths: 6, texture: 'mash', isAllergen: false,
    benefits: 'Potassium, instant energy, natural sweetness — baby favorite!',
    howToIntroduce: 'Mash ripe banana with back of fork. Mix with a little breast milk if too thick. Ready in 1 min!',
  },
  {
    id: 'sweet_potato', name: 'Sweet Potato Puree', hindiName: 'शकरकंद प्यूरी', emoji: '🍠',
    category: 'veggie', minMonths: 6, texture: 'puree', isAllergen: false,
    benefits: 'Beta-carotene (Vitamin A), fiber, naturally sweet — babies love it',
    howToIntroduce: 'Steam or bake sweet potato until very soft. Blend with breast milk or water until smooth.',
  },
  {
    id: 'pumpkin_puree', name: 'Pumpkin Puree', hindiName: 'कद्दू प्यूरी', emoji: '🎃',
    category: 'veggie', minMonths: 6, texture: 'puree', isAllergen: false,
    benefits: 'Vitamin A, iron, antioxidants — easy on digestion',
    howToIntroduce: 'Steam kaddu pieces until very soft, blend smooth. No salt or spice at 6 months.',
  },
  {
    id: 'carrot_puree', name: 'Carrot Puree', hindiName: 'गाजर प्यूरी', emoji: '🥕',
    category: 'veggie', minMonths: 6, texture: 'puree', isAllergen: false,
    benefits: 'Beta-carotene, Vitamin A, mild natural sweetness',
    howToIntroduce: 'Boil gajars until very tender, blend with cooking water. Offer 2 tsp to start.',
  },

  // ── 7 months ────────────────────────────────────────────────────────────────
  {
    id: 'khichdi', name: 'Khichdi', hindiName: 'खिचड़ी', emoji: '🥣',
    category: 'grain', minMonths: 7, texture: 'mash', isAllergen: false,
    benefits: 'Complete protein (rice + dal), iron, zinc — India\'s superfood!',
    howToIntroduce: 'Cook rice + moong dal 1:1 with extra water until very soft. No salt. Add tiny ghee.',
    warning: 'No salt before 1 year — baby kidneys are still developing.',
  },
  {
    id: 'ragi_porridge', name: 'Ragi Porridge', hindiName: 'रागी दलिया', emoji: '🌾',
    category: 'grain', minMonths: 7, texture: 'puree', isAllergen: false,
    benefits: 'Calcium powerhouse — more calcium than milk! Iron, fiber, amino acids.',
    howToIntroduce: 'Mix ragi flour with water to a paste, cook 10 min stirring constantly. Can add mashed banana.',
  },
  {
    id: 'suji_porridge', name: 'Suji Porridge', hindiName: 'सूजी दलिया', emoji: '🫙',
    category: 'grain', minMonths: 7, texture: 'puree', isAllergen: true, allergenType: 'wheat',
    benefits: 'Iron-fortified, smooth texture, easy to digest',
    howToIntroduce: 'Dry roast suji, add water and cook to smooth porridge. Add mashed fruit for flavor.',
    warning: 'Contains wheat — introduce alone, wait 3 days before next new food.',
  },
  {
    id: 'pear_puree', name: 'Pear Puree', hindiName: 'नाशपाती प्यूरी', emoji: '🍐',
    category: 'fruit', minMonths: 7, texture: 'puree', isAllergen: false,
    benefits: 'Fiber, Vitamin C — excellent for constipation relief',
    howToIntroduce: 'Peel, steam, blend smooth. Mild sweet taste — most babies love it on first try.',
  },
  {
    id: 'papaya_mash', name: 'Papaya Mash', hindiName: 'पपीता मैश', emoji: '🧡',
    category: 'fruit', minMonths: 7, texture: 'mash', isAllergen: false,
    benefits: 'Papain enzyme aids digestion, rich Vitamin A & C',
    howToIntroduce: 'Use fully ripe papaya only. Mash with fork — no cooking needed. Start with 1 tsp.',
    warning: 'Only ripe papaya — raw or unripe papaya is NOT safe for babies.',
  },
  {
    id: 'spinach_puree', name: 'Spinach Puree', hindiName: 'पालक प्यूरी', emoji: '🥬',
    category: 'veggie', minMonths: 7, texture: 'puree', isAllergen: false,
    benefits: 'Iron, folate, calcium. Mix with apple to make it palatable.',
    howToIntroduce: 'Wash paalak thoroughly, blanch 1–2 min, blend smooth. Mix with khichdi or sweet potato.',
    warning: 'Limit to 2–3× per week — excess nitrates can be harmful.',
  },
  {
    id: 'lauki_puree', name: 'Bottle Gourd Puree', hindiName: 'लौकी प्यूरी', emoji: '🥒',
    category: 'veggie', minMonths: 7, texture: 'puree', isAllergen: false,
    benefits: 'Very easy to digest, high water content, cooling — great in summer',
    howToIntroduce: 'Peel, dice, steam until very soft, blend smooth. Excellent base for mixed veggie puree.',
  },

  // ── 8 months ────────────────────────────────────────────────────────────────
  {
    id: 'paneer', name: 'Paneer (Soft)', hindiName: 'पनीर', emoji: '🧀',
    category: 'dairy', minMonths: 8, texture: 'mash', isAllergen: true, allergenType: 'dairy',
    benefits: 'Calcium, protein, healthy fat — excellent for brain development',
    howToIntroduce: 'Crumble fresh soft paneer, mix into khichdi. Watch for dairy allergy signs for 3 days.',
    warning: 'Dairy allergen — watch for rash, vomiting, or loose stools after giving.',
  },
  {
    id: 'dahi', name: 'Curd / Dahi', hindiName: 'दही', emoji: '🥛',
    category: 'dairy', minMonths: 8, texture: 'puree', isAllergen: true, allergenType: 'dairy',
    benefits: 'Probiotics, calcium, easy protein — great for gut health and immunity',
    howToIntroduce: 'Full-fat plain curd at room temperature. Start with 1–2 tsp. No flavoured or sweetened curd.',
    warning: 'Dairy allergen. Full-fat plain only — no sugar or added flavor before 1 year.',
  },
  {
    id: 'egg_yolk', name: 'Egg Yolk', hindiName: 'अंडे की जर्दी', emoji: '🥚',
    category: 'protein', minMonths: 8, texture: 'mash', isAllergen: true, allergenType: 'egg',
    benefits: 'Choline for brain, iron, Vitamin D, DHA — nutritional powerhouse',
    howToIntroduce: 'Hard boil egg, take only the yolk, mash with breast milk. Start with ¼ yolk.',
    warning: 'Egg allergen — introduce alone, watch 3 days. No egg WHITE before 1 year.',
  },
  {
    id: 'ghee', name: 'Desi Ghee', hindiName: 'देसी घी', emoji: '✨',
    category: 'fat', minMonths: 8, texture: 'liquid', isAllergen: false,
    benefits: 'Healthy fat for brain & nervous system, butyrate supports gut health',
    howToIntroduce: 'Add ¼ tsp to khichdi or dal. Babies need fat — no need to restrict. Dadi was right!',
  },
  {
    id: 'wheat_dalia', name: 'Wheat Dalia', hindiName: 'गेहूं दलिया', emoji: '🌾',
    category: 'grain', minMonths: 8, texture: 'soft-lumps', isAllergen: true, allergenType: 'wheat',
    benefits: 'Iron, B-vitamins, fiber — broken wheat is very nutritious',
    howToIntroduce: 'Cook with plenty of water until mushy. Add ghee, mashed veggies, or a bit of dal.',
    warning: 'Contains wheat gluten — introduce alone, watch 3 days for celiac or allergy signs.',
  },
  {
    id: 'tomato', name: 'Tomato (cooked)', hindiName: 'टमाटर', emoji: '🍅',
    category: 'veggie', minMonths: 8, texture: 'puree', isAllergen: false,
    benefits: 'Lycopene, Vitamin C, antioxidants — adds flavor to khichdi',
    howToIntroduce: 'Peel, remove seeds, cook until very soft. Add to dal or khichdi for natural flavor.',
    warning: 'Can cause rash around mouth if acidic — reduce quantity if this happens.',
  },

  // ── 9 months ────────────────────────────────────────────────────────────────
  {
    id: 'idli', name: 'Soft Idli', hindiName: 'इडली', emoji: '🫓',
    category: 'grain', minMonths: 9, texture: 'soft-lumps', isAllergen: false,
    benefits: 'Fermented for better digestion & nutrition, rice + lentil protein combo',
    howToIntroduce: 'Soft fresh idli, break into small pieces. Dip in thin sambar (no chili). Great first finger food!',
  },
  {
    id: 'banana_pieces', name: 'Banana Pieces', hindiName: 'केले के टुकड़े', emoji: '🍌',
    category: 'fruit', minMonths: 9, texture: 'finger-food', isAllergen: false,
    benefits: 'Potassium, energy — perfect first finger food for pincer grasp!',
    howToIntroduce: 'Cut ripe banana into ½ cm rounds. Let baby self-feed — builds independence!',
  },
  {
    id: 'chicken_soup', name: 'Chicken Soup (clear)', hindiName: 'मुर्ग़ी का सूप', emoji: '🍗',
    category: 'protein', minMonths: 9, texture: 'liquid', isAllergen: false,
    benefits: 'Iron, zinc, protein, immune-boosting — important for non-veg families',
    howToIntroduce: 'Boil chicken until falling off bone, strain clear broth only. Give 2–3 tsp initially.',
  },
  {
    id: 'fish', name: 'Fish (white, boneless)', hindiName: 'मछली', emoji: '🐟',
    category: 'protein', minMonths: 9, texture: 'mash', isAllergen: true, allergenType: 'fish',
    benefits: 'Omega-3 DHA for brain development — best early protein source',
    howToIntroduce: 'Steam white fish (rohu, pomfret), remove ALL bones carefully, mash fine. Start with ½ tsp.',
    warning: 'Fish allergen. Check for ALL bones — a missed bone is a serious choking hazard!',
  },

  // ── 10–12 months ────────────────────────────────────────────────────────────
  {
    id: 'dal_rice_ghee', name: 'Dal Rice with Ghee', hindiName: 'दाल चावल घी', emoji: '🍛',
    category: 'lentil', minMonths: 10, texture: 'soft-lumps', isAllergen: false,
    benefits: 'Complete meal — carbs, protein, healthy fat. India\'s comfort food!',
    howToIntroduce: 'Family dal (less spicy/less salt), mix with soft rice + ½ tsp ghee. Baby joins family meals!',
  },
  {
    id: 'chapati_soft', name: 'Soft Chapati', hindiName: 'नरम रोटी', emoji: '🫓',
    category: 'grain', minMonths: 10, texture: 'finger-food', isAllergen: true, allergenType: 'wheat',
    benefits: 'Iron, fiber, complex carbohydrates — builds independent eating',
    howToIntroduce: 'Tear fresh chapati into small pieces, dip in dal to soften. Fresh hot chapati is softest.',
    warning: 'Wheat allergen — if suji/dalia not tried yet, check for reaction first.',
  },
  {
    id: 'full_egg', name: 'Scrambled Egg', hindiName: 'अंडा भुर्जी', emoji: '🍳',
    category: 'protein', minMonths: 10, texture: 'soft-lumps', isAllergen: true, allergenType: 'egg',
    benefits: 'Complete protein, choline, Vitamin D, B12, DHA — nutritional champion',
    howToIntroduce: 'Scramble soft with no salt. Give small pieces for self-feeding.',
    warning: 'Now includes egg WHITE — new allergen. Watch for hives, swelling, vomiting.',
  },
  {
    id: 'mashed_sabzi', name: 'Mashed Sabzi', hindiName: 'मसली सब्ज़ी', emoji: '🥦',
    category: 'veggie', minMonths: 10, texture: 'soft-lumps', isAllergen: false,
    benefits: 'Vitamins, minerals, fiber from family vegetables',
    howToIntroduce: 'Family sabzi (less spicy + less salt), mash or cut small. Try aloo, matar, beans, bhindi.',
  },

  // ── 12+ months ──────────────────────────────────────────────────────────────
  {
    id: 'whole_milk', name: 'Whole Cow Milk', hindiName: 'गाय का दूध', emoji: '🥛',
    category: 'dairy', minMonths: 12, texture: 'liquid', isAllergen: true, allergenType: 'dairy',
    benefits: 'Calcium, Vitamin D, protein — can now replace formula',
    howToIntroduce: 'Full-fat only. Offer in cup (not bottle). Start 2–3 oz/day, build to 16–24 oz total.',
    warning: 'Not recommended as main drink before 12 months — displaces iron-rich foods.',
  },
  {
    id: 'nut_butter', name: 'Nut Butter (thin)', hindiName: 'मेवे का मक्खन', emoji: '🥜',
    category: 'protein', minMonths: 12, texture: 'puree', isAllergen: true, allergenType: 'nut',
    benefits: 'Healthy fats, protein, Vitamin E — good for brain development',
    howToIntroduce: 'Thin with water to loose consistency. Spread thin on chapati or mix into porridge.',
    warning: 'Nut allergen. NEVER give whole nuts before age 4 — severe choking hazard!',
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

export function getFoodsForAge(ageMonths: number): WeaningFood[] {
  return WEANING_FOODS.filter((f) => f.minMonths <= ageMonths);
}

export function getNewFoodsThisMonth(ageMonths: number): WeaningFood[] {
  return WEANING_FOODS.filter(
    (f) => f.minMonths === ageMonths || f.minMonths === ageMonths - 1
  );
}

export function generateMealPlan(
  ageMonths: number,
  introducedIds: Set<string>
): MealSuggestion[] {
  if (ageMonths < 6) return [];

  const day = new Date().getDay(); // 0–6 for daily variety

  if (ageMonths === 6) {
    return [
      { slot: 'breakfast', emoji: '🍎', title: 'Fruit Puree', description: 'Apple or banana — 1–2 tsp to start', tip: 'One new food every 3 days. Watch for any reaction!' },
      { slot: 'lunch',     emoji: '🟡', title: 'Moong Dal Water', description: 'Strained dal water, 2–3 tsp after breast milk', tip: 'Solid food is just practice at 6 months. Milk is still the main nutrition.' },
      { slot: 'dinner',    emoji: '🍠', title: 'Veggie Puree', description: 'Sweet potato or carrot — 2–3 tsp', tip: 'Offer even if refused — babies need 10–15 exposures to accept new food!' },
    ];
  }

  const hasRagi    = introducedIds.has('ragi_porridge');
  const hasDahi    = introducedIds.has('dahi');
  const hasKhichdi = introducedIds.has('khichdi');
  const hasEgg     = introducedIds.has('full_egg') || introducedIds.has('egg_yolk');

  const breakfasts = [
    { e: hasRagi ? '🌾' : '🫙', t: hasRagi ? 'Ragi Porridge' : 'Suji Porridge', d: 'With mashed banana or apple' },
    { e: '🍎', t: 'Fruit + Grain', d: hasKhichdi ? 'Fruit with a bit of khichdi' : 'Fruit puree with rice kanji' },
    { e: hasEgg && ageMonths >= 10 ? '🍳' : '🥣', t: hasEgg && ageMonths >= 10 ? 'Scrambled Egg' : 'Porridge', d: hasEgg && ageMonths >= 10 ? 'Soft, no salt — great with chapati pieces' : 'With seasonal fruit' },
  ];

  const lunches = [
    { e: '🥣', t: hasKhichdi ? 'Khichdi + Veggies' : 'Rice + Dal', d: 'With lauki, carrot, or spinach. Tiny ghee.' },
    { e: '🍛', t: ageMonths >= 10 ? 'Dal Rice + Sabzi' : 'Veggie Khichdi', d: ageMonths >= 10 ? 'Family meal — less spicy, less salt' : 'Mixed veggies in soft khichdi' },
    { e: '🌾', t: 'Dalia Bowl', d: 'Wheat dalia with veggies and a drizzle of ghee' },
  ];

  const dinners = [
    { e: hasDahi ? '🍐' : '🥕', t: hasDahi ? 'Fruit + Dahi' : 'Veggie Puree', d: hasDahi ? 'Mashed seasonal fruit mixed with plain curd' : 'Pumpkin or sweet potato, light and easy' },
    { e: '🥣', t: 'Soft Khichdi', d: 'Simple, light khichdi — easy on tummy before sleep' },
    { e: ageMonths >= 10 ? '🫓' : '🍌', t: ageMonths >= 10 ? 'Chapati + Dal' : 'Banana + Ragi', d: ageMonths >= 10 ? 'Soft chapati dipped in dal — building finger skills' : 'Mashed banana stirred into ragi porridge' },
  ];

  const b = breakfasts[day % breakfasts.length];
  const l = lunches[day % lunches.length];
  const d = dinners[day % dinners.length];

  return [
    { slot: 'breakfast', emoji: b.e, title: b.t, description: b.d, tip: ageMonths < 8 ? 'Give after breast milk — 2–4 tsp total' : 'Give before breast milk now — 4–6 tbsp' },
    { slot: 'lunch',     emoji: l.e, title: l.t, description: l.d, tip: ageMonths >= 9 ? 'Main meal of the day — 5–8 tbsp' : 'Main meal — 3–5 tsp. Follow baby\'s lead.' },
    { slot: 'dinner',    emoji: d.e, title: d.t, description: d.d, tip: 'Keep dinner light and early — before 7pm for good sleep!' },
  ];
}
