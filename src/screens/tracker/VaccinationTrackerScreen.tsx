import React, { useEffect, useState, useCallback, memo } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ListRenderItemInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, addWeeks } from 'date-fns';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useTrackerStore } from '@store/trackerStore';
import { useBabyStore } from '@store/babyStore';
import { useToast } from '@components/common/Toast';
import { SkeletonListItem, EmptyState } from '@components/common/index';
import { useRefresh } from '@hooks/useRefresh';
import { INDIA_VACCINE_SCHEDULE } from '@constants/index';
import { VaccinationEntry } from '@types/index';

const VaccineItem = memo(({
  vaccine,
  onMark,
}: {
  vaccine: VaccinationEntry;
  onMark: (v: VaccinationEntry) => void;
}) => {
  const { t } = useTranslation();
  const isOverdue = vaccine.status === 'overdue';
  const isDone = vaccine.status === 'administered';
  return (
    <View style={[styles.vaccineCard, isOverdue && styles.vaccineOverdue]}>
      <View style={[styles.vaccineIcon, {
        backgroundColor: isDone
          ? Colors.success + '20'
          : isOverdue ? Colors.error + '20' : Colors.warning + '20',
      }]}>
        <Text style={{ fontSize: 24 }}>💉</Text>
      </View>
      <View style={styles.vaccineInfo}>
        <Text style={styles.vaccineName}>{vaccine.vaccineName}</Text>
        <Text style={[styles.vaccineDate, {
          color: isOverdue ? Colors.error : isDone ? Colors.success : Colors.textSecondary,
        }]}>
          {isDone
            ? `Given: ${format(vaccine.administeredDate!, 'dd MMM yyyy')}`
            : isOverdue
            ? `⚠️ Overdue: ${format(vaccine.scheduledDate, 'dd MMM yyyy')}`
            : `${t('home.due')}: ${format(vaccine.scheduledDate, 'dd MMM yyyy')}`}
        </Text>
        {vaccine.doctorName && (
          <Text style={styles.vaccineDoctor}>Dr. {vaccine.doctorName}</Text>
        )}
      </View>
      {!isDone && (
        <TouchableOpacity
          style={[styles.markBtn, { backgroundColor: isOverdue ? Colors.error : Colors.warning }]}
          onPress={() => onMark(vaccine)}
        >
          <Ionicons name="checkmark" size={16} color="#fff" />
        </TouchableOpacity>
      )}
      {isDone && <Ionicons name="checkmark-circle" size={28} color={Colors.success} />}
    </View>
  );
});

export default function VaccinationTrackerScreen() {
  const { t } = useTranslation();
  const toast = useToast();
  const { activeBaby } = useBabyStore();
  const { vaccinations, fetchVaccinations, markVaccineAdministered, vaccinationLoading } = useTrackerStore();
  const [activeTab, setActiveTab] = useState<'pending' | 'administered'>('pending');

  const loadVaccinations = useCallback(async () => {
    if (activeBaby) await fetchVaccinations(activeBaby.id);
  }, [activeBaby]);

  useEffect(() => { loadVaccinations(); }, [loadVaccinations]);

  const { refreshing, refresh } = useRefresh(loadVaccinations);

  const getScheduledVaccines = (): VaccinationEntry[] => {
    if (!activeBaby) return [];
    return INDIA_VACCINE_SCHEDULE.map((v) => {
      const existing = vaccinations.find((vac) => vac.vaccineId === v.id);
      if (existing) return existing;
      const scheduledDate = addWeeks(activeBaby.birthDate, v.ageWeeks);
      const isPast = scheduledDate < new Date();
      return {
        id: `scheduled_${v.id}`,
        babyId: activeBaby.id,
        vaccineId: v.id,
        vaccineName: v.name,
        scheduledDate,
        status: isPast ? 'overdue' : 'pending',
        createdAt: new Date(),
      } as VaccinationEntry;
    });
  };

  const allVaccines = getScheduledVaccines();
  const pending = allVaccines.filter((v) => v.status === 'pending' || v.status === 'overdue');
  const administered = allVaccines.filter((v) => v.status === 'administered');
  const displayVaccines = activeTab === 'pending' ? pending : administered;

  const handleMark = useCallback((vaccine: VaccinationEntry) => {
    Alert.alert(
      'Mark as Administered',
      `Mark ${vaccine.vaccineName} as given today?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await markVaccineAdministered(vaccine.id, new Date());
              await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              toast.success(`💉 ${vaccine.vaccineName} marked as administered!`);
            } catch {
              toast.error('Failed to update vaccine. Please try again.');
            }
          },
        },
      ]
    );
  }, [markVaccineAdministered, toast]);

  const renderItem = useCallback(({ item }: ListRenderItemInfo<VaccinationEntry>) => (
    <VaccineItem vaccine={item} onMark={handleMark} />
  ), [handleMark]);

  const keyExtractor = useCallback((item: VaccinationEntry) => item.id, []);

  const ListHeader = (
    <View style={styles.listHeader}>
      <View style={styles.summaryRow}>
        {[
          { value: pending.length, label: 'Pending', color: Colors.warning },
          { value: administered.length, label: 'Done', color: Colors.success },
          { value: allVaccines.length, label: 'Total', color: Colors.primary },
        ].map((s) => (
          <View key={s.label} style={[styles.summaryCard, { backgroundColor: s.color + '20' }]}>
            <Text style={[styles.summaryValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.summaryLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.tabs}>
        {(['pending', 'administered'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'pending'
                ? `${t('tracker.upcoming')} (${pending.length})`
                : `${t('tracker.administered')} (${administered.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {vaccinationLoading && displayVaccines.length === 0 && (
        <>
          <SkeletonListItem />
          <SkeletonListItem />
          <SkeletonListItem />
        </>
      )}
    </View>
  );

  return (
    <FlatList
      style={styles.container}
      data={vaccinationLoading && displayVaccines.length === 0 ? [] : displayVaccines}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeader}
      ListEmptyComponent={
        vaccinationLoading ? null : (
          <EmptyState
            emoji="💉"
            title={activeTab === 'pending' ? 'No pending vaccines!' : 'No vaccines administered yet.'}
          />
        )
      }
      ItemSeparatorComponent={() => <View style={{ height: Spacing.sm }} />}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      onRefresh={refresh}
      refreshing={refreshing}
      removeClippedSubviews
      maxToRenderPerBatch={10}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  listContent: { padding: Spacing.xl, paddingBottom: 100 },
  listHeader: { gap: Spacing.md, marginBottom: Spacing.md },
  summaryRow: { flexDirection: 'row', gap: Spacing.md },
  summaryCard: { flex: 1, borderRadius: Radius.xl, padding: Spacing.md, alignItems: 'center' },
  summaryValue: { fontSize: Typography.xl, fontWeight: '800' },
  summaryLabel: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  tabs: { flexDirection: 'row', backgroundColor: Colors.surfaceVariant, borderRadius: Radius.xl, padding: 4, gap: 4 },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.lg },
  tabActive: { backgroundColor: Colors.surface, ...Shadows.sm },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: Colors.warning, fontWeight: '700' },
  vaccineCard: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  vaccineOverdue: { borderWidth: 1.5, borderColor: Colors.error + '50' },
  vaccineIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  vaccineInfo: { flex: 1 },
  vaccineName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  vaccineDate: { fontSize: Typography.sm, marginTop: 2 },
  vaccineDoctor: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 2 },
  markBtn: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
