import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  SafeAreaView, StatusBar, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, Radius } from '@theme/index';

export default function OTPVerifyScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const phoneNumber = route.params?.phoneNumber || '';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<TextInput[]>([]);

  const handleOtpChange = (val: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = val;
    setOtp(newOtp);
    if (val && index < 5) inputRefs.current[index + 1]?.focus();
    if (!val && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length !== 6) return;
    setLoading(true);
    // OTP verification logic here
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </TouchableOpacity>

          <View style={styles.iconContainer}>
            <Text style={styles.iconEmoji}>📱</Text>
          </View>

          <Text style={styles.title}>Verify OTP</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to{'\n'}
            <Text style={styles.phone}>{phoneNumber}</Text>
          </Text>

          <View style={styles.otpRow}>
            {otp.map((digit, i) => (
              <TextInput
                key={i}
                ref={(r) => { if (r) inputRefs.current[i] = r; }}
                style={[styles.otpInput, digit && styles.otpFilled]}
                value={digit}
                onChangeText={(v) => handleOtpChange(v.slice(-1), i)}
                keyboardType="numeric"
                maxLength={1}
                textAlign="center"
                selectTextOnFocus
              />
            ))}
          </View>

          <TouchableOpacity
            style={[styles.verifyBtn, otp.join('').length !== 6 && { opacity: 0.5 }]}
            onPress={handleVerify}
            disabled={otp.join('').length !== 6 || loading}
          >
            <LinearGradient
              colors={[Colors.primary, Colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.verifyGradient}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify & Continue</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.resendBtn}>
            <Text style={styles.resendText}>Didn't receive OTP? </Text>
            <Text style={styles.resendLink}>Resend</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  backBtn: { padding: Spacing.sm, alignSelf: 'flex-start', marginBottom: Spacing['2xl'] },
  iconContainer: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: Colors.primaryLight + '40',
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'center', marginBottom: Spacing.xl,
  },
  iconEmoji: { fontSize: 40 },
  title: { fontSize: Typography['2xl'], fontWeight: '800', color: Colors.textPrimary, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { fontSize: Typography.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing['2xl'] },
  phone: { color: Colors.primary, fontWeight: '700' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.sm, marginBottom: Spacing['2xl'] },
  otpInput: {
    width: 48, height: 56, borderRadius: Radius.lg,
    borderWidth: 2, borderColor: Colors.border,
    backgroundColor: Colors.surface, fontSize: Typography.xl, fontWeight: '700', color: Colors.textPrimary,
  },
  otpFilled: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight + '20' },
  verifyBtn: { borderRadius: Radius.xl, overflow: 'hidden' },
  verifyGradient: { height: 54, alignItems: 'center', justifyContent: 'center' },
  verifyText: { fontSize: Typography.md, fontWeight: '700', color: '#fff' },
  resendBtn: { flexDirection: 'row', justifyContent: 'center', marginTop: Spacing.xl },
  resendText: { fontSize: Typography.base, color: Colors.textSecondary },
  resendLink: { fontSize: Typography.base, fontWeight: '700', color: Colors.primary },
});
