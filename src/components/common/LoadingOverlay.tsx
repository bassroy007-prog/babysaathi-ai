import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Typography } from '@theme/index';

interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function LoadingOverlay({ visible, message }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="box-only">
      <BlurView intensity={20} style={styles.blur}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={Colors.primary} />
          {message && <Text style={styles.message}>{message}</Text>}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  blur: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 140,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  message: { ...Typography.body, color: Colors.text, textAlign: 'center' },
});
