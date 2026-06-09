import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { resetPassword } from '@services/firebase/auth';
import { useToast } from '@components/common/Toast';
import { Validators } from '@utils/validation';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleReset = async () => {
    const err = Validators.required(email, 'Email') ?? Validators.email(email);
    if (err) {
      setEmailError(err);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await resetPassword(email.trim().toLowerCase());
      setSent(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(mapError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={styles.inner}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.logoRow}>
                <Text style={styles.logoEmoji}>👶</Text>
                <Text style={styles.logoText}>BabySaathi</Text>
              </View>
            </View>

            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🔑</Text>
            </View>

            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your email and we'll send a link to reset your password.
            </Text>

            {!sent ? (
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t('auth.email')}</Text>
                  <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                    <Ionicons
                      name="mail-outline"
                      size={20}
                      color={emailError ? Colors.error : Colors.textSecondary}
                      style={styles.inputIcon}
                    />
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                      onBlur={() => setEmailError((Validators.required(email, 'Email') ?? Validators.email(email)) ?? '')}
                      placeholder="parent@example.com"
                      placeholderTextColor={Colors.textDisabled}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="done"
                      onSubmitEditing={handleReset}
                    />
                  </View>
                  {emailError ? <Text style={styles.fieldError}>⚠️ {emailError}</Text> : null}
                </View>

                <TouchableOpacity
                  style={[styles.resetBtn, loading && { opacity: 0.7 }]}
                  onPress={handleReset}
                  disabled={loading}
                  activeOpacity={0.85}
                >
                  <LinearGradient
                    colors={[Colors.primary, Colors.primaryDark]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.btnGradient}
                  >
                    {loading ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnText}>Send Reset Link</Text>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.successCard}>
                <Text style={styles.successEmoji}>📧</Text>
                <Text style={styles.successTitle}>Email Sent!</Text>
                <Text style={styles.successText}>
                  Check your inbox at{' '}
                  <Text style={styles.emailHighlight}>{email}</Text>
                  {' '}and follow the link to reset your password.
                </Text>
                <TouchableOpacity
                  onPress={() => { setSent(false); setEmail(''); }}
                  style={styles.resendBtn}
                >
                  <Text style={styles.resendText}>Didn't receive it? Try again</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Remember your password? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

function mapError(code: string): string {
  switch (code) {
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/too-many-requests': return 'Too many attempts. Please wait a moment.';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default: return 'Failed to send reset email. Please try again.';
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  inner: { flex: 1, paddingHorizontal: Spacing.xl, paddingBottom: Spacing['2xl'] },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: Spacing.lg, marginBottom: Spacing['2xl'] },
  backBtn: { padding: Spacing.sm, marginRight: Spacing.md },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  logoEmoji: { fontSize: 24 },
  logoText: { fontSize: Typography.lg, fontWeight: '700', color: Colors.primary },
  iconContainer: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: Colors.primaryLight + '25',
    alignSelf: 'center',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  icon: { fontSize: 44 },
  title: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, lineHeight: 22, marginBottom: Spacing.xl },
  form: { gap: Spacing.base },
  inputGroup: { gap: 6 },
  label: { fontSize: Typography.sm, fontWeight: '600', color: Colors.textPrimary },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.surface, borderRadius: Radius.lg,
    borderWidth: 1.5, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, height: 52, ...Shadows.sm,
  },
  inputError: { borderColor: Colors.error },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  fieldError: { fontSize: 12, color: Colors.error, marginTop: 2 },
  resetBtn: { borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.sm },
  btnGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
  successCard: {
    backgroundColor: Colors.surface, borderRadius: Radius['2xl'],
    padding: Spacing['2xl'], alignItems: 'center', gap: Spacing.md, ...Shadows.md,
  },
  successEmoji: { fontSize: 52 },
  successTitle: { fontSize: Typography.xl, fontWeight: '800', color: Colors.textPrimary },
  successText: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  emailHighlight: { fontWeight: '700', color: Colors.primary },
  resendBtn: { paddingVertical: Spacing.sm },
  resendText: { fontSize: Typography.base, color: Colors.primary, fontWeight: '600' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  loginText: { fontSize: Typography.base, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
});
