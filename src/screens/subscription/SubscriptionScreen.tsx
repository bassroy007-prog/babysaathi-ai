import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { PurchasesPackage } from 'react-native-purchases';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { revenueCat, PaywallOffering, PremiumFeature } from '@services/subscription/revenueCat';
import { useAuthStore } from '@store/authStore';

const PLAN_FEATURES: Array<{ icon: string; label: string; free: string | boolean; premium: boolean; family: boolean }> = [
  { icon: '📊', label: 'Feed, Sleep & Diaper Tracking', free: true, premium: true, family: true },
  { icon: '📅', label: 'History / Itihas', free: '7 days', premium: true, family: true },
  { icon: '💉', label: 'Vaccination Schedule / Teeka', free: true, premium: true, family: true },
  { icon: '🧿', label: 'AI Guru Chat (Hinglish)', free: false, premium: true, family: true },
  { icon: '🎤', label: 'AI Cry Detection', free: false, premium: true, family: true },
  { icon: '📸', label: 'Photo Journal', free: false, premium: true, family: true },
  { icon: '📈', label: 'Growth Charts & Analytics', free: false, premium: true, family: true },
  { icon: '🍲', label: 'Baby Food Guide (Indian)', free: false, premium: true, family: true },
  { icon: '🩺', label: 'Symptom Checker', free: false, premium: true, family: true },
  { icon: '📋', label: 'Doctor Report PDF', free: false, premium: true, family: true },
  { icon: '👨‍👩‍👧', label: 'Family Sharing (up to 5)', free: false, premium: false, family: true },
  { icon: '📤', label: 'Export All Data', free: false, premium: true, family: true },
];

type PlanTab = 'monthly' | 'annual';
type PlanType = 'premium' | 'family';

