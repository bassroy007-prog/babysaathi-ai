import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';

export default function OnboardingCompleteScreen() {
  const { t } = useTranslation();
  const { setOnboardingComplete } = useAuthStore();
  const { activeBaby } = useBabyStore();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1, tension: 60, friction: 5, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#FF6B8A', '#FF8E53', '#FFB347']} style={styles.gradient}>
        <SafeAreaView style={styles.content}>
          <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleAnim }] }]}>
            <Text style={styles.successEmoji}>🎉</Text>
          </Animated.View>

          <Animated.View style={{ opacity: fadeAnim, alignItems: 'center' }}>
            <Text style={styles.title}>{t('onboarding.allSet')}</Text>
            {activeBaby && (
              <Text style={styles.babyName}>
                Welcome, {activeBaby.name}'s parents!
              </Text>
            )}
            <Text style={styles.desc}>{t('onboarding.allSetDesc')}</Text>

            <View style={styles.checkList}>
              {[
                'Baby profile created',
                'AI cry detection ready',
                'Smart reminders enabled',
                'Growth tracking started',
              ].map((item) => (
                <View key={item} style={styles.checkItem}>
                  <View style={styles.checkCircle}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </View>
                  <Text style={styles.checkText}>{item}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.startBtn}
              onPress={() => setOnboardingComplete(true)}
              activeOpacity={0.85}
            >
              <Text style={styles.startBtnText}>Start Using BabySaathi</Text>
              <Ionicons name="arrow-forward" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.xl },
  successIcon: {
    width: 120, height: 120, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing['2xl'],
  },
  successEmoji: { fontSize: 64 },
  title: { fontSize: Typography['3xl'], fontWeight: '800', color: '#fff', marginBottom: Spacing.sm },
  babyName: { fontSize: Typography.xl, color: 'rgba(255,255,255,0.9)', marginBottom: Spacing.sm, fontWeight: '600' },
  desc: { fontSize: Typography.base, color: 'rgba(255,255,255,0.85)', textAlign: 'center', lineHeight: 24, marginBottom: Spacing['2xl'] },
  checkList: { width: '100%', gap: Spacing.md, marginBottom: Spacing['2xl'] },
  checkItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  checkCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.3)', alignItems: 'center', justifyContent: 'center' },
  checkText: { fontSize: Typography.base, color: '#fff', fontWeight: '500' },
  startBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, backgroundColor: '#fff', borderRadius: Radius['2xl'],
    height: 56, width: '100%', ...Shadows.lg,
  },
  startBtnText: { fontSize: Typography.md, fontWeight: '700', color: Colors.primary },
});
