import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform, Animated, SafeAreaView,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import RangoliBorder from '@components/common/RangoliBorder';
import { useToast } from '@components/common/Toast';
import { useAIStore } from '@store/aiStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useTrackerStore } from '@store/trackerStore';
import { cryDetector } from '@services/ai/cryDetector';
import { aiAssistant, RecentLogs } from '@services/ai/aiAssistant';
import { CryPrediction, CryType, ChatMessage } from '@types/index';

const CRY_COLORS: Record<CryType, string> = {
  hunger: Colors.cryHunger,
  sleep: Colors.crySleep,
  discomfort: Colors.cryDiscomfort,
  pain: Colors.cryPain,
  unknown: Colors.cryUnknown,
};

const CRY_EMOJIS: Record<CryType, string> = {
  hunger: '🍼',
  sleep: '😴',
  discomfort: '😣',
  pain: '😢',
  unknown: '❓',
};

export default function AIScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby, dashboardStats } = useBabyStore();
  const {
    isListening, isAnalyzing, lastPredictions, currentCryEvent,
    setListening, setAnalyzing, saveCryEvent, submitCryFeedback,
    fetchCryHistory, cryHistory, insights, fetchInsights,
    messages, addMessage, setChatLoading, isChatLoading,
  } = useAIStore();

  // Pull last 5 logs for AI context memory
  const { feeds, sleepEntries, diapers } = useTrackerStore();
  const recentLogs: RecentLogs = {
    feeds: feeds.slice(0, 5),
    sleep: sleepEntries.slice(0, 5),
    diapers: diapers.slice(0, 3),
  };

  const [activeTab, setActiveTab] = useState<'cry' | 'chat' | 'insights'>('cry');
  const [inputText, setInputText] = useState('');
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastEventId, setLastEventId] = useState<string | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (activeBaby) {
      fetchCryHistory(activeBaby.id);
      fetchInsights(activeBaby.id);
    }
  }, [activeBaby]);

  useEffect(() => {
    if (isListening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.3, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    } else {
      pulseAnim.stopAnimation();
      pulseAnim.setValue(1);
    }
  }, [isListening]);

  const handleStartListening = async () => {
    const hasPermission = await cryDetector.requestPermission();
    if (!hasPermission) {
      toast.error('Microphone permission is required for cry detection. Please grant access in Settings.');
      return;
    }

    setListening(true);

    await cryDetector.startMonitoring(
      () => {
        setAnalyzing(true);
      },
      async (predictions, duration) => {
        setAnalyzing(false);
        useAIStore.getState().setLastPredictions(predictions);

        if (activeBaby && user && predictions.length > 0 && duration >= 2) {
          const dominantType = predictions[0].type;
          const eventId = await saveCryEvent({
            babyId: activeBaby.id,
            userId: user.uid,
            detectedAt: new Date(),
            duration,
            predictions,
            dominantType,
          });
          setLastEventId(eventId);
          setShowFeedback(true);
        }
      },
      (error) => {
        setListening(false);
        setAnalyzing(false);
        toast.error(`Cry detection error: ${error.message}`);
      }
    );
  };

  const handleStopListening = async () => {
    await cryDetector.stopMonitoring();
    setListening(false);
    setAnalyzing(false);
  };

  const handleManualAnalyze = async () => {
    if (!activeBaby || !user) return;
    setAnalyzing(true);
    const predictions = await cryDetector.analyzeClip(5);
    useAIStore.getState().setLastPredictions(predictions);
    setAnalyzing(false);

    const eventId = await saveCryEvent({
      babyId: activeBaby.id,
      userId: user.uid,
      detectedAt: new Date(),
      duration: 5,
      predictions,
      dominantType: predictions[0].type,
    });
    setLastEventId(eventId);
    setShowFeedback(true);
  };

  const handleFeedback = async (correct: boolean, type?: CryType) => {
    if (lastEventId) {
      const dominantType = correct ? lastPredictions[0]?.type : (type ?? 'unknown');
      await submitCryFeedback(lastEventId, dominantType);
    }
    setShowFeedback(false);
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date(),
    };
    addMessage(userMsg);
    setInputText('');
    setChatLoading(true);

    // Simulate AI thinking delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const response = aiAssistant.generateResponse(
      userMsg.content,
      activeBaby,
      dashboardStats,
      recentLogs
    );
    addMessage(response);
    setChatLoading(false);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={Colors.gradients.peacock as [string, string]} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>🧿 AI Guru</Text>
            {activeBaby && (
              <Text style={styles.headerSubtitle}>
                {activeBaby.name} का AI साथी · AI Companion
              </Text>
            )}
          </View>
          <View style={styles.tabs}>
            {(['cry', 'chat', 'insights'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.tabActive]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                  {tab === 'cry' ? '🎤 रोना·Cry' : tab === 'chat' ? '💬 सवाल·Chat' : '💡 सुझाव·Tips'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <RangoliBorder style={styles.rangoliBorder} />
        </SafeAreaView>
      </LinearGradient>

      {/* CRY DETECTOR TAB */}
      {activeTab === 'cry' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Mic Button */}
          <View style={styles.micSection}>
            <Animated.View style={[styles.micPulse, { transform: [{ scale: pulseAnim }] }, isListening && styles.micPulseActive]} />
            <TouchableOpacity
              style={[styles.micBtn, isListening && styles.micBtnActive]}
              onPress={isListening ? handleStopListening : handleStartListening}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isListening ? [Colors.error, '#E05040'] : Colors.gradients.peacock as [string, string]}
                style={styles.micBtnGradient}
              >
                <Ionicons name={isListening ? 'stop' : 'mic'} size={40} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.micStatus}>
              {isAnalyzing ? t('ai.analyzing') : isListening ? t('ai.listening') : t('ai.startListening')}
            </Text>
            {!isListening && (
              <TouchableOpacity style={styles.analyzeBtn} onPress={handleManualAnalyze} disabled={isAnalyzing}>
                <Text style={styles.analyzeBtnText}>Analyze 5-second clip</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Results */}
          {lastPredictions.length > 0 && (
            <View style={styles.resultsCard}>
              <Text style={styles.resultsTitle}>{t('ai.cryResult')}</Text>
              {lastPredictions.map((pred) => (
                <View key={pred.type} style={styles.predictionRow}>
                  <Text style={styles.predictionEmoji}>{CRY_EMOJIS[pred.type]}</Text>
                  <Text style={styles.predictionType}>{t(`ai.${pred.type}`)}</Text>
                  <View style={styles.predictionBarWrapper}>
                    <View style={[styles.predictionBar, { width: `${pred.confidence}%`, backgroundColor: CRY_COLORS[pred.type] }]} />
                  </View>
                  <Text style={[styles.predictionPct, { color: CRY_COLORS[pred.type] }]}>{pred.confidence}%</Text>
                </View>
              ))}

              {/* Dominant result */}
              <View style={[styles.dominantResult, { backgroundColor: CRY_COLORS[lastPredictions[0].type] + '20' }]}>
                <Text style={styles.dominantEmoji}>{CRY_EMOJIS[lastPredictions[0].type]}</Text>
                <View>
                  <Text style={styles.dominantLabel}>Most likely</Text>
                  <Text style={[styles.dominantType, { color: CRY_COLORS[lastPredictions[0].type] }]}>
                    {t(`ai.${lastPredictions[0].type}`)} ({lastPredictions[0].confidence}%)
                  </Text>
                </View>
              </View>

              {/* Feedback */}
              {showFeedback && (
                <View style={styles.feedbackSection}>
                  <Text style={styles.feedbackQuestion}>{t('ai.wasCorrrrect')}</Text>
                  <View style={styles.feedbackRow}>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, { backgroundColor: Colors.success + '20' }]}
                      onPress={() => handleFeedback(true)}
                    >
                      <Text style={[styles.feedbackBtnText, { color: Colors.success }]}>{t('ai.yes')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.feedbackBtn, { backgroundColor: Colors.error + '20' }]}
                      onPress={() => handleFeedback(false)}
                    >
                      <Text style={[styles.feedbackBtnText, { color: Colors.error }]}>{t('ai.no')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Cry History */}
          <Text style={styles.sectionTitle}>Recent Cry Events</Text>
          {cryHistory.slice(0, 5).map((event) => (
            <View key={event.id} style={styles.cryHistoryItem}>
              <Text style={styles.cryHistoryEmoji}>{CRY_EMOJIS[event.dominantType]}</Text>
              <View style={styles.cryHistoryInfo}>
                <Text style={styles.cryHistoryType}>{event.dominantType} • {event.predictions[0]?.confidence}% confidence</Text>
                <Text style={styles.cryHistoryTime}>{format(event.detectedAt, 'hh:mm a, dd MMM')}</Text>
              </View>
              {event.userFeedback && (
                <Ionicons
                  name={event.userFeedback === event.dominantType ? 'checkmark-circle' : 'close-circle'}
                  size={20}
                  color={event.userFeedback === event.dominantType ? Colors.success : Colors.error}
                />
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* CHAT TAB */}
      {activeTab === 'chat' && (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
          keyboardVerticalOffset={90}
        >
          <ScrollView
            ref={scrollRef}
            style={styles.chatScroll}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 && (
              <View style={styles.chatWelcome}>
                <Text style={styles.chatWelcomeEmoji}>🧿</Text>
                <Text style={styles.chatWelcomeText}>
                  नमस्ते! मैं आपका AI Guru हूँ।{'\n'}Ask me anything about {activeBaby?.name ?? 'your baby'}!
                </Text>
                <View style={styles.suggestedQuestions}>
                  {(t('ai.suggestedQuestions', { returnObjects: true }) as string[]).map((q) => (
                    <TouchableOpacity
                      key={q}
                      style={styles.suggestedBtn}
                      onPress={() => setInputText(q)}
                    >
                      <Text style={styles.suggestedText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {messages.map((msg) => (
              <View key={msg.id} style={[styles.messageRow, msg.role === 'user' && styles.userMessageRow]}>
                {msg.role === 'assistant' && (
                  <View style={styles.botAvatar}>
                    <Text style={{ fontSize: 16 }}>🧿</Text>
                  </View>
                )}
                <View style={[styles.messageBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
                  <Text style={[styles.messageText, msg.role === 'user' && styles.userMessageText]}>
                    {msg.content}
                  </Text>
                  <Text style={styles.messageTime}>{format(msg.timestamp, 'hh:mm a')}</Text>
                </View>
              </View>
            ))}

            {isChatLoading && (
              <View style={styles.messageRow}>
                <View style={styles.botAvatar}><Text>🧿</Text></View>
                <View style={styles.botBubble}>
                  <Text style={styles.typingIndicator}>Thinking...</Text>
                </View>
              </View>
            )}
          </ScrollView>

          <View style={styles.inputBar}>
            <TextInput
              style={styles.chatInput}
              value={inputText}
              onChangeText={setInputText}
              placeholder={t('ai.chatPlaceholder')}
              placeholderTextColor={Colors.textDisabled}
              multiline
              maxLength={500}
              onSubmitEditing={handleSendMessage}
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.4 }]}
              onPress={handleSendMessage}
              disabled={!inputText.trim() || isChatLoading}
            >
              <LinearGradient colors={Colors.gradients.peacock as [string, string]} style={styles.sendBtnGradient}>
                <Ionicons name="send" size={18} color="#fff" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      )}

      {/* INSIGHTS TAB */}
      {activeTab === 'insights' && (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>{t('ai.insightsTitle')}</Text>
          {insights.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={{ fontSize: 40 }}>💡</Text>
              <Text style={styles.emptyText}>No insights yet. Keep tracking to get AI insights!</Text>
            </View>
          ) : (
            insights.map((insight) => (
              <View key={insight.id} style={styles.insightCard}>
                <View style={styles.insightHeader}>
                  <Text style={{ fontSize: 24 }}>
                    {insight.type === 'feeding' ? '🍼' : insight.type === 'sleep' ? '😴' : insight.type === 'cry' ? '🎤' : insight.type === 'growth' ? '📏' : '💡'}
                  </Text>
                  <View style={styles.insightMeta}>
                    <Text style={styles.insightTitle}>{insight.title}</Text>
                    <Text style={styles.insightTime}>{format(insight.createdAt, 'hh:mm a, dd MMM')}</Text>
                  </View>
                  <View style={[styles.confidenceBadge, { backgroundColor: Colors.primary + '20' }]}>
                    <Text style={styles.confidenceText}>{insight.confidence}%</Text>
                  </View>
                </View>
                <Text style={styles.insightMessage}>{insight.message}</Text>
                {insight.actionable && insight.action && (
                  <TouchableOpacity style={styles.insightAction}>
                    <Text style={styles.insightActionText}>{insight.action}</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.secondary} />
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.sm },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  headerTitle: { fontSize: Typography['2xl'], fontWeight: '800', color: '#fff' },
  headerSubtitle: { fontSize: Typography.base, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  tabs: { flexDirection: 'row', paddingHorizontal: Spacing.xl, paddingBottom: Spacing.sm, gap: Spacing.sm },
  rangoliBorder: { paddingBottom: Spacing.xs },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: 'rgba(255,255,255,0.15)' },
  tabActive: { backgroundColor: '#fff' },
  tabText: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  tabTextActive: { color: Colors.peacock },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.xl, gap: Spacing.lg },
  micSection: { alignItems: 'center', paddingVertical: Spacing['2xl'], gap: Spacing.md },
  micPulse: { position: 'absolute', width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.peacock + '15' },
  micPulseActive: { backgroundColor: Colors.error + '20' },
  micBtn: { width: 100, height: 100, borderRadius: 50, overflow: 'hidden', ...Shadows.lg },
  micBtnActive: {},
  micBtnGradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  micStatus: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  analyzeBtn: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.peacock,
  },
  analyzeBtnText: { fontSize: Typography.sm, color: Colors.peacock, fontWeight: '600' },
  resultsCard: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, gap: Spacing.md, ...Shadows.md },
  resultsTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  predictionRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  predictionEmoji: { fontSize: 20, width: 28 },
  predictionType: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600', width: 80 },
  predictionBarWrapper: { flex: 1, height: 8, backgroundColor: Colors.border, borderRadius: 4, overflow: 'hidden' },
  predictionBar: { height: '100%', borderRadius: 4 },
  predictionPct: { fontSize: Typography.sm, fontWeight: '700', width: 36, textAlign: 'right' },
  dominantResult: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderRadius: Radius.xl, padding: Spacing.md },
  dominantEmoji: { fontSize: 32 },
  dominantLabel: { fontSize: Typography.xs, color: Colors.textSecondary },
  dominantType: { fontSize: Typography.lg, fontWeight: '800' },
  feedbackSection: { gap: Spacing.sm },
  feedbackQuestion: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  feedbackRow: { flexDirection: 'row', gap: Spacing.md },
  feedbackBtn: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.xl, alignItems: 'center' },
  feedbackBtnText: { fontSize: Typography.base, fontWeight: '700' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  cryHistoryItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  cryHistoryEmoji: { fontSize: 28 },
  cryHistoryInfo: { flex: 1 },
  cryHistoryType: { fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary, textTransform: 'capitalize' },
  cryHistoryTime: { fontSize: Typography.sm, color: Colors.textSecondary },
  chatScroll: { flex: 1 },
  chatContent: { padding: Spacing.xl, gap: Spacing.md },
  chatWelcome: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl },
  chatWelcomeEmoji: { fontSize: 52 },
  chatWelcomeText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  suggestedQuestions: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, justifyContent: 'center' },
  suggestedBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.peacock + '15', borderRadius: Radius.full,
  },
  suggestedText: { fontSize: Typography.sm, color: Colors.peacock, fontWeight: '600' },
  messageRow: { flexDirection: 'row', gap: Spacing.sm, maxWidth: '85%' },
  userMessageRow: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  botAvatar: { width: 32, height: 32, borderRadius: 10, backgroundColor: Colors.peacock + '20', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  messageBubble: { borderRadius: Radius.xl, padding: Spacing.md, maxWidth: '85%' },
  botBubble: { backgroundColor: Colors.surface, ...Shadows.sm },
  userBubble: { backgroundColor: Colors.peacock },
  messageText: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22 },
  userMessageText: { color: '#fff' },
  messageTime: { fontSize: 10, color: Colors.textDisabled, marginTop: 4, alignSelf: 'flex-end' },
  typingIndicator: { fontSize: Typography.base, color: Colors.textSecondary, fontStyle: 'italic' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.sm,
    padding: Spacing.md, paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.md,
    backgroundColor: Colors.surface, borderTopWidth: 1, borderTopColor: Colors.border,
  },
  chatInput: {
    flex: 1, fontSize: Typography.base, color: Colors.textPrimary,
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    maxHeight: 100, minHeight: 44,
  },
  sendBtn: { borderRadius: Radius.full, overflow: 'hidden' },
  sendBtnGradient: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  emptyState: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['2xl'], alignItems: 'center', gap: Spacing.sm, ...Shadows.sm },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center' },
  insightCard: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.lg, ...Shadows.sm, gap: Spacing.sm },
  insightHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  insightMeta: { flex: 1 },
  insightTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  insightTime: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  confidenceBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: Radius.full },
  confidenceText: { fontSize: Typography.xs, fontWeight: '700', color: Colors.primary },
  insightMessage: { fontSize: Typography.sm, color: Colors.textSecondary, lineHeight: 20 },
  insightAction: { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start' },
  insightActionText: { fontSize: Typography.sm, color: Colors.peacock, fontWeight: '700' },
});
