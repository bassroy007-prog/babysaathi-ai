import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import DateTimePicker from '@react-native-community/datetimepicker';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useBabyStore } from '@store/babyStore';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { Gender, BloodGroup } from '@types/index';

export default function AddBabyScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const toast = useToast();
  const { addBaby } = useBabyStore();
  const { user } = useAuthStore();

  const [name, setName] = useState('');
  const [gender, setGender] = useState<Gender>('male');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [birthWeight, setBirthWeight] = useState('');
  const [birthHeight, setBirthHeight] = useState('');
  const [headCirc, setHeadCirc] = useState('');
  const [bloodGroup, setBloodGroup] = useState<BloodGroup>('Unknown');
  const [loading, setLoading] = useState(false);

  const handleNext = async () => {
    if (!name.trim()) {
      toast.error("Please enter baby's name.");
      return;
    }
    if (!user) return;
    setLoading(true);
    try {
      await addBaby({
        ownerId: user.uid,
        name: name.trim(),
        gender,
        birthDate,
        birthWeight: parseFloat(birthWeight) * 1000 || 3500,
        birthHeight: parseFloat(birthHeight) || 50,
        headCircumference: parseFloat(headCirc) || 34,
        bloodGroup,
      });
      navigation.navigate('OnboardingNotifications');
    } catch (e: any) {
      toast.error(e.message ?? 'Failed to save baby profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#FF6B8A', '#FF8E53']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.stepIndicator}>
              {[1, 2, 3, 4].map((s) => (
                <View key={s} style={[styles.step, s === 1 && styles.stepActive, s < 1 && styles.stepDone]} />
              ))}
            </View>
            <Text style={styles.stepText}>Step 1 of 5</Text>
            <Text style={styles.headerTitle}>{t('onboarding.addBaby')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Baby icon */}
        <View style={styles.babyIconContainer}>
          <Text style={styles.babyIcon}>👶</Text>
        </View>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('onboarding.babyName')} *</Text>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Aarav, Ananya"
              placeholderTextColor={Colors.textDisabled}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Gender */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('onboarding.gender')}</Text>
          <View style={styles.genderRow}>
            {(['male', 'female'] as Gender[]).map((g) => (
              <TouchableOpacity
                key={g}
                style={[styles.genderBtn, gender === g && styles.genderBtnActive]}
                onPress={() => setGender(g)}
              >
                <Text style={styles.genderEmoji}>{g === 'male' ? '👦' : '👧'}</Text>
                <Text style={[styles.genderText, gender === g && styles.genderTextActive]}>
                  {g === 'male' ? t('onboarding.male') : t('onboarding.female')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Birth Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('onboarding.birthDate')}</Text>
          <TouchableOpacity style={styles.inputWrapper} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} style={{ marginRight: Spacing.sm }} />
            <Text style={styles.input}>{formatDate(birthDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={birthDate}
              mode="date"
              maximumDate={new Date()}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date) setBirthDate(date);
              }}
            />
          )}
        </View>

        {/* Weight & Height */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>{t('onboarding.birthWeight')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={birthWeight}
                onChangeText={setBirthWeight}
                placeholder="3.5"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unit}>kg</Text>
            </View>
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>{t('onboarding.birthHeight')}</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                value={birthHeight}
                onChangeText={setBirthHeight}
                placeholder="50"
                placeholderTextColor={Colors.textDisabled}
                keyboardType="decimal-pad"
              />
              <Text style={styles.unit}>cm</Text>
            </View>
          </View>
        </View>

        {/* Blood Group */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Blood Group</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.bloodGroupRow}>
              {(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'] as BloodGroup[]).map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[styles.bloodGroupBtn, bloodGroup === bg && styles.bloodGroupActive]}
                  onPress={() => setBloodGroup(bg)}
                >
                  <Text style={[styles.bloodGroupText, bloodGroup === bg && styles.bloodGroupTextActive]}>{bg}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <TouchableOpacity
          style={[styles.nextBtn, loading && { opacity: 0.7 }]}
          onPress={handleNext}
          disabled={loading}
        >
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.nextText}>{t('common.next')}</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing.lg },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm },
  stepIndicator: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  step: { flex: 1, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)' },
  stepActive: { backgroundColor: '#fff' },
  stepDone: { backgroundColor: 'rgba(255,255,255,0.8)' },
  stepText: { color: 'rgba(255,255,255,0.8)', fontSize: Typography.sm, marginBottom: 4 },
  headerTitle: { color: '#fff', fontSize: Typography.xl, fontWeight: '800' },
  scroll: { padding: Spacing.xl, gap: Spacing.lg },
  babyIconContainer: {
    alignSelf: 'center',
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center', justifyContent: 'center',
  },
  babyIcon: { fontSize: 44 },
  inputGroup: { gap: 6 },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    height: 52,
    ...Shadows.sm,
  },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  unit: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  genderRow: { flexDirection: 'row', gap: Spacing.md },
  genderBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 56, borderRadius: Radius.xl,
    borderWidth: 2, borderColor: Colors.border, backgroundColor: Colors.surface, ...Shadows.sm,
  },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '20' },
  genderEmoji: { fontSize: 24 },
  genderText: { fontSize: Typography.base, fontWeight: '600', color: Colors.textSecondary },
  genderTextActive: { color: Colors.primary },
  row: { flexDirection: 'row', gap: Spacing.md },
  bloodGroupRow: { flexDirection: 'row', gap: Spacing.sm, paddingVertical: 4 },
  bloodGroupBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.lg, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  bloodGroupActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '20' },
  bloodGroupText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textSecondary },
  bloodGroupTextActive: { color: Colors.primary },
  nextBtn: { borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.md },
  nextGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  nextText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
});
