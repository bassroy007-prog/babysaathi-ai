import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, TextInput, Alert, ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { differenceInWeeks, format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useMomStore } from '@store/momStore';
import {
  MOOD_OPTIONS, BLEEDING_OPTIONS, EPDS_QUESTIONS, getEPDSRisk, getTodaysTip,
} from '@constants/postpartumData';
import type { MomMood, MomBleeding } from '@types/index';

type MainTab = 'today' | 'epds';
type EpdsStep = 'intro' | 'quiz' | 'result';

const ICARE_NUMBER = '9152987821'; // iCall by TISS — free mental health helpline

export default function MomHealthScreen() {
  const { activeBaby } = useBabyStore();
  const { user } = useAuthStore();
  const {
    todayCheckIn, recentCheckIns, epdsResults,
    fetchTodayCheckIn, fetchRecentCheckIns, saveCheckIn,
    fetchEPDSResults, saveEPDSResult,
  } = useMomStore();

  const [mainTab, setMainTab] = useState<MainTab>('today');

  // ── Check-in form state ──────────────────────────────────────────────────────
  const [mood,       setMood]       = useState<MomMood | null>(null);
  const [water,      setWater]      = useState(0);
  const [meals,      setMeals]      = useState<Set<string>>(new Set());
  const [sleep,      setSleep]      = useState(0);
  const [pain,       setPain]       = useState(0);
  const [bleeding,   setBleeding]   = useState<MomBleeding | null>(null);
  const [notes,      setNotes]      = useState('');
  const [saving,     setSaving]     = useState(false);

  // ── EPDS state ───────────────────────────────────────────────────────────────
  const [epdsStep,   setEpdsStep]   = useState<EpdsStep>('intro');
  const [currentQ,   setCurrentQ]   = useState(0);
  const [epdsAns,    setEpdsAns]    = useState<number[]>([]);
  const [epdsScore,  setEpdsScore]  = useState<number | null>(null);

  const postpartumWeeks = activeBaby
    ? differenceInWeeks(new Date(), activeBaby.birthDate)
    : 0;

  useEffect(() => {
    if (!activeBaby) return;
    fetchTodayCheckIn(activeBaby.id);
    fetchRecentCheckIns(activeBaby.id);
    fetchEPDSResults(activeBaby.id);
  }, [activeBaby?.id]);

  // Pre-fill form when today's check-in loads
  useEffect(() => {
    if (todayCheckIn) {
      setMood(todayCheckIn.mood);
      setWater(todayCheckIn.waterGlasses);
      setSleep(todayCheckIn.sleepHours);
      setPain(todayCheckIn.painLevel);
      setBleeding(todayCheckIn.bleeding);
      setNotes(todayCheckIn.notes ?? '');
      const m = new Set<string>();
      if (todayCheckIn.mealsCount >= 1) m.add('breakfast');
      if (todayCheckIn.mealsCount >= 2) m.add('lunch');
      if (todayCheckIn.mealsCount >= 3) m.add('dinner');
      setMeals(m);
    }
  }, [todayCheckIn?.id]);

  const handleSaveCheckIn = useCallback(async () => {
    if (!activeBaby || !user || !mood || !bleeding) {
      Alert.alert('Almost there!', 'Please select your mood and recovery status before saving.');
      return;
    }
    const moodOption = MOOD_OPTIONS.find((m) => m.value === mood)!;
    setSaving(true);
    try {
      await saveCheckIn({
        babyId: activeBaby.id,
        userId: user.uid,
        date: new Date(),
        mood,
        moodScore: moodOption.score,
        waterGlasses: water,
        mealsCount: meals.size,
        sleepHours: sleep,
        painLevel: pain,
        bleeding,
        notes: notes.trim() || undefined,
      });
    } finally {
      setSaving(false);
    }
  }, [activeBaby, user, mood, water, meals, sleep, pain, bleeding, notes]);

  // ── EPDS helpers ─────────────────────────────────────────────────────────────
  const handleEPDSAnswer = useCallback(async (score: number) => {
    const next = [...epdsAns, score];
    setEpdsAns(next);

    if (next.length < EPDS_QUESTIONS.length) {
      setCurrentQ(next.length);
    } else {
      // Assessment complete
      const total = next.reduce((a, b) => a + b, 0);
      setEpdsScore(total);
      setEpdsStep('result');
      if (activeBaby && user) {
        const { risk } = getEPDSRisk(total);
        await saveEPDSResult({
          babyId: activeBaby.id, userId: user.uid,
          date: new Date(), answers: next, totalScore: total, risk,
        }).catch(() => {});
      }
    }
  }, [epdsAns, activeBaby, user]);

  const startEPDS = () => { setEpdsAns([]); setCurrentQ(0); setEpdsStep('quiz'); };
  const resetEPDS = () => { setEpdsScore(null); setEpdsStep('intro'); };

  const todayTip     = useMemo(() => getTodaysTip(), []);
  const latestResult = epdsResults[0] ?? null;

  if (!activeBaby) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No baby profile found.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <LinearGradient colors={['#7B2D8B', '#9C3AA5']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>💝 Mom's Wellness</Text>
            <Text style={styles.headerSub}>
              {activeBaby.name}'s mama · Week {postpartumWeeks} postpartum
            </Text>
            <View style={styles.tipBox}>
              <Text style={styles.tipEmoji}>{todayTip.emoji}</Text>
              <Text style={styles.tipText} numberOfLines={2}>{todayTip.tip}</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* ── Main Tabs ──────────────────────────────────────────────────────── */}
      <View style={styles.tabs}>
        {([['today', '✨ Today'], ['epds', '🧠 EPDS Screen']] as [MainTab, string][]).map(([tab, label]) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, mainTab === tab && styles.tabActive]}
            onPress={() => setMainTab(tab)}
          >
            <Text style={[styles.tabText, mainTab === tab && styles.tabTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {mainTab === 'today' ? (
          <>
            {/* ── Mood picker ─────────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>How are you feeling today?</Text>
              <View style={styles.moodRow}>
                {MOOD_OPTIONS.map((m) => (
                  <TouchableOpacity
                    key={m.value}
                    style={[styles.moodBtn, mood === m.value && { borderColor: m.color, backgroundColor: m.color + '18' }]}
                    onPress={() => setMood(m.value)}
                  >
                    <Text style={styles.moodEmoji}>{m.emoji}</Text>
                    <Text style={[styles.moodLabel, mood === m.value && { color: m.color }]}>{m.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Wellness inputs ─────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Today's Wellness</Text>

              {/* Water */}
              <View style={styles.wellnessRow}>
                <Text style={styles.wellnessLabel}>💧 Water</Text>
                <View style={styles.counter}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setWater(Math.max(0, water - 1))}>
                    <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{water}<Text style={styles.counterUnit}> / 8 glasses</Text></Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setWater(Math.min(15, water + 1))}>
                    <Ionicons name="add" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.waterDots}>
                {Array.from({ length: 8 }, (_, i) => (
                  <TouchableOpacity key={i} onPress={() => setWater(i + 1)}>
                    <View style={[styles.waterDot, i < water && styles.waterDotFilled]} />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Meals */}
              <View style={[styles.wellnessRow, { marginTop: Spacing.md }]}>
                <Text style={styles.wellnessLabel}>🍽 Meals</Text>
                <View style={styles.mealBtns}>
                  {['breakfast', 'lunch', 'dinner'].map((m) => (
                    <TouchableOpacity
                      key={m}
                      style={[styles.mealBtn, meals.has(m) && styles.mealBtnActive]}
                      onPress={() => {
                        const next = new Set(meals);
                        next.has(m) ? next.delete(m) : next.add(m);
                        setMeals(next);
                      }}
                    >
                      <Text style={[styles.mealBtnText, meals.has(m) && styles.mealBtnTextActive]}>
                        {m.charAt(0).toUpperCase() + m.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Sleep */}
              <View style={[styles.wellnessRow, { marginTop: Spacing.md }]}>
                <Text style={styles.wellnessLabel}>😴 My sleep</Text>
                <View style={styles.counter}>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setSleep(Math.max(0, sleep - 0.5))}>
                    <Ionicons name="remove" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                  <Text style={styles.counterVal}>{sleep}<Text style={styles.counterUnit}> hrs</Text></Text>
                  <TouchableOpacity style={styles.counterBtn} onPress={() => setSleep(Math.min(12, sleep + 0.5))}>
                    <Ionicons name="add" size={18} color={Colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Recovery ─────────────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Recovery</Text>

              {/* Pain level */}
              <Text style={[styles.wellnessLabel, { marginBottom: Spacing.sm }]}>🩹 Pain / discomfort</Text>
              <View style={styles.painRow}>
                {[0, 1, 2, 3, 4, 5].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.painBtn, pain === p && styles.painBtnActive]}
                    onPress={() => setPain(p)}
                  >
                    <Text style={[styles.painLabel, pain === p && { color: '#fff' }]}>
                      {p === 0 ? 'None' : String(p)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.painHint}>0 = No pain · 5 = Severe</Text>

              {/* Lochia / Bleeding */}
              <Text style={[styles.wellnessLabel, { marginTop: Spacing.lg, marginBottom: Spacing.sm }]}>🩸 Lochia / Bleeding</Text>
              <View style={styles.bleedingRow}>
                {BLEEDING_OPTIONS.map((b) => (
                  <TouchableOpacity
                    key={b.value}
                    style={[styles.bleedingBtn, bleeding === b.value && { borderColor: b.color, backgroundColor: b.color + '18' }]}
                    onPress={() => setBleeding(b.value)}
                  >
                    <Text style={[styles.bleedingText, bleeding === b.value && { color: b.color }]}>{b.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Notes ────────────────────────────────────────────────────── */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Notes (optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="How are you feeling? Anything on your mind…"
                placeholderTextColor={Colors.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* ── Save button ──────────────────────────────────────────────── */}
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.6 }]}
              onPress={handleSaveCheckIn}
              disabled={saving}
            >
              <LinearGradient colors={['#7B2D8B', '#9C3AA5']} style={styles.saveBtnGrad}>
                {saving
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.saveBtnText}>
                      {todayCheckIn ? '✅ Update Today\'s Check-in' : '💝 Save Check-in'}
                    </Text>}
              </LinearGradient>
            </TouchableOpacity>

            {/* ── 7-day mood history ───────────────────────────────────────── */}
            {recentCheckIns.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>This Week's Mood</Text>
                <View style={styles.moodHistory}>
                  {[...recentCheckIns].reverse().map((ci) => {
                    const opt = MOOD_OPTIONS.find((m) => m.value === ci.mood)!;
                    return (
                      <View key={ci.id} style={styles.historyItem}>
                        <Text style={styles.historyEmoji}>{opt.emoji}</Text>
                        <Text style={styles.historyDay}>{format(ci.date, 'EEE')}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </>
        ) : (
          /* ── EPDS Tab ───────────────────────────────────────────────────── */
          <>
            {epdsStep === 'intro' && (
              <>
                <View style={styles.card}>
                  <Text style={styles.epdsTitle}>Edinburgh Postnatal Depression Scale</Text>
                  <Text style={styles.epdsIntro}>
                    The EPDS is a validated 10-question tool used worldwide to screen for postnatal depression. It takes about 2 minutes. Your answers help you understand how you're coping — not a diagnosis.
                  </Text>
                  <View style={styles.epdsDisclaimer}>
                    <Ionicons name="information-circle-outline" size={16} color="#7B2D8B" />
                    <Text style={styles.epdsDisclaimerText}>
                      This is a screening tool, not a clinical diagnosis. Please share results with your doctor.
                    </Text>
                  </View>
                  <TouchableOpacity style={styles.epdsStartBtn} onPress={startEPDS}>
                    <LinearGradient colors={['#7B2D8B', '#9C3AA5']} style={styles.saveBtnGrad}>
                      <Text style={styles.saveBtnText}>Start Assessment →</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>

                {latestResult && (
                  <View style={[styles.card, { borderLeftWidth: 3, borderLeftColor: getEPDSRisk(latestResult.totalScore).color }]}>
                    <Text style={styles.cardTitle}>Last Assessment</Text>
                    <Text style={styles.latestDate}>{format(latestResult.date, 'd MMMM yyyy')}</Text>
                    <View style={styles.scoreRow}>
                      <Text style={[styles.scoreVal, { color: getEPDSRisk(latestResult.totalScore).color }]}>
                        {latestResult.totalScore}/30
                      </Text>
                      <View style={[styles.riskPill, { backgroundColor: getEPDSRisk(latestResult.totalScore).color + '20' }]}>
                        <Text style={[styles.riskText, { color: getEPDSRisk(latestResult.totalScore).color }]}>
                          {getEPDSRisk(latestResult.totalScore).title}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </>
            )}

            {epdsStep === 'quiz' && (
              <View style={styles.card}>
                {/* Progress */}
                <View style={styles.epdsProgress}>
                  <Text style={styles.epdsQNum}>Question {currentQ + 1} of {EPDS_QUESTIONS.length}</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${((currentQ) / EPDS_QUESTIONS.length) * 100}%` }]} />
                  </View>
                </View>

                <Text style={styles.epdsQuestion}>
                  {EPDS_QUESTIONS[currentQ].text}
                </Text>
                <Text style={styles.epdsSubtitle}>In the past 7 days…</Text>

                <View style={styles.epdsOptions}>
                  {EPDS_QUESTIONS[currentQ].options.map((opt, i) => (
                    <TouchableOpacity
                      key={i}
                      style={styles.epdsOption}
                      onPress={() => handleEPDSAnswer(opt.score)}
                    >
                      <View style={styles.epdsRadio} />
                      <Text style={styles.epdsOptionText}>{opt.text}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {currentQ > 0 && (
                  <TouchableOpacity
                    style={styles.epdsBack}
                    onPress={() => { setCurrentQ(currentQ - 1); setEpdsAns(epdsAns.slice(0, -1)); }}
                  >
                    <Ionicons name="arrow-back" size={16} color={Colors.textSecondary} />
                    <Text style={styles.epdsBackText}>Previous question</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {epdsStep === 'result' && epdsScore !== null && (() => {
              const { color, title, message, risk } = getEPDSRisk(epdsScore);
              return (
                <>
                  <View style={[styles.card, { borderTopWidth: 4, borderTopColor: color }]}>
                    <Text style={styles.resultTitle}>Assessment Complete</Text>
                    <View style={styles.scoreDisplay}>
                      <Text style={[styles.scoreNum, { color }]}>{epdsScore}</Text>
                      <Text style={styles.scoreOf}>/30</Text>
                    </View>
                    <View style={[styles.riskBanner, { backgroundColor: color + '15' }]}>
                      <Text style={[styles.riskBannerTitle, { color }]}>{title}</Text>
                      <Text style={styles.riskBannerText}>{message}</Text>
                    </View>

                    {risk !== 'low' && (
                      <TouchableOpacity
                        style={[styles.helplineBtn, { borderColor: color }]}
                        onPress={() => Linking.openURL(`tel:${ICARE_NUMBER}`)}
                      >
                        <Ionicons name="call-outline" size={16} color={color} />
                        <View>
                          <Text style={[styles.helplineLabel, { color }]}>iCall Helpline (Free · India)</Text>
                          <Text style={[styles.helplineNum, { color }]}>{ICARE_NUMBER}</Text>
                        </View>
                      </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.epdsStartBtn} onPress={resetEPDS}>
                      <Text style={styles.takAgainText}>Take Assessment Again</Text>
                    </TouchableOpacity>
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>Remember</Text>
                    <Text style={styles.reminderText}>
                      These feelings are not your fault. Postpartum depression affects 1 in 5 mothers in India and is very treatable. Sharing your score with your doctor is the most important next step.
                    </Text>
                  </View>
                </>
              );
            })()}
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  center:    { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary },

  header:        { paddingBottom: Spacing.xl },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle:   { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSub:     { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: Spacing.md },
  tipBox:        { flexDirection: 'row', gap: Spacing.sm, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'flex-start' },
  tipEmoji:      { fontSize: 18 },
  tipText:       { flex: 1, fontSize: Typography.sm, color: 'rgba(255,255,255,0.9)', lineHeight: 18 },

  tabs:          { flexDirection: 'row', backgroundColor: Colors.surface, borderBottomWidth: 1, borderBottomColor: Colors.border },
  tab:           { flex: 1, paddingVertical: Spacing.md, alignItems: 'center' },
  tabActive:     { borderBottomWidth: 2, borderBottomColor: '#7B2D8B' },
  tabText:       { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: '#7B2D8B' },

  scroll: { padding: Spacing.lg, paddingBottom: 20 },
  card:   { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, marginBottom: Spacing.md, ...Shadows.md },
  cardTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },

  // Mood
  moodRow:   { flexDirection: 'row', gap: 8 },
  moodBtn:   { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.xl, paddingVertical: Spacing.md, alignItems: 'center', gap: 4 },
  moodEmoji: { fontSize: 22 },
  moodLabel: { fontSize: 9, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },

  // Wellness
  wellnessRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  wellnessLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  counter:    { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  counterBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: Colors.border, alignItems: 'center', justifyContent: 'center' },
  counterVal: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, minWidth: 60, textAlign: 'center' },
  counterUnit: { fontSize: Typography.xs, fontWeight: '400', color: Colors.textSecondary },
  waterDots: { flexDirection: 'row', gap: 6, marginTop: Spacing.sm },
  waterDot:       { width: 28, height: 10, borderRadius: 5, backgroundColor: Colors.border },
  waterDotFilled: { backgroundColor: '#006B6B' },
  mealBtns: { flexDirection: 'row', gap: 6 },
  mealBtn:        { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingHorizontal: 10, paddingVertical: 6 },
  mealBtnActive:  { borderColor: '#2D7A3A', backgroundColor: '#2D7A3A18' },
  mealBtnText:    { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  mealBtnTextActive: { color: '#2D7A3A' },

  // Recovery
  painRow:   { flexDirection: 'row', gap: 8 },
  painBtn:   { flex: 1, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, paddingVertical: 8, alignItems: 'center' },
  painBtnActive: { backgroundColor: '#7B2D8B', borderColor: '#7B2D8B' },
  painLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  painHint:  { fontSize: 10, color: Colors.textSecondary, marginTop: 6 },
  bleedingRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bleedingBtn:  { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  bleedingText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },

  // Notes
  notesInput: { borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.lg, padding: Spacing.md, fontSize: Typography.sm, color: Colors.textPrimary, minHeight: 72 },

  // Save
  saveBtn:     { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md },
  saveBtnGrad: { paddingVertical: 14, alignItems: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },

  // Mood history
  moodHistory: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  historyItem: { alignItems: 'center', gap: 4, minWidth: 40 },
  historyEmoji: { fontSize: 24 },
  historyDay:   { fontSize: 10, color: Colors.textSecondary, fontWeight: '600' },

  // EPDS
  epdsTitle:        { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md },
  epdsIntro:        { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20, marginBottom: Spacing.md },
  epdsDisclaimer:   { flexDirection: 'row', gap: 8, backgroundColor: '#7B2D8B10', borderRadius: Radius.lg, padding: Spacing.md, marginBottom: Spacing.lg, alignItems: 'flex-start' },
  epdsDisclaimerText: { flex: 1, fontSize: Typography.sm, color: '#7B2D8B', lineHeight: 18 },
  epdsStartBtn:     { borderRadius: Radius.xl, overflow: 'hidden' },
  epdsProgress:     { marginBottom: Spacing.lg },
  epdsQNum:         { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600', marginBottom: Spacing.sm },
  progressBar:      { height: 4, backgroundColor: Colors.border, borderRadius: 2 },
  progressFill:     { height: 4, backgroundColor: '#7B2D8B', borderRadius: 2 },
  epdsSubtitle:     { fontSize: Typography.xs, color: Colors.textSecondary, fontStyle: 'italic', marginBottom: Spacing.md },
  epdsQuestion:     { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary, lineHeight: 26, marginBottom: 4 },
  epdsOptions:      { gap: Spacing.sm, marginTop: Spacing.sm },
  epdsOption:       { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.xl, padding: Spacing.md },
  epdsRadio:        { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: '#7B2D8B' },
  epdsOptionText:   { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  epdsBack:         { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: Spacing.lg, alignSelf: 'flex-start' },
  epdsBackText:     { fontSize: Typography.sm, color: Colors.textSecondary },

  // Result
  resultTitle:   { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.md, textAlign: 'center' },
  scoreDisplay:  { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', marginBottom: Spacing.md },
  scoreNum:      { fontSize: 64, fontWeight: '900', lineHeight: 72 },
  scoreOf:       { fontSize: Typography.xl, color: Colors.textSecondary, marginBottom: 12 },
  riskBanner:    { borderRadius: Radius.xl, padding: Spacing.lg, marginBottom: Spacing.md },
  riskBannerTitle: { fontSize: Typography.base, fontWeight: '800', marginBottom: 6 },
  riskBannerText: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  helplineBtn:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1.5, borderRadius: Radius.xl, padding: Spacing.md, marginBottom: Spacing.md },
  helplineLabel: { fontSize: Typography.xs, fontWeight: '600' },
  helplineNum:   { fontSize: Typography.lg, fontWeight: '800' },
  takAgainText:  { fontSize: Typography.sm, color: Colors.textSecondary, textAlign: 'center', paddingVertical: Spacing.md, fontWeight: '600' },

  // Latest result
  latestDate: { fontSize: Typography.sm, color: Colors.textSecondary, marginBottom: Spacing.sm },
  scoreRow:   { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  scoreVal:   { fontSize: Typography['2xl'], fontWeight: '900' },
  riskPill:   { borderRadius: Radius.full, paddingHorizontal: 12, paddingVertical: 4 },
  riskText:   { fontSize: Typography.sm, fontWeight: '700' },

  reminderText: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 22 },
});
