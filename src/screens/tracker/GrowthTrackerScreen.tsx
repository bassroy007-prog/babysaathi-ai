import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { useRefresh } from '@hooks/useRefresh';
import { Validators } from '@utils/validation';
import { shareViaWhatsApp, buildGrowthShareMessage } from '@utils/share';

export default function GrowthTrackerScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();
  const { growthEntries, addGrowth: logGrowth, fetchGrowth, growthLoading } = useTrackerStore();

  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [head, setHead] = useState('');
  const [showForm, setShowForm] = useState(false);

  const loadGrowth = useCallback(async () => {
    if (activeBaby) await fetchGrowth(activeBaby.id);
  }, [activeBaby]);

  useEffect(() => { loadGrowth(); }, [loadGrowth]);

  const { refreshing, refresh } = useRefresh(loadGrowth);

  const handleSave = async () => {
    if (!activeBaby || !user) return;
    if (!weight && !height && !head) {
      toast.error('Please enter at least one measurement.');
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    if (weight && Validators.positiveNumber(weight, 'Weight')) {
      toast.error('Enter a valid weight in kg (e.g. 6.5).');
      return;
    }
    try {
      await logGrowth({
        babyId: activeBaby.id,
        userId: user.uid,
        date: new Date(),
        weight: weight ? parseFloat(weight) : undefined,
        height: height ? parseFloat(height) : undefined,
        headCircumference: head ? parseFloat(head) : undefined,
      });
      setWeight(''); setHeight(''); setHead('');
      setShowForm(false);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      toast.success('📏 Growth measurement saved!');
    } catch {
      toast.error('Failed to save. Please try again.');
    }
  };

  const latestEntry = growthEntries[growthEntries.length - 1];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Colors.growthColor} />}
    >
      {/* Current measurements */}
      {latestEntry && (
        <LinearGradient colors={[Colors.growthColor + '25', Colors.growthColor + '05']} style={styles.currentCard}>
          <Text style={styles.currentTitle}>Latest Measurements</Text>
          <View style={styles.metricsRow}>
            {latestEntry.weight && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{(latestEntry.weight / 1000).toFixed(2)}</Text>
                <Text style={styles.metricUnit}>kg</Text>
                <Text style={styles.metricLabel}>Weight</Text>
              </View>
            )}
            {latestEntry.height && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{latestEntry.height}</Text>
                <Text style={styles.metricUnit}>cm</Text>
                <Text style={styles.metricLabel}>Height</Text>
              </View>
            )}
            {latestEntry.headCircumference && (
              <View style={styles.metricItem}>
                <Text style={styles.metricValue}>{latestEntry.headCircumference}</Text>
                <Text style={styles.metricUnit}>cm</Text>
                <Text style={styles.metricLabel}>Head</Text>
              </View>
            )}
          </View>
          <Text style={styles.lastUpdated}>
            Last updated: {format(latestEntry.date, 'dd MMM yyyy')}
          </Text>
          <TouchableOpacity
            style={styles.shareBtn}
            onPress={() =>
              shareViaWhatsApp(
                buildGrowthShareMessage(
                  activeBaby?.name ?? 'Baby',
                  latestEntry.weight ? latestEntry.weight / 1000 : 0,
                  latestEntry.height ?? 0,
                  format(latestEntry.date, 'dd MMM yyyy')
                )
              )
            }
          >
            <Ionicons name="logo-whatsapp" size={16} color="#25D366" />
            <Text style={styles.shareBtnText}>Share on WhatsApp</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {/* Add Growth Button */}
      <TouchableOpacity
        style={styles.addBtn}
        onPress={() => setShowForm(!showForm)}
      >
        <LinearGradient
          colors={[Colors.growthColor, '#43A047']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={styles.addBtnGradient}
        >
          <Ionicons name={showForm ? 'close' : 'add'} size={20} color="#fff" />
          <Text style={styles.addBtnText}>{showForm ? 'Cancel' : t('tracker.logGrowth')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Form */}
      {showForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New Measurement</Text>
          <View style={styles.formRow}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>{t('tracker.weight')} (kg)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={weight}
                  onChangeText={setWeight}
                  placeholder="6.5"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.label}>{t('tracker.height')} (cm)</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={height}
                  onChangeText={setHeight}
                  placeholder="65"
                  placeholderTextColor={Colors.textDisabled}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>{t('tracker.headCirc')} (cm)</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={head}
                onChangeText={setHead}
                placeholder="40"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
            <Text style={styles.saveBtnText}>{t('common.save')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Growth History */}
      <Text style={styles.sectionTitle}>Growth History</Text>
      {growthEntries.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 32 }}>📏</Text>
          <Text style={styles.emptyText}>No growth entries yet</Text>
        </View>
      ) : (
        [...growthEntries].reverse().slice(0, 10).map((entry) => (
          <View key={entry.id} style={styles.growthItem}>
            <View style={styles.growthDate}>
              <Text style={styles.growthDateDay}>{format(entry.date, 'dd')}</Text>
              <Text style={styles.growthDateMon}>{format(entry.date, 'MMM')}</Text>
            </View>
            <View style={styles.growthMetrics}>
              {entry.weight && <Text style={styles.growthMetric}>⚖️ {(entry.weight / 1000).toFixed(2)} kg</Text>}
              {entry.height && <Text style={styles.growthMetric}>📏 {entry.height} cm</Text>}
              {entry.headCircumference && <Text style={styles.growthMetric}>🔵 {entry.headCircumference} cm</Text>}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },
  currentCard: { borderRadius: Radius['2xl'], padding: Spacing.lg },
  currentTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.md },
  metricsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.sm },
  metricItem: { alignItems: 'center' },
  metricValue: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.growthColor },
  metricUnit: { fontSize: Typography.sm, color: Colors.textSecondary },
  metricLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  lastUpdated: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },
  shareBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, marginTop: Spacing.md, paddingVertical: 8,
    backgroundColor: '#25D36618', borderRadius: Radius.lg,
  },
  shareBtnText: { fontSize: Typography.sm, color: '#25D366', fontWeight: '600' },
  addBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  addBtnGradient: { height: 50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  addBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  form: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, gap: Spacing.md, ...Shadows.md },
  formTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  formRow: { flexDirection: 'row', gap: Spacing.md },
  inputGroup: { gap: 6 },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, height: 48,
  },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  saveBtn: { backgroundColor: Colors.growthColor, borderRadius: Radius.xl, height: 48, alignItems: 'center', justifyContent: 'center' },
  saveBtnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  emptyState: { backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing['2xl'], alignItems: 'center', gap: Spacing.sm, ...Shadows.sm },
  emptyText: { fontSize: Typography.base, color: Colors.textSecondary },
  growthItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  growthDate: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: Colors.growthColor + '20', alignItems: 'center', justifyContent: 'center',
  },
  growthDateDay: { fontSize: Typography.base, fontWeight: '800', color: Colors.growthColor },
  growthDateMon: { fontSize: Typography.xs, color: Colors.growthColor },
  growthMetrics: { flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  growthMetric: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '500' },
});