export default function SubscriptionScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const [offerings, setOfferings] = useState<PaywallOffering | null>(null);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [billingTab, setBillingTab] = useState<PlanTab>('annual');
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('premium');

  useEffect(() => {
    loadOfferings();
  }, []);

  const loadOfferings = async () => {
    setLoading(true);
    try {
      await revenueCat.initialize(user?.id);
      const off = await revenueCat.getOfferings();
      setOfferings(off);
    } catch (error) {
      console.error('Failed to load offerings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPackage = (): PurchasesPackage | null => {
    if (!offerings) return null;
    if (selectedPlan === 'premium') {
      return billingTab === 'annual' ? offerings.annual : offerings.monthly;
    }
    return billingTab === 'annual' ? offerings.familyAnnual : offerings.familyMonthly;
  };

  const handlePurchase = useCallback(async () => {
    const pkg = getPackage();
    if (!pkg) {
      Alert.alert('Not Available', 'This plan is not available in your region yet.');
      return;
    }

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPurchasing(true);

    const result = await revenueCat.purchasePackage(pkg);

    setPurchasing(false);

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Welcome to Premium!',
        `You now have access to all ${selectedPlan === 'family' ? 'Family' : 'Premium'} features. Enjoy BabySaathi!`,
        [{ text: 'Let\'s Go!' }]
      );
    } else if (result.error !== 'cancelled') {
      Alert.alert('Purchase Failed', result.error ?? 'Something went wrong. Please try again.');
    }
  }, [offerings, selectedPlan, billingTab]);

  const handleRestore = async () => {
    setPurchasing(true);
    const result = await revenueCat.restorePurchases();
    setPurchasing(false);

    if (result.tier !== 'free') {
      Alert.alert('Restored!', 'Your subscription has been restored successfully.');
    } else {
      Alert.alert('No Active Subscription', 'No previous purchase found for this Apple/Google account.');
    }
  };

  const pkg = getPackage();
  const PRICES = {
    premium: { monthly: '₹199/month', annual: '₹1,999/year', annualMonthly: '₹167/month' },
    family:  { monthly: '₹349/month', annual: '₹3,499/year', annualMonthly: '₹292/month' },
  };
  const planPrices = PRICES[selectedPlan];
  const priceText = pkg?.product.priceString ?? (billingTab === 'annual' ? planPrices.annual : planPrices.monthly);
  const annualSavings = selectedPlan === 'premium' ? '16%' : '17%';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Hero gradient — desi saffron */}
      <LinearGradient colors={[Colors.primary, Colors.accent, '#E8A000']} style={styles.hero}>
        <Text style={styles.heroEmoji}>🧿</Text>
        <Text style={styles.heroTitle}>BabySaathi Premium</Text>
        <Text style={styles.heroSub}>Poore parivaar ka AI saathi — complete Indian parenting companion</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>7-day free trial</Text>
        </View>
      </LinearGradient>

      <View style={styles.body}>
        {/* Plan Type Selector */}
        <View style={styles.planToggle}>
          <TouchableOpacity
            style={[styles.planToggleBtn, selectedPlan === 'premium' && styles.planToggleBtnActive]}
            onPress={() => setSelectedPlan('premium')}
          >
            <Text style={[styles.planToggleText, selectedPlan === 'premium' && styles.planToggleTextActive]}>
              Premium
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.planToggleBtn, selectedPlan === 'family' && styles.planToggleBtnActive]}
            onPress={() => setSelectedPlan('family')}
          >
            <Text style={[styles.planToggleText, selectedPlan === 'family' && styles.planToggleTextActive]}>
              Family 👨‍👩‍👧
            </Text>
          </TouchableOpacity>
        </View>

        {/* Billing cycle */}
        <View style={styles.billingRow}>
          <TouchableOpacity
            style={[styles.billingBtn, billingTab === 'monthly' && styles.billingBtnActive]}
            onPress={() => setBillingTab('monthly')}
          >
            <Text style={[styles.billingText, billingTab === 'monthly' && styles.billingTextActive]}>
              Monthly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingBtn, billingTab === 'annual' && styles.billingBtnActive]}
            onPress={() => setBillingTab('annual')}
          >
            <Text style={[styles.billingText, billingTab === 'annual' && styles.billingTextActive]}>
              Annual
            </Text>
            <View style={styles.savingsBadge}>
              <Text style={styles.savingsText}>Save {annualSavings}</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Price card */}
        <LinearGradient colors={[Colors.peacock, Colors.peacockDark ?? '#004D4D']} style={styles.priceCard}>
          <Text style={styles.priceAmount}>{priceText}</Text>
          {billingTab === 'annual' && (
            <Text style={styles.priceMonthly}>= {planPrices.annualMonthly} effective</Text>
          )}
          <Text style={styles.priceSub}>
            {billingTab === 'annual' ? 'Ek baar saal mein' : 'Har mahine'} · Kabhi bhi cancel karo
          </Text>
        </LinearGradient>

        {/* Features comparison */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>What's included</Text>

          <View style={styles.featuresHeader}>
            <Text style={[styles.featureCol, { flex: 2 }]}>Feature</Text>
            <Text style={styles.featureCol}>Free</Text>
            <Text style={styles.featureCol}>Premium</Text>
            {selectedPlan === 'family' && <Text style={styles.featureCol}>Family</Text>}
          </View>

          {PLAN_FEATURES.map((feat, i) => (
            <View key={i} style={[styles.featureRow, i % 2 === 0 && styles.featureRowAlt]}>
              <Text style={[styles.featureLabel, { flex: 2 }]}>{feat.icon} {feat.label}</Text>
              <Text style={styles.featureCheck}>
                {feat.free === true ? '✅' : feat.free === false ? '—' : feat.free}
              </Text>
              <Text style={styles.featureCheck}>{feat.premium ? '✅' : '—'}</Text>
              {selectedPlan === 'family' && (
                <Text style={styles.featureCheck}>{feat.family ? '✅' : '—'}</Text>
              )}
            </View>
          ))}
        </View>

        {/* CTA Button */}
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={handlePurchase}
          disabled={purchasing || loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={[Colors.primary, Colors.accent]} style={styles.ctaGradient}>
            {purchasing ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.ctaText}>
                  Start {selectedPlan === 'family' ? 'Family' : 'Premium'} Plan
                </Text>
                <Text style={styles.ctaSub}>7-day free trial · No credit card required</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Restore */}
        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>Restore Previous Purchase</Text>
        </TouchableOpacity>

        {/* Trust badges */}
        <View style={styles.trustRow}>
          {['🔒 Secure Payment', '↩️ Easy Cancel', '📱 All Platforms'].map((badge) => (
            <View key={badge} style={styles.trustBadge}>
              <Text style={styles.trustText}>{badge}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.legalText}>
          Payment will be charged to your {Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.
          Subscription auto-renews unless cancelled at least 24 hours before the end of the current period.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  hero: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 48, marginBottom: 12 },
  heroTitle: { ...Typography.h1, color: 'white', fontWeight: '800', textAlign: 'center' },
  heroSub: { ...Typography.body, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 8 },
  heroBadge: {
    marginTop: 12, backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16, paddingVertical: 5, borderRadius: 20,
  },
  heroBadgeText: { color: '#fff', fontWeight: '700', fontSize: 13 },

  body: { padding: Spacing.lg },

  planToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    padding: 4,
    marginBottom: Spacing.md,
    ...Shadows.sm,
  },
  planToggleBtn: { flex: 1, paddingVertical: 10, borderRadius: Radius.full, alignItems: 'center' },
  planToggleBtnActive: { backgroundColor: Colors.primary },
  planToggleText: { ...Typography.body, fontWeight: '600', color: Colors.textSecondary },
  planToggleTextActive: { color: 'white' },

  billingRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  billingBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    backgroundColor: Colors.surface,
    position: 'relative',
  },
  billingBtnActive: { borderColor: Colors.secondary, backgroundColor: '#EEF2FF' },
  billingText: { ...Typography.body, fontWeight: '600', color: Colors.textSecondary },
  billingTextActive: { color: Colors.secondary },
  savingsBadge: {
    position: 'absolute',
    top: -10,
    right: 8,
    backgroundColor: Colors.accent,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  savingsText: { fontSize: 10, fontWeight: '700', color: 'white' },

  priceCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    alignItems: 'center',
    marginBottom: Spacing.lg,
    ...Shadows.md,
  },
  priceAmount: { fontSize: 32, fontWeight: '800', color: 'white' },
  priceMonthly: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '600' },
  priceSub: { ...Typography.small, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  featuresSection: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  featuresTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.md },
  featuresHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 4,
  },
  featureCol: { flex: 1, ...Typography.caption, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' },
  featureRow: { flexDirection: 'row', paddingVertical: 8, alignItems: 'center' },
  featureRowAlt: { backgroundColor: '#FAFAFA', borderRadius: Radius.sm },
  featureLabel: { ...Typography.small, color: Colors.text },
  featureCheck: { flex: 1, textAlign: 'center', fontSize: 14 },

  ctaButton: { borderRadius: Radius.xl, overflow: 'hidden', marginBottom: Spacing.md, ...Shadows.lg },
  ctaGradient: { padding: Spacing.lg, alignItems: 'center' },
  ctaText: { ...Typography.h3, color: 'white', fontWeight: '800' },
  ctaSub: { ...Typography.small, color: 'rgba(255,255,255,0.85)', marginTop: 4 },

  restoreBtn: { alignItems: 'center', paddingVertical: Spacing.sm, marginBottom: Spacing.md },
  restoreText: { ...Typography.body, color: Colors.secondary, fontWeight: '600' },

  trustRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Spacing.md, gap: 4 },
  trustBadge: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    paddingVertical: 8,
    alignItems: 'center',
    ...Shadows.sm,
  },
  trustText: { ...Typography.caption, color: Colors.textSecondary },

  legalText: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'center', marginBottom: Spacing.xxl },
});
