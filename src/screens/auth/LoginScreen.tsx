import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, StatusBar, SafeAreaView, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { loginWithEmail, sendOTP, loginWithGoogle } from '@services/firebase/auth';
import { useAuthStore } from '@store/authStore';
import { useToast } from '@components/common/Toast';
import { Validators } from '@utils/validation';

export default function LoginScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'phone'>('email');

  // Field errors
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const passwordRef = useRef<TextInput>(null);

  const validateEmail = () => {
    const e1 = Validators.required(email, 'Email');
    const e2 = e1 ? null : Validators.email(email);
    const error = e1 ?? e2 ?? '';
    setEmailError(error);
    return !error;
  };

  const validatePassword = () => {
    const error = Validators.required(password, 'Password') ?? '';
    setPasswordError(error);
    return !error;
  };

  const validatePhone = () => {
    const error = Validators.required(phone, 'Phone number') ?? Validators.phone(phone) ?? '';
    setPhoneError(error);
    return !error;
  };

  const handleEmailLogin = async () => {
    const valid = validateEmail() & (validatePassword() as any);
    if (!valid) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await loginWithEmail(email.trim().toLowerCase(), password);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      const msg = mapFirebaseError(e.code);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = async () => {
    if (!validatePhone()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      const verificationId = await sendOTP(`+91${phone.trim()}`);
      navigation.navigate('OTPVerify', { phoneNumber: `+91${phone.trim()}`, verificationId });
    } catch (e: any) {
      toast.error('Failed to send OTP. Please check your number.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await loginWithGoogle();
    } catch (e: any) {
      if (e.code !== 'auth/cancelled-popup-request') {
        toast.error('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.logoRow}>
                <Text style={styles.logoEmoji}>👶</Text>
                <Text style={styles.logoText}>BabySaathi</Text>
              </View>
            </View>

            <Text style={styles.title}>{t('auth.login')}</Text>
            <Text style={styles.subtitle}>Welcome back, parent! 🌸</Text>

            {/* Tab selector */}
            <View style={styles.tabBar}>
              {(['email', 'phone'] as const).map((tab) => (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, activeTab === tab && styles.activeTab]}
                  onPress={() => setActiveTab(tab)}
                >
                  <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
                    {tab === 'email' ? '✉️ Email' : '📱 Phone'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {activeTab === 'email' ? (
              <View style={styles.form}>
                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                    <Ionicons name="mail-outline" size={20} color={emailError ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                      onBlur={validateEmail}
                      placeholder="parent@example.com"
                      placeholderTextColor={Colors.textDisabled}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                  </View>
                  {emailError ? <Text style={styles.fieldError}>⚠️ {emailError}</Text> : null}
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.password')}</Text>
                  <View style={[styles.inputWrapper, passwordError ? styles.inputError : null]}>
                    <Ionicons name="lock-closed-outline" size={20} color={passwordError ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      ref={passwordRef}
                      style={[styles.input, { flex: 1 }]}
                      value={password}
                      onChangeText={(v) => { setPassword(v); if (passwordError) setPasswordError(''); }}
                      onBlur={validatePassword}
                      placeholder="••••••••"
                      placeholderTextColor={Colors.textDisabled}
                      secureTextEntry={!showPw}
                      returnKeyType="done"
                      onSubmitEditing={handleEmailLogin}
                    />
                    <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? <Text style={styles.fieldError}>⚠️ {passwordError}</Text> : null}
                </View>

                <TouchableOpacity style={styles.forgotBtn} onPress={() => navigation.navigate('ForgotPassword')}>
                  <Text style={styles.forgotText}>{t('auth.forgotPassword')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                  onPress={handleEmailLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBtnGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>{t('auth.signIn')}</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.phone')}</Text>
                  <View style={[styles.inputWrapper, phoneError ? styles.inputError : null]}>
                    <View style={styles.phonePrefix}>
                      <Text style={styles.phonePrefixText}>🇮🇳 +91</Text>
                    </View>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      value={phone}
                      onChangeText={(v) => { setPhone(v.replace(/\D/g, '')); if (phoneError) setPhoneError(''); }}
                      onBlur={validatePhone}
                      placeholder="9876543210"
                      placeholderTextColor={Colors.textDisabled}
                      keyboardType="phone-pad"
                      maxLength={10}
                      returnKeyType="done"
                      onSubmitEditing={handlePhoneLogin}
                    />
                    {phone.length === 10 && <Ionicons name="checkmark-circle" size={20} color={Colors.success} />}
                  </View>
                  {phoneError ? <Text style={styles.fieldError}>⚠️ {phoneError}</Text> : null}
                </View>
                <TouchableOpacity
                  style={[styles.loginBtn, loading && styles.loginBtnDisabled]}
                  onPress={handlePhoneLogin}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={[Colors.primary, Colors.primaryDark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginBtnGradient}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Send OTP 📱</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or continue with</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login */}
            <View style={styles.socialRow}>
              <TouchableOpacity style={styles.socialBtn} onPress={handleGoogleLogin} disabled={loading}>
                <Text style={styles.socialIcon}>G</Text>
                <Text style={styles.socialText}>Google</Text>
              </TouchableOpacity>
              {Platform.OS === 'ios' && (
                <TouchableOpacity style={styles.socialBtn}>
                  <Ionicons name="logo-apple" size={20} color={Colors.textPrimary} />
                  <Text style={styles.socialText}>Apple</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Register link */}
            <View style={styles.registerRow}>
              <Text style={styles.registerText}>{t('auth.noAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}>{t('auth.signUp')}</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function mapFirebaseError(code: string): string {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/wrong-password': return 'Incorrect password. Please try again.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/too-many-requests': return 'Too many failed attempts. Please wait and try again.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default: return 'Login failed. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.lg, marginBottom: Spacing['2xl'] },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoEmoji: { fontSize: 24 },
  logoText: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  title: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, marginBottom: Spacing.xl },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceVariant,
    borderRadius: Radius.xl,
    padding: 4,
    marginBottom: Spacing.xl,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: Radius.lg },
  activeTab: { backgroundColor: Colors.surface, ...Shadows.sm },
  tabText: { fontSize: Typography.sm, color: Colors.textSecondary, fontWeight: '500' },
  activeTabText: { color: Colors.primary, fontWeight: '700' },
  form: { gap: Spacing.base },
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
  inputError: { borderColor: Colors.error },
  fieldError: { fontSize: 12, color: Colors.error, marginTop: 2 },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  phonePrefix: {
    paddingRight: Spacing.sm,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    marginRight: Spacing.sm,
  },
  phonePrefixText: { fontSize: Typography.sm, color: Colors.textPrimary, fontWeight: '600' },
  forgotBtn: { alignSelf: 'flex-end' },
  forgotText: { fontSize: Typography.sm, color: Colors.primary, fontWeight: '600' },
  loginBtn: { borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.sm },
  loginBtnDisabled: { opacity: 0.7 },
  loginBtnGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  loginBtnText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.xl, gap: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dividerText: { fontSize: Typography.sm, color: Colors.textSecondary },
  socialRow: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.xl },
  socialBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: Spacing.sm, height: 50, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.surface, ...Shadows.sm,
  },
  socialIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  socialText: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerText: { fontSize: Typography.base, color: Colors.textSecondary },
  registerLink: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
});
