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
import { registerWithEmail } from '@services/firebase/auth';
import { useToast } from '@components/common/Toast';
import { Validators } from '@utils/validation';

// Password strength: 0-4
function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', Colors.error, Colors.warning, '#4CAF50', Colors.success];

export default function RegisterScreen() {
  const navigation = useNavigation<any>();
  const { t } = useTranslation();
  const toast = useToast();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  const pwStrength = passwordStrength(password);

  const validateAll = () => {
    const n = Validators.name(name) ?? '';
    const e = (Validators.required(email, 'Email') ?? Validators.email(email)) ?? '';
    const p = (Validators.required(password, 'Password') ?? Validators.minLength(password, 6, 'Password')) ?? '';
    const c = (Validators.required(confirmPassword, 'Confirm password') ?? Validators.passwordMatch(password, confirmPassword)) ?? '';
    setNameError(n); setEmailError(e); setPasswordError(p); setConfirmError(c);
    return !n && !e && !p && !c;
  };

  const handleRegister = async () => {
    if (!validateAll()) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setLoading(true);
    try {
      await registerWithEmail(email.trim().toLowerCase(), password, name.trim());
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      toast.error(mapFirebaseError(e.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
              </TouchableOpacity>
              <View style={styles.logoRow}>
                <Text style={styles.logoEmoji}>👶</Text>
                <Text style={styles.logoText}>BabySaathi</Text>
              </View>
            </View>

            <Text style={styles.title}>{t('auth.register')}</Text>
            <Text style={styles.subtitle}>Start your parenting journey</Text>

            <View style={styles.form}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.name')}</Text>
                <View style={[styles.inputWrapper, nameError ? styles.inputError : null]}>
                  <Ionicons name="person-outline" size={20} color={nameError ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={(v) => { setName(v); if (nameError) setNameError(''); }}
                    onBlur={() => setNameError(Validators.name(name) ?? '')}
                    placeholder="Your name"
                    placeholderTextColor={Colors.textDisabled}
                    autoCapitalize="words"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => emailRef.current?.focus()}
                  />
                </View>
                {nameError ? <Text style={styles.fieldError}>⚠️ {nameError}</Text> : null}
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.email')}</Text>
                <View style={[styles.inputWrapper, emailError ? styles.inputError : null]}>
                  <Ionicons name="mail-outline" size={20} color={emailError ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    ref={emailRef}
                    style={styles.input}
                    value={email}
                    onChangeText={(v) => { setEmail(v); if (emailError) setEmailError(''); }}
                    onBlur={() => setEmailError((Validators.required(email, 'Email') ?? Validators.email(email)) ?? '')}
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
                    placeholder="Min 6 characters"
                    placeholderTextColor={Colors.textDisabled}
                    secureTextEntry={!showPw}
                    returnKeyType="next"
                    onSubmitEditing={() => confirmRef.current?.focus()}
                  />
                  <TouchableOpacity onPress={() => setShowPw(!showPw)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <Ionicons name={showPw ? 'eye-outline' : 'eye-off-outline'} size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {/* Password strength bar */}
                {password.length > 0 && (
                  <View style={styles.strengthRow}>
                    {[1, 2, 3, 4].map((i) => (
                      <View key={i} style={[styles.strengthSegment, { backgroundColor: i <= pwStrength ? STRENGTH_COLORS[pwStrength] : Colors.border }]} />
                    ))}
                    <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[pwStrength] }]}>
                      {STRENGTH_LABELS[pwStrength]}
                    </Text>
                  </View>
                )}
                {passwordError ? <Text style={styles.fieldError}>⚠️ {passwordError}</Text> : null}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>{t('auth.confirmPassword')}</Text>
                <View style={[styles.inputWrapper, confirmError ? styles.inputError : null]}>
                  <Ionicons name="lock-closed-outline" size={20} color={confirmError ? Colors.error : Colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    ref={confirmRef}
                    style={[styles.input, { flex: 1 }]}
                    value={confirmPassword}
                    onChangeText={(v) => { setConfirmPassword(v); if (confirmError) setConfirmError(''); }}
                    placeholder="Repeat password"
                    placeholderTextColor={Colors.textDisabled}
                    secureTextEntry={!showPw}
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                  />
                  {confirmPassword.length > 0 && (
                    <Ionicons
                      name={password === confirmPassword ? 'checkmark-circle' : 'close-circle'}
                      size={20}
                      color={password === confirmPassword ? Colors.success : Colors.error}
                    />
                  )}
                </View>
                {confirmError ? <Text style={styles.fieldError}>⚠️ {confirmError}</Text> : null}
              </View>

              <TouchableOpacity
                style={[styles.registerBtn, loading && { opacity: 0.7 }]}
                onPress={handleRegister}
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
                    <Text style={styles.btnText}>{t('auth.signUp')}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>{t('auth.haveAccount')} </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>{t('auth.signIn')}</Text>
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
    case 'auth/email-already-in-use': return 'An account with this email already exists.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/weak-password': return 'Please choose a stronger password (min 6 characters).';
    case 'auth/network-request-failed': return 'Network error. Check your connection.';
    default: return 'Registration failed. Please try again.';
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
  fieldError: { fontSize: 12, color: Colors.error, marginTop: 2 },
  inputIcon: { marginRight: Spacing.sm },
  input: { flex: 1, fontSize: Typography.base, color: Colors.textPrimary },
  strengthRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  strengthSegment: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '600', marginLeft: 4, minWidth: 40 },
  registerBtn: { borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.sm },
  btnGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: Spacing.xl },
  loginText: { fontSize: Typography.base, color: Colors.textSecondary },
  loginLink: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
});
