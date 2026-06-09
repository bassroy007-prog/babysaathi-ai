import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';

interface Props {
  icon: string;
  label: string;
  description: string;
  color: string;
  onPress: () => void;
  badge?: string | number;
}

export default function TrackerCard({ icon, label, description, color, onPress, badge }: Props) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.iconBg, { backgroundColor: color + '20' }]}>
        <Text style={styles.icon}>{icon}</Text>
      </View>
      {badge != null && (
        <View style={[styles.badge, { backgroundColor: color }]}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={[styles.arrowBg, { backgroundColor: color + '20' }]}>
        <Ionicons name="arrow-forward" size={14} color={color} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1, minWidth: '44%',
    backgroundColor: Colors.surface,
    borderRadius: Radius['2xl'], padding: Spacing.lg,
    ...Shadows.md,
  },
  iconBg: {
    width: 56, height: 56, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  icon: { fontSize: 28 },
  badge: {
    position: 'absolute', top: Spacing.md, right: Spacing.md,
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: Typography.xs, color: '#fff', fontWeight: '800' },
  label: { fontSize: Typography.base, fontWeight: '700', color: Colors.textPrimary },
  description: { fontSize: Typography.xs, color: Colors.textSecondary, marginTop: 4, lineHeight: 16 },
  arrowBg: {
    alignSelf: 'flex-end', width: 28, height: 28,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center',
    marginTop: Spacing.sm,
  },
});
