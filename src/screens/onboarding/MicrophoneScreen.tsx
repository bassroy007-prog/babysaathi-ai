import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import { useTranslation } from 'react-i18next';
import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';

export default function MicrophoneScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const requestPermission = async () => {
    await Audio.requestPermissionsAsync();
    navigation.navigate('OnboardingCamera');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B8A', '#FF8E53']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.stepIndicator}>
              {[1, 2, 3, 4].map((s) => (
                <View key={s} style={[styles.step, s <= 3 && styles.stepDone, s === 3 && styles.stepActive]} />
              ))}
            </View>
            <Text style={styles.stepText}>Step 3 of 5</Text>
            <Text style={styles.headerTitle}>{t('onboarding.enableMicrophone')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🎤</Text>
        </View>
        <Text style={styles.title}>{t('onboarding.enableMicrophone')}</Text>
        <Text style={styles.desc}>{t('onboarding.microphoneDesc')}</Text>

        <View style={styles.infoCard}>
          <Ionicons name="shield-checkmark" size={24} color={Colors.success} />
          <Text style={styles.infoText}>Audio is processed on-device. Your baby's audio is never sent to the cloud.</Text>
        </View>

        <TouchableOpacity style={styles.allowBtn} onPress={requestPermission}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={styles.btnGradient}
          >
            <Ionicons name="mic" size={22} color="#fff" />
            <Text style={styles.btnText}>{t('onboarding.allowAccess')}</Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('OnboardingCamera')} style={styles.skipBtn}>
          <Text style={styles.skipText}>{t('onboarding.maybeLayer')}</Text>
        </TouchableOpacity>
      </View>
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
  content: { flex: 1, padding: Spacing.xl, alignItems: 'center' },
  iconContainer: {
    width: 100, height: 100, borderRadius: 30,
    backgroundColor: Colors.primaryLight + '30',
    alignItems: 'center', justifyContent: 'center', marginVertical: Spacing.xl,
  },
  icon: { fontSize: 52 },
  title: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary, marginBottom: Spacing.sm, textAlign: 'center' },
  desc: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.xl },
  infoCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md,
    backgroundColor: Colors.success + '15', padding: Spacing.lg,
    borderRadius: Radius.xl, width: '100%', marginBottom: Spacing['2xl'],
  },
  infoText: { flex: 1, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  allowBtn: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md },
  btnGradient: { height: 54, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm },
  btnText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
  skipBtn: { padding: Spacing.md },
  skipText: { fontSize: Typography.base, color: Colors.textSecondary },
});
