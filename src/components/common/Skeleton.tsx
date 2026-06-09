import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.bone,
        { width: width as any, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.card, style]}>
      <View style={styles.row}>
        <Skeleton width={44} height={44} borderRadius={22} />
        <View style={styles.textGroup}>
          <Skeleton width="60%" height={14} />
          <Skeleton width="40%" height={11} style={{ marginTop: 6 }} />
        </View>
      </View>
      <Skeleton height={12} style={{ marginTop: 12 }} />
      <Skeleton width="80%" height={12} style={{ marginTop: 6 }} />
    </View>
  );
}

export function SkeletonListItem({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.listItem, style]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.textGroup}>
        <Skeleton width="55%" height={13} />
        <Skeleton width="35%" height={10} style={{ marginTop: 5 }} />
      </View>
      <Skeleton width={50} height={13} borderRadius={6} />
    </View>
  );
}

export function SkeletonStatGrid() {
  return (
    <View style={styles.statGrid}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.statCard}>
          <Skeleton width={32} height={32} borderRadius={16} />
          <Skeleton width="70%" height={18} style={{ marginTop: 8 }} />
          <Skeleton width="50%" height={11} style={{ marginTop: 5 }} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  bone: { backgroundColor: '#E0E0E0' },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  textGroup: { flex: 1, gap: 4 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: 'white',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 14,
    alignItems: 'flex-start',
  },
});
