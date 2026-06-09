import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';

interface Props {
  startTime: Date | null;
  idleEmoji: string;
  activeEmoji: string;
  idleTitle: string;
  idleSubtitle: string;
  activeLabel: string;
  startLabel: string;
  stopLabel: string;
  gradientColors: [string, string];
  onStart: () => void;
  onStop: () => void;
}

export default function SessionTimer({
  startTime,
  idleEmoji,
  activeEmoji,
  idleTitle,
  idleSubtitle,
  activeLabel,
  startLabel,
  stopLabel,
  gradientColors,
  onStart,
  onStop,
}: Props) {
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (startTime) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setElapsed(0);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTime]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}h ${m.toString().padStart(2, '0')}m`;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <View style={[styles.card, Shadows.md]}>
      {startTime ? (
        <View style={styles.inner}>
          <View style={[styles.iconBg, { backgroundColor: gradientColors[0] + '20' }]}>
            <Text style={{ fontSize: 48 }}>{activeEmoji}</Text>
          </View>
          <Text style={styles.activeLabel}>{activeLabel}</Text>
          <Text style={[styles.timerDisplay, { color: gradientColors[0] }]}>{formatTime(elapsed)}</Text>
          <TouchableOpacity style={styles.btn} onPress={onStop}>
            <LinearGradient colors={gradientColors} style={styles.btnGradient}>
              <Text style={styles.btnText}>{stopLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.inner}>
          <Text style={{ fontSize: 48, marginBottom: Spacing.md }}>{idleEmoji}</Text>
          <Text style={styles.idleTitle}>{idleTitle}</Text>
          <Text style={styles.idleSubtitle}>{idleSubtitle}</Text>
          <TouchableOpacity style={styles.btn} onPress={onStart}>
            <LinearGradient colors={gradientColors} style={styles.btnGradient}>
              <Text style={styles.btnText}>{startLabel}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: Colors.surface, borderRadius: Radius['2xl'], padding: Spacing.xl, alignItems: 'center' },
  inner: { alignItems: 'center', gap: Spacing.sm, width: '100%' },
  iconBg: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  activeLabel: { fontSize: Typography.base, color: Colors.textSecondary, fontWeight: '600' },
  timerDisplay: { fontSize: 48, fontWeight: '800' },
  idleTitle: { fontSize: Typography.lg, fontWeight: '700', color: Colors.textPrimary },
  idleSubtitle: { fontSize: Typography.base, color: Colors.textSecondary },
  btn: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden', marginTop: Spacing.md },
  btnGradient: { height: 50, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontSize: Typography.base, fontWeight: '700', color: '#fff' },
});
