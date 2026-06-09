import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, StatusBar, Switch, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { getFunctions, httpsCallable } from 'firebase/functions';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { useToast } from '@components/common/Toast';
import { logout } from '@services/firebase/auth';
import { SUPPORTED_LANGUAGES, APP_VERSION } from '@constants/index';
import i18n from '@i18n/index';
import { generateDoctorReport, DoctorReportData } from '@services/pdf/reportGenerator';

export default function ProfileScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const toast = useToast();
  const { user, setOnboardingComplete } = useAuthStore();
  const { babies, activeBaby, setActiveBaby } = useBabyStore();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);

  const handleDoctorReport = async () => {
    if (!activeBaby) {
      toast.error('Please add a baby profile first.');
      return;
    }
    setGeneratingReport(true);
    try {
      const functions = getFunctions();
      const getReport = httpsCallable(functions, 'generateDoctorReport');
      const result = await getReport({ babyId: activeBaby.id });
      const data = result.data as DoctorReportData;
      await generateDoctorReport(data);
    } catch (error: any) {
      toast.error(error?.message ?? 'Could not generate the report. Please try again.');
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await logout();
        useAuthStore.getState().logout();
      }},
    ]);
  };

  const changeLanguage = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const settingsItems = [
    { icon: 'notifications-outline', label: t('profile.notifications'), hasSwitch: true, switchValue: notificationsEnabled, onSwitch: setNotificationsEnabled },
    { icon: 'moon-outline', label: t('profile.darkMode'), hasSwitch: true, switchValue: isDarkMode, onSwitch: setIsDarkMode },
    { icon: 'document-text-outline', label: t('profile.doctorReport'), color: Colors.secondary, onPress: handleDoctorReport },
    { icon: 'shield-outline', label: t('profile.privacyPolicy'), onPress: () => {} },
    { icon: 'document-outline', label: t('profile.termsOfService'), onPress: () => {} },
    { icon: 'help-circle-outline', label: t('profile.helpSupport'), onPress: () => {} },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={['#FF6B8A', '#FF8E53']} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarEmoji}>
                {user?.role === 'grandparent' ? '👴' : '👨‍👩‍👧'}
              </Text>
            </View>
            <Text style={styles.userName}>{user?.displayName ?? 'Parent'}</Text>
            <Text style={styles.userEmail}>{user?.email ?? user?.phoneNumber ?? ''}</Text>
            <View style={styles.subscriptionBadge}>
              <Text style={styles.subscriptionText}>
                {user?.subscriptionTier === 'premium' ? '⭐ Premium' : user?.subscriptionTier === 'premium_family' ? '👨‍👩‍👧 Family' : '🆓 Free'}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Upgrade Banner */}
        {user?.subscriptionTier === 'free' && (
          <TouchableOpacity style={styles.upgradeBanner} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.secondary, '#8B6BFF']} style={styles.upgradeBannerGradient}>
              <View style={styles.upgradeBannerContent}>
                <Text style={styles.upgradeEmoji}>⭐</Text>
                <View>
                  <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
                  <Text style={styles.upgradeDesc}>AI insights, predictions & more</Text>
                </View>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* My Babies */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('profile.babies')}</Text>
            <TouchableOpacity onPress={() => setOnboardingComplete(false)}>
              <Text style={styles.seeAll}>{t('profile.addBaby')}</Text>
            </TouchableOpacity>
          </View>
          {babies.map((baby) => (
            <TouchableOpacity
              key={baby.id}
              style={[styles.babyItem, activeBaby?.id === baby.id && styles.babyItemActive]}
              onPress={() => setActiveBaby(baby)}
            >
              <Text style={styles.babyItemEmoji}>{baby.gender === 'male' ? '👦' : '👧'}</Text>
              <View style={styles.babyItemInfo}>
                <Text style={styles.babyItemName}>{baby.name}</Text>
                <Text style={styles.babyItemAge}>{format(baby.birthDate, 'dd MMM yyyy')}</Text>
              </View>
              {activeBaby?.id === baby.id && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>Active</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.language')}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.languageRow}>
              {SUPPORTED_LANGUAGES.map((lang) => (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langBtn, i18n.language === lang.code && styles.langBtnActive]}
                  onPress={() => changeLanguage(lang.code)}
                >
                  <Text style={[styles.langText, i18n.language === lang.code && styles.langTextActive]}>
                    {lang.nativeName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Family Sharing */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.family')}</Text>
          <TouchableOpacity style={styles.settingsItem}>
            <View style={[styles.settingsIcon, { backgroundColor: Colors.secondary + '20' }]}>
              <Ionicons name="people-outline" size={20} color={Colors.secondary} />
            </View>
            <Text style={styles.settingsLabel}>{t('profile.inviteFamily')}</Text>
            <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('profile.settings')}</Text>
          {settingsItems.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.settingsItem}
              onPress={item.onPress}
              disabled={item.hasSwitch}
            >
              <View style={[styles.settingsIcon, { backgroundColor: (item.color ?? Colors.primary) + '20' }]}>
                <Ionicons name={item.icon as any} size={20} color={item.color ?? Colors.primary} />
              </View>
              <Text style={styles.settingsLabel}>{item.label}</Text>
              {item.hasSwitch ? (
                <Switch
                  value={item.switchValue}
                  onValueChange={item.onSwitch}
                  trackColor={{ false: Colors.border, true: Colors.primary + '80' }}
                  thumbColor={item.switchValue ? Colors.primary : Colors.textDisabled}
                />
              ) : (
                <Ionicons name="chevron-forward" size={18} color={Colors.textSecondary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>

        <Text style={styles.version}>{t('profile.version', { version: APP_VERSION })}</Text>
        <View style={{ height: Spacing['3xl'] }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: { paddingBottom: Spacing['2xl'] },
  headerContent: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, alignItems: 'center', gap: Spacing.sm },
  avatarContainer: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 44 },
  userName: { fontSize: Typography.xl, fontWeight: '800', color: '#fff' },
  userEmail: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)' },
  subscriptionBadge: {
    paddingHorizontal: Spacing.md, paddingVertical: 4,
    backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: Radius.full,
  },
  subscriptionText: { fontSize: Typography.sm, color: '#fff', fontWeight: '600' },
  scroll: { padding: Spacing.xl, gap: Spacing.xl },
  upgradeBanner: { borderRadius: Radius['2xl'], overflow: 'hidden', ...Shadows.md },
  upgradeBannerGradient: { padding: Spacing.md },
  upgradeBannerContent: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  upgradeEmoji: { fontSize: 28 },
  upgradeTitle: { fontSize: Typography.base, fontWeight: '800', color: '#fff' },
  upgradeDesc: { fontSize: Typography.sm, color: 'rgba(255,255,255,0.85)' },
  section: { gap: Spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: Typography.lg, fontWeight: '800', color: Colors.textPrimary },
  seeAll: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  babyItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1.5, borderColor: 'transparent', ...Shadows.sm,
  },
  babyItemActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '10' },
  babyItemEmoji: { fontSize: 32 },
  babyItemInfo: { flex: 1 },
  babyItemName: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  babyItemAge: { fontSize: Typography.sm, color: Colors.textSecondary, marginTop: 2 },
  activeBadge: { paddingHorizontal: Spacing.sm, paddingVertical: 4, backgroundColor: Colors.primary + '20', borderRadius: Radius.full },
  activeBadgeText: { fontSize: Typography.xs, color: Colors.primary, fontWeight: '700' },
  languageRow: { flexDirection: 'row', gap: Spacing.sm },
  langBtn: {
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: Radius.full, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  langBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '20' },
  langText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '600' },
  langTextActive: { color: Colors.primary },
  settingsItem: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: Radius.xl, padding: Spacing.md, ...Shadows.sm,
  },
  settingsIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  settingsLabel: { flex: 1, fontSize: Typography.base, fontWeight: '600', color: Colors.textPrimary },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.sm,
    backgroundColor: Colors.error + '15', borderRadius: Radius.xl, padding: Spacing.md,
    borderWidth: 1.5, borderColor: Colors.error + '30',
  },
  logoutText: { fontSize: Typography.base, fontWeight: '700', color: Colors.error },
  version: { fontSize: Typography.sm, color: Colors.textDisabled, textAlign: 'center' },
});
