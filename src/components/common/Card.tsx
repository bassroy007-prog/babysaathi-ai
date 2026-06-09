import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Radius, Shadows, Spacing } from '@theme/index';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'outlined' | 'flat';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, style, variant = 'default', padding = 'md' }: CardProps) {
  return (
    <View style={[styles.base, styles[`variant_${variant}`], styles[`pad_${padding}`], style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.xl,
    backgroundColor: Colors.surface,
  },
  variant_default: { ...Shadows.sm },
  variant_elevated: { ...Shadows.md },
  variant_outlined: { borderWidth: 1, borderColor: Colors.border },
  variant_flat: { backgroundColor: Colors.background },

  pad_none: { padding: 0 },
  pad_sm: { padding: Spacing.sm },
  pad_md: { padding: Spacing.md },
  pad_lg: { padding: Spacing.lg },
});
