import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar, SafeAreaView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { APP_NAME } from '@constants/index';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
      ]),
    ]).start();

    // Pulse animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, { toValue: -8, duration: 1200, useNativeDriver: true }),
        Animated.timing(bounceAnim, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      <LinearGradient
        colors={['#FF6B8A', '#FF8E53', '#FFB347']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Decorative circles */}
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />

        <SafeAreaView style={styles.content}>
          {/* Logo */}
          <Animated.View style={[styles.logoContainer, { transform: [{ translateY: bounceAnim }] }]}>
            <View style={styles.logoWrapper}>
              <Text style={styles.logoEmoji}>👶</Text>
            </View>
            <Text style={styles.appName}>{APP_NAME}</Text>
          </Animated.View>

          {/* Tagline */}
          <Animated.View style={[styles.taglineContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <Text style={styles.tagline}>{t('auth.tagline')}</Text>

            <View style={styles.featuresRow}>
              {[
                { icon: 'mic', text: 'Cry Detection' },
                { icon: 'analytics', text: 'Smart Tracking' },
                { icon: 'heart', text: 'AI Insights' },
              ].map((f) => (
                <View key={f.text} style={styles.featureChip}>
                  <Ionicons name={f.icon as any} size={14} color={Colors.primary} />
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Buttons */}
          <Animated.View style={[styles.buttons, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryBtnText}>{t('auth.getStarted')}</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => navigation.navigate('Login')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryBtnText}>{t('auth.login')}</Text>
            </TouchableOpacity>

            <Text style={styles.terms}>{t('auth.termsAgreement')}</Text>
          </Animated.View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  circle1: { width: 280, height: 280, top: -80, right: -60 },
  circle2: { width: 200, height: 200, top: height * 0.3, left: -80 },
  circle3: { width: 150, height: 150, bottom: height * 0.25, right: -30 },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
    paddingTop: Spacing['4xl'],
    paddingBottom: Spacing['2xl'],
  },
  logoContainer: { alignItems: 'center', marginTop: Spacing['3xl'] },
  logoWrapper: {
    width: 100,
    height: 100,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.lg,
  },
  logoEmoji: { fontSize: 52 },
  appName: {
    fontSize: Typography['3xl'],
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  taglineContainer: { alignItems: 'center' },
  tagline: {
    fontSize: Typography.md,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    lineHeight: 26,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  featuresRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  featureChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  featureText: {
    fontSize: Typography.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  buttons: { gap: Spacing.md },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: Radius['2xl'],
    height: 56,
    gap: Spacing.sm,
    ...Shadows.md,
  },
  primaryBtnText: {
    fontSize: Typography.md,
    fontWeight: '700',
    color: Colors.primary,
  },
  secondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius['2xl'],
    height: 56,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  secondaryBtnText: {
    fontSize: Typography.md,
    fontWeight: '600',
    color: '#fff',
  },
  terms: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: Spacing.lg,
  },
});
