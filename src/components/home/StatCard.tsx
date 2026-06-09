import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';

interface Props {
  emoji: string;
  value: string | number;
  label: string;
  color: string;
  onPress?: () => void;
}

export default function StatCard({ emoji, value, label, color, onPress }: Props) {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();
  }, []);

  const card = (
    <Animated.View style={[styles.card, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.wrapper}>
        {card}
      </TouchableOpacity>
    );
  }

  return <View style={styles.wrapper}>{card}</View>;
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'],
    padding: Spacing.md,
    alignItems: 'center',
    gap: 6,
    ...Shadows.sm,
  },
  iconBg: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 2,
  },
  emoji: { fontSize: 22 },
  value: { fontSize: Typography.xl, fontWeight: '800' },
  label: { fontSize: Typography.xs, color: Colors.textSecondary, textAlign: 'center' },
});
