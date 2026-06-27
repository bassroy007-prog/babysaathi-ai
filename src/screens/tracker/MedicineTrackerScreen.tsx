import React, { useEffect, useCallback, useState, useRef, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ScrollView, Modal, KeyboardAvoidingView, Platform, Alert,
  ListRenderItemInfo, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { format, addHours } from 'date-fns';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { EmptyState, SkeletonListItem } from '@components/common/index';
import { useRefresh } from '@hooks/useRefresh';
import { COMMON_BABY_MEDICINES, FEVER_THRESHOLDS } from '@constants/index';
import {
  scheduleMedicationReminder,
  cancelMedicationReminder,
  scheduleHighFeverFollowup,
} from '@services/notifications/notificationService';
import type {
  TemperatureEntry, TemperatureSite, FeverStatus,
  MedicationEntry, MedicationUnit,
} from '@types/index';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getFeverStatus(temp: number, site: TemperatureSite): FeverStatus {
  const t = FEVER_THRESHOLDS[site];
  if (temp >= t.high_fever) return 'high_fever';
  if (temp >= t.fever) return 'fever';
  if (temp >= t.low_grade) return 'low_grade';
  return 'normal';
}

const FEVER_META: Record<FeverStatus, { label: string; color: string; emoji: string }> = {
  normal:     { label: 'Normal',        color: Colors.success,  emoji: '✅' },
  low_grade:  { label: 'Low-grade',     color: Colors.warning,  emoji: '🌡️' },
  fever:      { label: 'Fever',         color: Colors.accent,   emoji: '🔥' },
  high_fever: { label: 'High Fever',    color: Colors.error,    emoji: '🚨' },
};

const SITES: { value: TemperatureSite; label: string; icon: string }[] = [
  { value: 'axillary', label: 'Armpit', icon: '🤱' },
  { value: 'oral',     label: 'Mouth',  icon: '👄' },
  { value: 'rectal',   label: 'Rectal', icon: '🩺' },
  { value: 'forehead', label: 'Forehead', icon: '🤧' },
];

const UNITS: MedicationUnit[] = ['ml', 'mg', 'drops', 'sachet', 'tablet'];

function calcDose(medicineId: string, weightKg: number): string {
  const med = COMMON_BABY_MEDICINES.find((m) => m.id === medicineId);
  if (!med || !med.dosePerKgMin || !med.concentration || !med.concentrationVolume) return '';
  const midDose = ((med.dosePerKgMin + med.dosePerKgMax!) / 2) * weightKg; // mg
  const doseInMl = (midDose / med.concentration) * med.concentrationVolume;
  return doseInMl.toFixed(1);
}

// ─── Sub-components ──────────────────────────────────────────────────────────

const TempItem = memo(({ item, onDelete }: { item: TemperatureEntry; onDelete: (id: string) => void }) => {
  const meta = FEVER_META[item.feverStatus];
  const site = SITES.find((s) => s.value === item.site);
  return (
    <View style={styles.listItem}>
      <View style={[styles.itemIconBg, { backgroundColor: meta.color + '20' }]}>
        <Text style={styles.itemEmoji}>{meta.emoji}</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={[styles.itemTitle, { color: meta.color }]}>
          {item.temperature.toFixed(1)}°C
          <Text style={styles.itemSub}> · {site?.label}</Text>
        </Text>
        <Text style={styles.itemMeta}>
          {meta.label} · {format(item.time, 'dd MMM, hh:mm a')}
        </Text>
        {item.notes ? <Text style={styles.itemNotes}>{item.notes}</Text> : null}
      </View>
      <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
});

const MedItem = memo(({ item, onDelete }: { item: MedicationEntry; onDelete: (id: string) => void }) => {
  const overdue = item.nextDoseAt && item.nextDoseAt <= new Date();
  return (
    <View style={styles.listItem}>
      <View style={[styles.itemIconBg, { backgroundColor: Colors.peacock + '20' }]}>
        <Text style={styles.itemEmoji}>💊</Text>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemTitle}>{item.medicineName}</Text>
        <Text style={styles.itemMeta}>
          {item.dose} {item.unit} · {format(item.givenAt, 'dd MMM, hh:mm a')}
        </Text>
        {item.reason ? <Text style={styles.itemNotes}>For: {item.reason}</Text> : null}
        {item.nextDoseAt && (
          <Text style={[styles.nextDose, overdue && styles.nextDoseOverdue]}>
            {overdue ? '⚠️ Next dose overdue' : `Next dose: ${format(item.nextDoseAt, 'hh:mm a')}`}
          </Text>
        )}
      </View>
      <TouchableOpacity onPress={() => onDelete(item.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Ionicons name="trash-outline" size={18} color={Colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
});

// ─── Main Screen ─────────────────────────────────────────────────────────────

type Tab = 'temperature' | 'medicine';

export default function MedicineTrackerScreen() {
  const toast = useToast();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();
  const {
    temperatures, temperatureLoading, logTemperature, fetchTemperatures,
    medications, medicationLoading, logMedication, fetchMedications, removeMedication,
  } = useTrackerStore();

  const [activeTab, setActiveTab] = useState<Tab>('temperature');

  // ── Temperature form state ────────────────────────────────────────────────
  const [tempValue, setTempValue] = useState('');
  const [tempSite, setTempSite] = useState<TemperatureSite>('axillary');
  const [tempNotes, setTempNotes] = useState('');
  const [tempLogging, setTempLogging] = useState(false);

  // ── Medicine form state ───────────────────────────────────────────────────
  const [medModalVisible, setMedModalVisible] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [medName, setMedName] = useState('');
  const [medDose, setMedDose] = useState('');
  const [medUnit, setMedUnit] = useState<MedicationUnit>('ml');
  const [medReason, setMedReason] = useState('');
  const [medNotes, setMedNotes] = useState('');
  const [intervalHours, setIntervalHours] = useState('');
  const [weightKg, setWeightKg] = useState('');
  const [medLogging, setMedLogging] = useState(false);

  const loadData = useCallback(async () => {
    if (!activeBaby) return;
    await Promise.all([
      fetchTemperatures(activeBaby.id),
      fetchMedications(activeBaby.id),
    ]);
  }, [activeBaby]);

  useEffect(() => { loadData(); }, [loadData]);

  const { refreshing, refresh } = useRefresh(loadData);

  // ── Temperature logic ─────────────────────────────────────────────────────

  const latestTemp = temperatures[0];
  const latestMeta = latestTemp ? FEVER_META[latestTemp.feverStatus] : null;

  const handleLogTemp = async () => {
    const val = parseFloat(tempValue);
    if (!activeBaby || !user) return;
    if (isNaN(val) || val < 34 || val > 42) {
      toast.error('Enter a valid temperature (34–42°C)');
      return;
    }
    setTempLogging(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const feverStatus = getFeverStatus(val, tempSite);
      await logTemperature({
        babyId: activeBaby.id,
        userId: user.uid,
        time: new Date(),
        temperature: val,
        site: tempSite,
        feverStatus,
        notes: tempNotes.trim() || undefined,
      });
      toast.success(`${FEVER_META[feverStatus].emoji} ${val}°C logged!`);
      if (feverStatus === 'high_fever') {
        await scheduleHighFeverFollowup(activeBaby, val).catch(() => {});
        Alert.alert(
          '🚨 High Fever Detected',
          `Temperature ${val}°C is dangerously high. Please contact your doctor immediately or call 108.`,
          [
            { text: 'Call 108', onPress: () => Linking.openURL('tel:108'), style: 'destructive' },
            { text: 'OK' },
          ]
        );
      } else if (feverStatus === 'fever') {
        await scheduleHighFeverFollowup(activeBaby, val).catch(() => {});
      }
      setTempValue('');
      setTempNotes('');
    } catch {
      toast.error('Failed to log temperature. Try again.');
    } finally {
      setTempLogging(false);
    }
  };

  const handleDeleteTemp = useCallback((id: string) => {
    Alert.alert('Delete Entry', 'Remove this temperature reading?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          useTrackerStore.setState((s) => ({ temperatures: s.temperatures.filter((t) => t.id !== id) }));
        },
      },
    ]);
  }, []);

  // ── Medicine logic ────────────────────────────────────────────────────────

  const handleSelectPreset = (id: string) => {
    const med = COMMON_BABY_MEDICINES.find((m) => m.id === id);
    if (!med) return;
    setSelectedPreset(id);
    setMedName(med.name);
    setMedUnit(med.unit);
    setMedReason(med.reason);
    setIntervalHours(med.intervalHours ? String(med.intervalHours) : '');
    if (weightKg && med.dosePerKgMin && med.concentration) {
      setMedDose(calcDose(id, parseFloat(weightKg)));
    }
  };

  const handleWeightChange = (val: string) => {
    setWeightKg(val);
    if (selectedPreset && val) {
      const dose = calcDose(selectedPreset, parseFloat(val));
      if (dose) setMedDose(dose);
    }
  };

  const handleLogMed = async () => {
    if (!activeBaby || !user) return;
    if (!medName.trim()) { toast.error('Enter medicine name'); return; }
    const doseNum = parseFloat(medDose);
    if (isNaN(doseNum) || doseNum <= 0) { toast.error('Enter a valid dose'); return; }

    setMedLogging(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    try {
      const now = new Date();
      const nextDoseAt = intervalHours && parseFloat(intervalHours) > 0
        ? addHours(now, parseFloat(intervalHours))
        : undefined;
      const saved = await logMedication({
        babyId: activeBaby.id,
        userId: user.uid,
        medicineName: medName.trim(),
        dose: doseNum,
        unit: medUnit,
        givenAt: now,
        nextDoseAt,
        reason: medReason.trim() || undefined,
        notes: medNotes.trim() || undefined,
      });
      if (nextDoseAt) {
        await scheduleMedicationReminder(activeBaby, saved).catch(() => {});
      }
      toast.success(`💊 ${medName.trim()} logged!${nextDoseAt ? ' Reminder set!' : ''}`);
      setMedModalVisible(false);
      resetMedForm();
    } catch {
      toast.error('Failed to log medicine. Try again.');
    } finally {
      setMedLogging(false);
    }
  };

  const resetMedForm = () => {
    setSelectedPreset(null);
    setMedName('');
    setMedDose('');
    setMedUnit('ml');
    setMedReason('');
    setMedNotes('');
    setIntervalHours('');
    setWeightKg('');
  };

  const handleDeleteMed = useCallback((id: string) => {
    Alert.alert('Delete Entry', 'Remove this medication entry?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: () => {
          const med = useTrackerStore.getState().medications.find((m) => m.id === id);
          if (med && activeBaby) {
            cancelMedicationReminder(activeBaby.id, med.givenAt.getTime()).catch(() => {});
          }
          removeMedication(id);
        },
      },
    ]);
  }, [removeMedication, activeBaby]);

  // ── Render ────────────────────────────────────────────────────────────────

  const renderTempItem = useCallback(({ item }: ListRenderItemInfo<TemperatureEntry>) => (
    <TempItem item={item} onDelete={handleDeleteTemp} />
  ), [handleDeleteTemp]);

  const renderMedItem = useCallback(({ item }: ListRenderItemInfo<MedicationEntry>) => (
    <MedItem item={item} onDelete={handleDeleteMed} />
  ), [handleDeleteMed]);

  const isLoading = activeTab === 'temperature' ? temperatureLoading : medicationLoading;
  const listData = activeTab === 'temperature' ? temperatures : medications;

  const ListHeader = (
    <View style={styles.listHeader}>
      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {(['temperature', 'medicine'] as Tab[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab === 'temperature' ? '🌡️ Temperature' : '💊 Medicine'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'temperature' ? (
        <>
          {/* Latest reading banner */}
          {latestTemp && latestMeta && (
            <LinearGradient
              colors={[latestMeta.color + '30', latestMeta.color + '08']}
              style={styles.latestBanner}
            >
              <Text style={styles.latestEmoji}>{latestMeta.emoji}</Text>
              <View>
                <Text style={[styles.latestTemp, { color: latestMeta.color }]}>
                  {latestTemp.temperature.toFixed(1)}°C
                </Text>
                <Text style={styles.latestLabel}>{latestMeta.label} · Last reading</Text>
                <Text style={styles.latestTime}>{format(latestTemp.time, 'dd MMM, hh:mm a')}</Text>
              </View>
              {latestTemp.feverStatus !== 'normal' && (
                <TouchableOpacity
                  style={styles.callBtn}
                  onPress={() => Linking.openURL('tel:108')}
                >
                  <Text style={styles.callBtnText}>📞 108</Text>
                </TouchableOpacity>
              )}
            </LinearGradient>
          )}

          {/* Log Form */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>Log Temperature</Text>
            <View style={styles.tempInputRow}>
              <TextInput
                style={styles.tempInput}
                placeholder="37.0"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
                value={tempValue}
                onChangeText={setTempValue}
                maxLength={5}
              />
              <Text style={styles.tempUnit}>°C</Text>
            </View>

            {/* Fever status preview */}
            {tempValue && !isNaN(parseFloat(tempValue)) && parseFloat(tempValue) >= 34 && (
              <View style={[styles.feverPreview, {
                backgroundColor: FEVER_META[getFeverStatus(parseFloat(tempValue), tempSite)].color + '20'
              }]}>
                <Text style={{ color: FEVER_META[getFeverStatus(parseFloat(tempValue), tempSite)].color, fontWeight: '700', fontSize: Typography.sm }}>
                  {FEVER_META[getFeverStatus(parseFloat(tempValue), tempSite)].emoji}{' '}
                  {FEVER_META[getFeverStatus(parseFloat(tempValue), tempSite)].label}
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Measurement Site</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {SITES.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.chip, tempSite === s.value && styles.chipActive]}
                    onPress={() => setTempSite(s.value)}
                  >
                    <Text style={[styles.chipText, tempSite === s.value && styles.chipTextActive]}>
                      {s.icon} {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={styles.notesInput}
              placeholder="Notes (optional)"
              placeholderTextColor={Colors.textDisabled}
              value={tempNotes}
              onChangeText={setTempNotes}
              multiline
            />

            <TouchableOpacity
              style={[styles.logBtn, (!tempValue || tempLogging) && styles.logBtnDisabled]}
              onPress={handleLogTemp}
              disabled={!tempValue || tempLogging}
            >
              <LinearGradient colors={[Colors.error, Colors.error + 'CC']} style={styles.logBtnGradient}>
                <Text style={styles.logBtnText}>{tempLogging ? 'Logging...' : '🌡️ Log Temperature'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={styles.sectionTitle}>Temperature History</Text>
        </>
      ) : (
        <>
          {/* Medicine quick stats */}
          {medications.length > 0 && (
            <LinearGradient colors={[Colors.peacock + '25', Colors.peacock + '05']} style={styles.medStatCard}>
              <Text style={styles.medStatTitle}>Today's Medicines</Text>
              <Text style={styles.medStatCount}>
                {medications.filter((m) => {
                  const today = new Date();
                  return m.givenAt.toDateString() === today.toDateString();
                }).length} doses given today
              </Text>
            </LinearGradient>
          )}

          {/* Add medicine button */}
          <TouchableOpacity style={styles.addMedBtn} onPress={() => setMedModalVisible(true)}>
            <LinearGradient colors={[Colors.peacock, Colors.peacockDark]} style={styles.addMedBtnGradient}>
              <Ionicons name="add-circle-outline" size={22} color="#fff" />
              <Text style={styles.addMedBtnText}>Log Medicine / Dose</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.sectionTitle}>Medication Log</Text>
        </>
      )}

      {isLoading && listData.length === 0 && (
        <>
          <SkeletonListItem />
          <SkeletonListItem />
        </>
      )}
    </View>
  );

  return (
    <>
      <FlatList
        style={styles.container}
        data={isLoading && listData.length === 0 ? [] : listData as any[]}
        renderItem={activeTab === 'temperature' ? renderTempItem : renderMedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              emoji={activeTab === 'temperature' ? '🌡️' : '💊'}
              title={activeTab === 'temperature' ? 'No temperature readings' : 'No medicine logged'}
              subtitle={activeTab === 'temperature'
                ? 'Log your baby\'s temperature above'
                : 'Tap "Log Medicine" to add a dose'}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onRefresh={refresh}
        refreshing={refreshing}
      />

      {/* Add Medicine Modal */}
      <Modal visible={medModalVisible} animationType="slide" presentationStyle="pageSheet">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
          <ScrollView style={styles.modal} contentContainerStyle={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💊 Log Medicine</Text>
              <TouchableOpacity onPress={() => { setMedModalVisible(false); resetMedForm(); }}>
                <Ionicons name="close" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Common medicine presets */}
            <Text style={styles.inputLabel}>Common Medicines</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
              <View style={styles.chipRow}>
                {COMMON_BABY_MEDICINES.map((med) => (
                  <TouchableOpacity
                    key={med.id}
                    style={[styles.medPresetChip, selectedPreset === med.id && { borderColor: med.color, backgroundColor: med.color + '15' }]}
                    onPress={() => handleSelectPreset(med.id)}
                  >
                    <Text style={styles.medPresetIcon}>{med.icon}</Text>
                    <Text style={[styles.medPresetName, selectedPreset === med.id && { color: med.color }]}>{med.name}</Text>
                    <Text style={styles.medPresetReason}>{med.reason}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* Dosage calculator */}
            {selectedPreset && COMMON_BABY_MEDICINES.find((m) => m.id === selectedPreset)?.dosePerKgMin && (
              <View style={styles.calcCard}>
                <Text style={styles.calcTitle}>⚖️ Dosage Calculator</Text>
                <View style={styles.calcRow}>
                  <TextInput
                    style={styles.calcInput}
                    placeholder="Baby weight (kg)"
                    placeholderTextColor={Colors.textDisabled}
                    keyboardType="decimal-pad"
                    value={weightKg}
                    onChangeText={handleWeightChange}
                  />
                  <Text style={styles.calcUnit}>kg</Text>
                </View>
                {weightKg && medDose ? (
                  <Text style={styles.calcResult}>
                    Recommended: <Text style={styles.calcResultBold}>{medDose} ml</Text>
                    {' '}(mid-range dose)
                  </Text>
                ) : null}
                <Text style={styles.calcDisclaimer}>
                  Always confirm dosage with your paediatrician.
                </Text>
              </View>
            )}

            <Text style={styles.inputLabel}>Medicine Name *</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Calpol, Brufen, ORS"
              placeholderTextColor={Colors.textDisabled}
              value={medName}
              onChangeText={setMedName}
            />

            <Text style={styles.inputLabel}>Dose *</Text>
            <View style={styles.doseRow}>
              <TextInput
                style={[styles.formInput, { flex: 1 }]}
                placeholder="5"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
                value={medDose}
                onChangeText={setMedDose}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexShrink: 0 }}>
                <View style={styles.chipRow}>
                  {UNITS.map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.chip, medUnit === u && styles.chipActive]}
                      onPress={() => setMedUnit(u)}
                    >
                      <Text style={[styles.chipText, medUnit === u && styles.chipTextActive]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <Text style={styles.inputLabel}>Reason / Illness</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Fever, Cold, Diarrhea"
              placeholderTextColor={Colors.textDisabled}
              value={medReason}
              onChangeText={setMedReason}
            />

            <Text style={styles.inputLabel}>Next dose in (hours)</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. 6"
              placeholderTextColor={Colors.textDisabled}
              keyboardType="decimal-pad"
              value={intervalHours}
              onChangeText={setIntervalHours}
            />

            <Text style={styles.inputLabel}>Notes</Text>
            <TextInput
              style={[styles.formInput, styles.notesInput]}
              placeholder="Prescribed by, batch number, etc."
              placeholderTextColor={Colors.textDisabled}
              value={medNotes}
              onChangeText={setMedNotes}
              multiline
            />

            <TouchableOpacity
              style={[styles.logBtn, (!medName || !medDose || medLogging) && styles.logBtnDisabled]}
              onPress={handleLogMed}
              disabled={!medName || !medDose || medLogging}
            >
              <LinearGradient colors={[Colors.peacock, Colors.peacockDark]} style={styles.logBtnGradient}>
                <Text style={styles.logBtnText}>{medLogging ? 'Saving...' : '💊 Save Dose'}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.xl, paddingBottom: 100 },
  listHeader: { gap: Spacing.lg, marginBottom: Spacing.md },

  tabRow: { flexDirection: 'row', backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: Spacing.sm, borderRadius: Radius.lg, alignItems: 'center' },
  tabActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  tabLabel: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  tabLabelActive: { color: Colors.textPrimary },

  latestBanner: { borderRadius: Radius['2xl'], padding: Spacing.lg, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  latestEmoji: { fontSize: 40 },
  latestTemp: { fontSize: Typography['2xl'], fontWeight: '800' },
  latestLabel: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  latestTime: { fontSize: Typography.xs, color: Colors.textTertiary },
  callBtn: { marginLeft: 'auto', backgroundColor: Colors.error, borderRadius: Radius.xl, paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs },
  callBtnText: { color: '#fff', fontWeight: '700', fontSize: Typography.sm },

  formCard: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.lg, gap: Spacing.md, ...Shadows.sm },
  formTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  tempInputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  tempInput: {
    flex: 1, backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    fontSize: Typography['2xl'], fontWeight: '700', color: Colors.textPrimary, textAlign: 'center',
  },
  tempUnit: { fontSize: Typography['2xl'], fontWeight: '700', color: Colors.textSecondary },
  feverPreview: { borderRadius: Radius.lg, padding: Spacing.sm, alignItems: 'center' },
  inputLabel: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textSecondary, marginBottom: -4 },
  chipScroll: { marginHorizontal: -Spacing.xl },
  chipRow: { flexDirection: 'row', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  chip: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary + '15' },
  chipText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  chipTextActive: { color: Colors.primary },
  notesInput: {
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.sm, color: Colors.textPrimary, minHeight: 60,
  },
  logBtn: { borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadows.md },
  logBtnDisabled: { opacity: 0.5 },
  logBtnGradient: { padding: Spacing.lg, alignItems: 'center' },
  logBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.base },

  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },

  medStatCard: { borderRadius: Radius['2xl'], padding: Spacing.lg },
  medStatTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  medStatCount: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 4 },
  addMedBtn: { borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadows.md },
  addMedBtnGradient: { flexDirection: 'row', padding: Spacing.lg, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  addMedBtnText: { color: '#fff', fontWeight: '800', fontSize: Typography.base },

  listItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  itemIconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  itemEmoji: { fontSize: 22 },
  itemInfo: { flex: 1 },
  itemTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  itemSub: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '400' },
  itemMeta: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  itemNotes: { fontSize: Typography.xs, color: Colors.textTertiary, marginTop: 2 },
  nextDose: { fontSize: Typography.xs, color: Colors.success, fontWeight: '600', marginTop: 2 },
  nextDoseOverdue: { color: Colors.error },

  modal: { flex: 1, backgroundColor: Colors.background },
  modalContent: { padding: Spacing.xl, paddingBottom: 60, gap: Spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  modalTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },

  medPresetChip: {
    alignItems: 'center', padding: Spacing.md, borderRadius: Radius.xl,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface,
    minWidth: 90,
  },
  medPresetIcon: { fontSize: 24, marginBottom: 4 },
  medPresetName: { fontSize: Typography.sm, fontWeight: '700', color: Colors.textPrimary },
  medPresetReason: { fontSize: Typography.xs, color: Colors.textTertiary, textAlign: 'center' },

  calcCard: {
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl,
    padding: Spacing.md, gap: Spacing.sm, borderWidth: 1, borderColor: Colors.border,
  },
  calcTitle: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  calcRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  calcInput: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.base, color: Colors.textPrimary, borderWidth: 1, borderColor: Colors.border,
  },
  calcUnit: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  calcResult: { fontSize: Typography.sm, color: Colors.textSecondary },
  calcResultBold: { fontWeight: '800', color: Colors.peacock },
  calcDisclaimer: { fontSize: Typography.xs, color: Colors.textTertiary, fontStyle: 'italic' },

  formInput: {
    backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: Typography.base, color: Colors.textPrimary,
  },
  doseRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
});
