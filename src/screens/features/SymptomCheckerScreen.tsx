import React, { useState, useCallback, useMemo, memo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Typography, Shadows } from '@theme/index';
import RangoliBorder from '@components/common/RangoliBorder';
import { useBabyStore } from '@store/babyStore';
import { differenceInWeeks } from 'date-fns';

// ─── Symptom database ──────────────────────────────────────────────────────────

interface SymptomResult {
  severity: 'home' | 'monitor' | 'doctor' | 'emergency';
  title: string;
  advice: string[];
  indianRemedies?: string[];
  whenToCall: string;
}

interface Symptom {
  id: string;
  label: string;
  hindiLabel: string;
  emoji: string;
  category: SymptomCategory;
  minAgeWeeks?: number; // undefined = any age
  getResult: (ageWeeks: number) => SymptomResult;
}

type SymptomCategory = 'fever' | 'digestion' | 'sleep' | 'skin' | 'breathing' | 'feeding' | 'other';

const CAT_COLORS: Record<SymptomCategory, string> = {
  fever:     Colors.rose,
  digestion: Colors.primary,
  sleep:     Colors.peacock,
  skin:      Colors.secondary,
  breathing: Colors.error ?? '#C0392B',
  feeding:   Colors.accent,
  other:     Colors.mehendi,
};

const CAT_LABELS: Record<SymptomCategory, string> = {
  fever:     '🌡️ Bukhar',
  digestion: '🤢 Pet',
  sleep:     '😴 Neend',
  skin:      '🧴 Skin',
  breathing: '🫁 Saans',
  feeding:   '🍼 Khana',
  other:     '🤒 Other',
};

