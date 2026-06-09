import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';
import { AIInsight } from '@types/index';

const INSIGHT_TYPE_CONFIG = {
  feeding:    { emoji: '🍼', color: Colors.feedColor,    gradientEnd: Colors.feedColor + '15' },
  sleep:      { emoji: '😴', color: Colors.sleepColor,   gradientEnd: Colors.sleepColor + '15' },
  growth:     { emoji: '📏', color: Colors.growthColor,  gradientEnd: Colors.growthColor + '15' },
  milestone:  { emoji: '⭐', color: Colors.accent,       gradientEnd: Colors.accent + '15' },
  general:    { emoji: '💡', color: Colors.primary,      gradientEnd: Colors.primary + '15' },
} as const;

interface Props {
  insight: AIInsight;
  onDismiss?: (id: string) => void;
}

export default function InsightCard({ insight, onDismiss }: Props) {
  const config = INSIGHT_TYPE_CONFIG[insight.type] ?? INSIGHT_TYPE_CONFIG.general;

  return (
    <View style={[styles.card, Shadows.sm]}>
      <LinearGradient
        colors={[config.color + '18', config.gradientEnd]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <View style={[styles.iconBg, { backgroundColor: config.color + '25' }]}>
            <Text style={styles.emoji}>{config.emoji}</Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.type, { color: config.color }]}>
              {insight.type.charAt(0).toUpperCase() + insight.type.slice(1)} Insight
            </Text>
            {insight.priority === 'high' && (
              <View style={styles.priorityBadge}>
                <Text style={styles.priorityText}>Important</Text>
              </View>
            )}
          </View>
          {onDismiss && (
            <TouchableOpacity
              onPress={() => onDismiss(insight.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.dismiss}>✕</Text>
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.message}>{insight.message}</Text>

        {insight.recommendation && (
          <View style={[styles.rec, { backgroundColor: config.color + '12' }]}>
            <Text style={styles.recLabel}>Tip</Text>
            <Text style={styles.recText}>{insight.recommendation}</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: Radius['2xl'], overflow: 'hidden' },
  gradient: { padding: Spacing.lg, gap: Spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  iconBg: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emoji: { fontSize: 22 },
  meta: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap' },
  type: { fontSize: Typography.sm, fontWeight: '700' },
  priorityBadge: {
    paddingHorizontal: 8, paddingVertical: 2,
    backgroundColor: Colors.error + '20', borderRadius: Radius.full,
  },
  priorityText: { fontSize: Typography.xs, color: Colors.error, fontWeight: '700' },
  dismiss: { fontSize: 16, color: Colors.textSecondary, fontWeight: '600' },
  message: { fontSize: Typography.base, color: Colors.textPrimary, lineHeight: 22 },
  rec: { borderRadius: Radius.lg, padding: Spacing.md, gap: 4 },
  recLabel: { fontSize: Typography.xs, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  recText: { fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
});
