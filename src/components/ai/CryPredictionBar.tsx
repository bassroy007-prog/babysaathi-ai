import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

import { Colors, Typography, Spacing, Radius } from '@theme/index';
import { CryType } from '@types/index';

const CRY_TYPE_CONFIG: Record<CryType, { label: string; emoji: string; color: string }> = {
  hunger:      { label: 'Hunger',     emoji: '🍼', color: Colors.feedColor },
  sleep:       { label: 'Sleepy',     emoji: '😴', color: Colors.sleepColor },
  discomfort:  { label: 'Discomfort', emoji: '😣', color: Colors.warning },
  pain:        { label: 'Pain',       emoji: '😢', color: Colors.error },
  unknown:     { label: 'Unknown',    emoji: '❓', color: Colors.textSecondary },
};

interface Props {
  cryType: CryType;
  confidence: number;
  compact?: boolean;
}

export default function CryPredictionBar({ cryType, confidence, compact = false }: Props) {
  const config = CRY_TYPE_CONFIG[cryType];
  const animWidth = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animWidth, {
      toValue: confidence,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [confidence]);

  const widthInterpolated = animWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (compact) {
    return (
      <View style={styles.compact}>
        <Text style={styles.compactEmoji}>{config.emoji}</Text>
        <View style={styles.compactBar}>
          <Animated.View style={[styles.compactFill, { width: widthInterpolated, backgroundColor: config.color }]} />
        </View>
        <Text style={[styles.compactLabel, { color: config.color }]}>{Math.round(confidence * 100)}%</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.iconBg, { backgroundColor: config.color + '20' }]}>
          <Text style={styles.emoji}>{config.emoji}</Text>
        </View>
        <View style={styles.labelGroup}>
          <Text style={styles.label}>{config.label}</Text>
          <Text style={[styles.confidence, { color: config.color }]}>
            {Math.round(confidence * 100)}% confidence
          </Text>
        </View>
      </View>
      <View style={styles.bar}>
        <Animated.View style={[styles.fill, { width: widthInterpolated, backgroundColor: config.color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: Spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBg: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 20 },
  labelGroup: { flex: 1 },
  label: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  confidence: { fontSize: Typography.sm, fontWeight: '600', marginTop: 2 },
  bar: { height: 10, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: Radius.full },
  compact: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  compactEmoji: { fontSize: 16, width: 22, textAlign: 'center' },
  compactBar: { flex: 1, height: 6, backgroundColor: Colors.border, borderRadius: Radius.full, overflow: 'hidden' },
  compactFill: { height: '100%', borderRadius: Radius.full },
  compactLabel: { fontSize: Typography.xs, fontWeight: '700', minWidth: 32, textAlign: 'right' },
});