const SYMPTOMS: Symptom[] = [
  // ── Fever ────────────────────────────────────────────────────────────────────
  {
    id: 'fever_low', label: 'Low Fever (99–100.4°F)', hindiLabel: 'Halka Bukhar', emoji: '🌡️',
    category: 'fever',
    getResult: (ageWeeks) => ({
      severity: ageWeeks < 12 ? 'doctor' : 'monitor',
      title: ageWeeks < 12 ? 'Immediately see doctor' : 'Monitor at home',
      advice: [
        'Keep baby comfortable, light clothing',
        'Breastfeed frequently — stays hydrated',
        'Check temp every 4 hours',
        'Sponge with lukewarm (not cold) water',
      ],
      indianRemedies: ageWeeks >= 26 ? [
        'Tulsi + ginger + honey water (12mo+)',
        'Hing mixed in coconut oil on navel (traditional)',
        'Keep room cool, use a hand fan — no AC directly',
      ] : undefined,
      whenToCall: ageWeeks < 12
        ? 'Under 3 months ANY fever = call doctor immediately!'
        : 'Call if fever exceeds 101°F or lasts more than 2 days',
    }),
  },
  {
    id: 'fever_high', label: 'High Fever (101°F+)', hindiLabel: 'Tej Bukhar', emoji: '🔥',
    category: 'fever',
    getResult: (ageWeeks) => ({
      severity: ageWeeks < 26 ? 'emergency' : 'doctor',
      title: ageWeeks < 26 ? 'Go to hospital NOW' : 'See doctor today',
      advice: [
        'Do NOT give adult medicines',
        'Paracetamol drops only with doctor guidance',
        'Cool room temperature',
        'Keep giving breastmilk/fluids',
        'Do not wrap in heavy blankets',
      ],
      indianRemedies: [],
      whenToCall: 'Call doctor immediately if fever > 102°F or baby seems very lethargic',
    }),
  },
  // ── Digestion ─────────────────────────────────────────────────────────────
  {
    id: 'colic', label: 'Colic / Crying spells', hindiLabel: 'Colic / Dard se rona', emoji: '😭',
    category: 'digestion',
    getResult: () => ({
      severity: 'home',
      title: 'Manage at home',
      advice: [
        'Bicycle legs — gently move legs in cycling motion',
        'Burp properly after every feed',
        'Try different feeding positions',
        'Carrier/babywearing often calms colic',
        'White noise or lori (lullaby) can help',
      ],
      indianRemedies: [
        'Hing (asafoetida) paste on navel — apply diluted in coconut oil',
        'Warm ajwain (carom seed) water for mom if breastfeeding',
        'Gripe water (Woodward\'s) — many Indian moms swear by it',
        'Gentle tummy massage clockwise with sarson ka tel',
      ],
      whenToCall: 'Call if crying is inconsolable for more than 3 hours, or baby has fever',
    }),
  },
  {
    id: 'constipation', label: 'Constipation', hindiLabel: 'Qabz', emoji: '😣',
    category: 'digestion',
    getResult: (ageWeeks) => ({
      severity: 'monitor',
      title: 'Try home remedies first',
      advice: [
        'Breastfed babies can go days without poop — this is normal!',
        'Bicycle leg exercises help move bowels',
        'Tummy massage with warm oil',
        ageWeeks >= 26 ? 'For solids-eating babies: add more water, purees' : 'For EBF babies: this is often not true constipation',
      ],
      indianRemedies: [
        'Warm coconut oil belly massage',
        'Warm bath often helps baby poop',
        ageWeeks >= 52 ? 'Isabgol (psyllium) in warm water for older babies — ask doctor first' : 'Mom eating ghee helps if breastfeeding',
      ],
      whenToCall: 'Call doctor if no poop for 5+ days, blood in stool, or baby is in obvious pain',
    }),
  },
  {
    id: 'diarrhea', label: 'Diarrhea / Loose motions', hindiLabel: 'Dast', emoji: '🤢',
    category: 'digestion',
    getResult: (ageWeeks) => ({
      severity: ageWeeks < 12 ? 'doctor' : 'monitor',
      title: ageWeeks < 12 ? 'See doctor today' : 'Watch for dehydration',
      advice: [
        'Continue breastfeeding — most important!',
        'Watch for dehydration signs: sunken fontanelle, no wet diapers, dry mouth',
        'ORS (oral rehydration solution) if doctor recommends',
        'Avoid solid foods until improves',
        'Wash hands frequently',
      ],
      indianRemedies: [
        'Rice water (maad) — very traditional and effective',
        ageWeeks >= 52 ? 'Curd (dahi) rice — probiotics help' : 'Mom eating curd if breastfeeding',
        'Boiled water with a tiny pinch of salt and sugar if ORS unavailable',
      ],
      whenToCall: 'Call doctor if: no wet diaper 6+ hrs, sunken eyes, blood in stool, vomiting too',
    }),
  },
  // ── Sleep ──────────────────────────────────────────────────────────────────
  {
    id: 'wont_sleep', label: 'Not sleeping / Restless', hindiLabel: 'Neend nahi aa rahi', emoji: '🌙',
    category: 'sleep',
    getResult: (ageWeeks) => ({
      severity: 'home',
      title: 'Try these first',
      advice: [
        'Check last feed time — hunger is #1 reason',
        'Check room temperature (20-22°C ideal)',
        'White noise machine or fan sound',
        'Swaddle younger babies (< 4 months)',
        'Consistent bedtime routine',
      ],
      indianRemedies: [
        'Sarson tel malish (mustard oil massage) before bath',
        'Lori — traditional lullaby works like magic!',
        'Aam panna (raw mango drink) for mom if breastfeeding in summer',
        ageWeeks >= 26 ? 'Warm milk (dadhya) before bed' : 'Head massage with coconut oil — very calming',
      ],
      whenToCall: 'If baby sleeps < 14 hours total per day consistently, consult pediatrician',
    }),
  },
  // ── Skin ──────────────────────────────────────────────────────────────────
  {
    id: 'diaper_rash', label: 'Diaper Rash', hindiLabel: 'Nappy Rash', emoji: '🍑',
    category: 'skin',
    getResult: () => ({
      severity: 'home',
      title: 'Treat at home',
      advice: [
        'Change diaper immediately when wet/soiled',
        'Air time — let baby go diaper-free 15-30 min',
        'Pat dry gently, don\'t rub',
        'Zinc oxide cream or Rash-free cream',
        'Cloth diapers temporarily — more breathable',
      ],
      indianRemedies: [
        'Coconut oil — antimicrobial, soothing. Most effective desi remedy!',
        'Methi (fenugreek) paste — anti-inflammatory, apply thinly',
        'Neem leaves boiled in water for wash',
        'Breast milk — apply and let air dry (antimicrobial properties)',
      ],
      whenToCall: 'See doctor if rash has blisters, is spreading rapidly, or has pus',
    }),
  },
  {
    id: 'jaundice', label: 'Yellow skin (Jaundice?)', hindiLabel: 'Peeli skin (Pilia)', emoji: '💛',
    category: 'skin',
    getResult: (ageWeeks) => ({
      severity: ageWeeks < 4 ? 'doctor' : 'monitor',
      title: ageWeeks < 4 ? 'See doctor today' : 'Monitor carefully',
      advice: [
        'Breastfeed more frequently — flushes bilirubin',
        'Sunlight exposure (indirect morning sun) helps',
        'Doctor may do bilirubin test',
        'Physiological jaundice (1-2 weeks) is normal and resolves',
      ],
      indianRemedies: [
        'Morning sunlight — 10-15 min indirect sun on skin. Traditional and medically validated!',
        'Breastfeed every 2 hours — most important treatment',
      ],
      whenToCall: 'Call if: yellow in whites of eyes, yellow below belly button, very sleepy/won\'t feed',
    }),
  },
  // ── Breathing ─────────────────────────────────────────────────────────────
  {
    id: 'cold_congestion', label: 'Cold / Nasal congestion', hindiLabel: 'Sardi / Naak band', emoji: '🤧',
    category: 'breathing',
    getResult: (ageWeeks) => ({
      severity: ageWeeks < 12 ? 'doctor' : 'home',
      title: ageWeeks < 12 ? 'See doctor for newborns' : 'Manage at home',
      advice: [
        'Elevate head slightly during sleep',
        'Nasal saline drops before feeding',
        'Bulb syringe to clear nostrils',
        'Humidifier in room',
        'Continue breastfeeding — antibodies help recovery',
      ],
      indianRemedies: [
        'Steam inhalation — sit in bathroom with hot shower running (don\'t put near baby)',
        'Sarson tel + camphor (kapur) chest rub — traditional',
        'Tulsi + ginger + mishri kadha for mom if breastfeeding',
        ageWeeks >= 52 ? 'Warm haldi doodh for baby (1yr+)' : 'Ajwain potli (pouch) — warm ajwain in cloth, hold near nostrils',
      ],
      whenToCall: 'Call if: rapid breathing, bluish lips, won\'t feed, high fever, lasts > 10 days',
    }),
  },
  // ── Feeding ───────────────────────────────────────────────────────────────
  {
    id: 'refusing_feed', label: 'Refusing breast/bottle', hindiLabel: 'Doodh nahi pi raha', emoji: '🍼',
    category: 'feeding',
    getResult: (ageWeeks) => ({
      severity: ageWeeks < 8 ? 'doctor' : 'monitor',
      title: 'Check these first',
      advice: [
        'Check for oral thrush (white patches in mouth)',
        'Ear infection can make sucking painful',
        'Try different feeding positions',
        'Feed when baby is calm (not overtired)',
        'Nursing strike is common at 3-4 months',
      ],
      indianRemedies: [
        'Calm environment — no TV, distractions',
        'Skin-to-skin contact often helps reluctant feeders',
        'Offer smaller amounts more frequently',
      ],
      whenToCall: 'Call if: refuses 2+ feeds in a row, fewer than 6 wet diapers/day, losing weight',
    }),
  },
  {
    id: 'vomiting', label: 'Vomiting / Projectile spitting', hindiLabel: 'Ulti / Vomiting', emoji: '🤮',
    category: 'feeding',
    getResult: (ageWeeks) => ({
      severity: ageWeeks < 12 ? 'doctor' : 'monitor',
      title: ageWeeks < 12 ? 'Call doctor today' : 'Watch closely',
      advice: [
        'Normal spitting up is common — projectile vomit is different',
        'Burp more frequently during feeds',
        'Keep upright 20-30 min after feeding',
        'Smaller, more frequent feeds',
        'Avoid overfeeding',
      ],
      indianRemedies: [
        'Ajwain water for mom if breastfeeding — helps with digestion',
        'Kali mirch (black pepper) + ghee for baby belly — old Indian remedy',
      ],
      whenToCall: 'Call if: projectile force vomiting, blood in vomit, not gaining weight, very frequent',
    }),
  },
];

