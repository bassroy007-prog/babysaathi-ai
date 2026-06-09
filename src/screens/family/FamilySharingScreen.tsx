import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useTranslation } from 'react-i18next';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { useAuthStore } from '@store/authStore';
import { useBabyStore } from '@store/babyStore';
import { UserRole } from '@types/index';

const ROLES: Array<{ id: UserRole; label: string; icon: string; desc: string }> = [
  { id: 'parent', label: 'Parent', icon: '👨‍👩‍👧', desc: 'Full access to all features' },
  { id: 'caregiver', label: 'Caregiver', icon: '👩‍⚕️', desc: 'Log feeds, sleep, diapers' },
  { id: 'grandparent', label: 'Grandparent', icon: '👴', desc: 'View-only access' },
  { id: 'doctor', label: 'Doctor', icon: '🩺', desc: 'View reports and health data' },
];

export default function FamilySharingScreen() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const { activeBaby } = useBabyStore();

  const [email, setEmail] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('parent');
  const [loading, setLoading] = useState(false);

  const handleInvite = async () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (!activeBaby) {
      Alert.alert('No Baby', 'Please select a baby first.');
      return;
    }

    setLoading(true);
    try {
      const functions = getFunctions();
      const sendInvite = httpsCallable(functions, 'sendFamilyInvite');
      await sendInvite({
        email: email.trim().toLowerCase(),
        babyId: activeBaby.id,
        role: selectedRole,
        permission: selectedRole === 'doctor' || selectedRole === 'grandparent' ? 'view' : 'edit',
      });

      Alert.alert(
        'Invitation Sent! 🎉',
        `An invitation has been sent to ${email}. They will receive an email to join ${activeBaby.name}'s care team.`,
        [{ text: 'Great!', onPress: () => setEmail('') }]
      );
    } catch (error: any) {
      Alert.alert('Failed to Send', error?.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <LinearGradient colors={['#FF6B8A', '#FF8E53']} style={styles.header}>
        <Text style={styles.headerTitle}>Family Sharing</Text>
        <Text style={styles.headerSub}>Invite family & caregivers to{'\n'}help track {activeBaby?.name ?? 'your baby'}</Text>
      </LinearGradient>

      <View style={styles.body}>
        {/* How it works */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>👨‍👩‍👧 How Family Sharing Works</Text>
          <Text style={styles.infoText}>
            Invite up to 5 family members or caregivers. Each person gets their own account
            with role-based access to baby data. Changes sync in real-time for everyone.
          </Text>
        </View>

        {/* Role selector */}
        <Text style={styles.sectionTitle}>Choose their role</Text>
        {ROLES.map((role) => (
          <TouchableOpacity
            key={role.id}
            style={[styles.roleCard, selectedRole === role.id && styles.roleCardActive]}
            onPress={() => setSelectedRole(role.id)}
          >
            <Text style={styles.roleIcon}>{role.icon}</Text>
            <View style={styles.roleInfo}>
              <Text style={[styles.roleLabel, selectedRole === role.id && styles.roleLabelActive]}>
                {role.label}
              </Text>
              <Text style={styles.roleDesc}>{role.desc}</Text>
            </View>
            {selectedRole === role.id && <Text style={styles.roleCheck}>✅</Text>}
          </TouchableOpacity>
        ))}

        {/* Email input */}
        <Text style={styles.sectionTitle}>Their email address</Text>
        <View style={styles.emailRow}>
          <TextInput
            style={styles.emailInput}
            value={email}
            onChangeText={setEmail}
            placeholder="name@example.com"
            placeholderTextColor={Colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Send button */}
        <TouchableOpacity
          style={[styles.sendBtn, loading && styles.sendBtnDisabled]}
          onPress={handleInvite}
          disabled={loading}
          activeOpacity={0.85}
        >
          <LinearGradient colors={['#FF6B8A', '#FF8E53']} style={styles.sendGradient}>
            <Text style={styles.sendText}>
              {loading ? 'Sending...' : '📧 Send Invitation'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Premium note */}
        <View style={styles.premiumNote}>
          <Text style={styles.premiumNoteText}>
            👑 Family Sharing requires BabySaathi Family plan. Only 1 family is allowed per account.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  header: { paddingTop: 56, paddingBottom: 28, paddingHorizontal: Spacing.xl },
  headerTitle: { ...Typography.h1, color: 'white', fontWeight: '800' },
  headerSub: { ...Typography.body, color: 'rgba(255,255,255,0.85)', marginTop: 6, lineHeight: 22 },

  body: { padding: Spacing.lg },

  infoCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderLeftWidth: 3,
    borderLeftColor: Colors.secondary,
  },
  infoTitle: { ...Typography.small, fontWeight: '700', color: Colors.secondary, marginBottom: 6 },
  infoText: { ...Typography.small, color: Colors.text, lineHeight: 20 },

  sectionTitle: { ...Typography.h3, color: Colors.text, marginBottom: Spacing.sm, marginTop: Spacing.sm },

  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  roleCardActive: { borderColor: Colors.primary, backgroundColor: '#FFF5F7' },
  roleIcon: { fontSize: 28, marginRight: Spacing.md },
  roleInfo: { flex: 1 },
  roleLabel: { ...Typography.body, fontWeight: '600', color: Colors.text },
  roleLabelActive: { color: Colors.primary },
  roleDesc: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },
  roleCheck: { fontSize: 18 },

  emailRow: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.lg,
    ...Shadows.sm,
  },
  emailInput: {
    ...Typography.body,
    color: Colors.text,
    paddingVertical: 14,
  },

  sendBtn: { borderRadius: Radius.full, overflow: 'hidden', ...Shadows.md },
  sendBtnDisabled: { opacity: 0.6 },
  sendGradient: { paddingVertical: 16, alignItems: 'center' },
  sendText: { ...Typography.h3, color: 'white', fontWeight: '700' },

  premiumNote: {
    backgroundColor: '#FFFBEB',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginTop: Spacing.lg,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  premiumNoteText: { ...Typography.small, color: '#92400E', lineHeight: 18 },
});
