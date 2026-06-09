import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, Radius } from '@theme/index';

interface Props {
  emoji: string;
  label: string;
  color: string;
  onPress: () => void;
  disabled?: boolean;
}

export default function QuickLogButton({ emoji, label, color, onPress, disabled }: Props) {
  return (
    <TouchableOpacity
      style={[styles.wrapper, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={[color + '28', color + '0C']}
        style={styles.gradient}
      >
        <Text style={styles.emoji}>{emoji}</Text>
        <Text style={[styles.label, { color }]}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, borderRadius: Radius.xl, overflow: 'hidden', minWidth: '20%' },
  disabled: { opacity: 0.5 },
  gradient: {
    paddingVertical: Spacing.md, paddingHorizontal: Spacing.sm,
    alignItems: 'center', gap: 4,
  },
  emoji: { fontSize: 24 },
  label: { fontSize: Typography.xs, fontWeight: '700', textAlign: 'center' },
});