// ─── Result display ────────────────────────────────────────────────────────────

const SEVERITY_CONFIG = {
  home:      { color: Colors.success, emoji: '🏠', label: 'Ghar pe theek ho sakta hai' },
  monitor:   { color: Colors.secondary, emoji: '👀', label: 'Dekhte raho — improve hoga' },
  doctor:    { color: Colors.primary, emoji: '👨‍⚕️', label: 'Doctor se milna chahiye' },
  emergency: { color: Colors.error ?? '#C0392B', emoji: '🚨', label: 'Abhi hospital jao!' },
};

function ResultCard({ result, onReset }: { result: SymptomResult; onReset: () => void }) {
  const cfg = SEVERITY_CONFIG[result.severity];

  return (
    <ScrollView style={styles.resultContainer} showsVerticalScrollIndicator={false}>
      <LinearGradient
        colors={[cfg.color + '20', cfg.color + '05']}
        style={[styles.resultHeader, { borderColor: cfg.color + '40', borderWidth: 1.5 }]}
      >
        <Text style={styles.resultEmoji}>{cfg.emoji}</Text>
        <View>
          <Text style={[styles.resultTitle, { color: cfg.color }]}>{result.title}</Text>
          <Text style={styles.resultSubtitle}>{cfg.label}</Text>
        </View>
      </LinearGradient>

      <View style={styles.adviceCard}>
        <Text style={styles.adviceTitle}>📋 Kya Karein</Text>
        {result.advice.map((tip, i) => (
          <View key={i} style={styles.bulletRow}>
            <Text style={[styles.bullet, { color: cfg.color }]}>•</Text>
            <Text style={styles.bulletText}>{tip}</Text>
          </View>
        ))}
      </View>

      {result.indianRemedies && result.indianRemedies.length > 0 && (
        <View style={[styles.adviceCard, styles.remedyCard]}>
          <Text style={styles.adviceTitle}>🌿 Desi Gharelu Nuskhe</Text>
          {result.indianRemedies.map((r, i) => (
            <View key={i} style={styles.bulletRow}>
              <Text style={[styles.bullet, { color: Colors.mehendi }]}>🍃</Text>
              <Text style={styles.bulletText}>{r}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.adviceCard, { borderLeftColor: cfg.color }]}>
        <Text style={styles.adviceTitle}>📞 Doctor Ko Kab Bulayein</Text>
        <Text style={styles.whenText}>{result.whenToCall}</Text>
      </View>

      {result.severity === 'emergency' && (
        <TouchableOpacity
          style={styles.emergencyBtn}
          onPress={() => Linking.openURL('tel:108')}
        >
          <Ionicons name="call" size={20} color="#fff" />
          <Text style={styles.emergencyBtnText}>Call 108 (Ambulance)</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
        <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
        <Text style={styles.resetText}>Wapas jaao</Text>
      </TouchableOpacity>

      <Text style={styles.disclaimer}>
        ⚠️ Ye information sirf guide ke liye hai. Hamesha apne pediatrician se confirm karein.
      </Text>
    </ScrollView>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function SymptomCheckerScreen() {
  const { activeBaby } = useBabyStore();
  const [activeCategory, setActiveCategory] = useState<SymptomCategory | 'all'>('all');
  const [result, setResult] = useState<SymptomResult | null>(null);

  const babyAgeWeeks = activeBaby
    ? differenceInWeeks(new Date(), activeBaby.birthDate)
    : 0;

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return SYMPTOMS;
    return SYMPTOMS.filter((s) => s.category === activeCategory);
  }, [activeCategory]);

  const handleSymptom = useCallback(async (symptom: Symptom) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const r = symptom.getResult(babyAgeWeeks);
    setResult(r);
  }, [babyAgeWeeks]);

  if (result) {
    return <ResultCard result={result} onReset={() => setResult(null)} />;
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={[Colors.rose, Colors.roseLight ?? '#B05070']} style={styles.header}>
        <Text style={styles.headerTitle}>🩺 Symptom Checker</Text>
        <Text style={styles.headerSub}>
          {activeBaby ? `${activeBaby.name} — ${babyAgeWeeks} weeks old` : 'Select a symptom'}
        </Text>
        <RangoliBorder style={styles.rangoli} dotSize={6} />
      </LinearGradient>

      {/* Category filter */}
      <ScrollView
        horizontal showsHorizontalScrollIndicator={false}
        style={styles.catRow} contentContainerStyle={styles.catContent}
      >
        <TouchableOpacity
          style={[styles.catChip, activeCategory === 'all' && { backgroundColor: Colors.rose }]}
          onPress={() => setActiveCategory('all')}
        >
          <Text style={[styles.catText, activeCategory === 'all' && { color: '#fff' }]}>🔍 Sab</Text>
        </TouchableOpacity>
        {(Object.keys(CAT_LABELS) as SymptomCategory[]).map((cat) => {
          const active = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, active && { backgroundColor: CAT_COLORS[cat] }]}
              onPress={() => setActiveCategory(cat)}
            >
              <Text style={[styles.catText, active && { color: '#fff' }]}>{CAT_LABELS[cat]}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {filtered.map((symptom) => (
          <TouchableOpacity
            key={symptom.id}
            style={styles.symptomRow}
            onPress={() => handleSymptom(symptom)}
            activeOpacity={0.8}
          >
            <Text style={styles.symptomEmoji}>{symptom.emoji}</Text>
            <View style={styles.symptomInfo}>
              <Text style={styles.symptomLabel}>{symptom.label}</Text>
              <Text style={styles.symptomHindi}>{symptom.hindiLabel}</Text>
            </View>
            <View style={[styles.catDot, { backgroundColor: CAT_COLORS[symptom.category] }]} />
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </TouchableOpacity>
        ))}
        <Text style={styles.disclaimer}>
          ⚠️ Sirf guide ke liye. Medical advice ke liye apne doctor se zaroor milein.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: Spacing.lg },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 4 },
  rangoli: { marginTop: 12 },
  catRow: { maxHeight: 52 },
  catContent: { paddingHorizontal: Spacing.base, paddingVertical: Spacing.sm, gap: 8 },
  catChip: {
    paddingHorizontal: Spacing.md, paddingVertical: 6,
    borderRadius: Radius.full, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.surface,
  },
  catText: { fontSize: Typography.xs, fontWeight: '600', color: Colors.textSecondary },
  list: { padding: Spacing.base, gap: Spacing.sm, paddingBottom: 100 },
  symptomRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    padding: Spacing.base, ...Shadows.sm,
  },
  symptomEmoji: { fontSize: 28, width: 38, textAlign: 'center' },
  symptomInfo: { flex: 1 },
  symptomLabel: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  symptomHindi: { fontSize: Typography.sm, color: Colors.textSecondary },
  catDot: { width: 8, height: 8, borderRadius: 4 },

  // Result
  resultContainer: { flex: 1, backgroundColor: Colors.background },
  resultHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    margin: Spacing.base, borderRadius: Radius.xl, padding: Spacing.lg,
  },
  resultEmoji: { fontSize: 40 },
  resultTitle: { fontSize: Typography.xl, fontWeight: '800' },
  resultSubtitle: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  adviceCard: {
    backgroundColor: Colors.surface, borderRadius: Radius.xl,
    marginHorizontal: Spacing.base, marginBottom: Spacing.sm,
    padding: Spacing.base, borderLeftWidth: 3, borderLeftColor: Colors.peacock,
    ...Shadows.sm,
  },
  remedyCard: { borderLeftColor: Colors.mehendi },
  adviceTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.sm },
  bulletRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: 6, alignItems: 'flex-start' },
  bullet: { fontSize: 16, lineHeight: 20 },
  bulletText: { flex: 1, fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 19 },
  whenText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 19 },
  emergencyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.error ?? '#C0392B', margin: Spacing.base,
    borderRadius: Radius.xl, padding: Spacing.base,
  },
  emergencyBtnText: { fontSize: Typography.base, fontWeight: '800', color: '#fff' },
  resetBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    padding: Spacing.base,
  },
  resetText: { fontSize: Typography.sm, color: Colors.textSecondary },
  disclaimer: {
    fontSize: Typography.xs, color: Colors.textTertiary,
    textAlign: 'center', paddingHorizontal: Spacing.lg, paddingBottom: Spacing.xl,
  },
});
