import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { RangoliColors } from '@theme/index';

interface Props {
  style?: ViewStyle;
  dotSize?: number;
  gap?: number;
}

export default function RangoliBorder({ style, dotSize = 7, gap = 5 }: Props) {
  return (
    <View style={[styles.strip, { gap }, style]}>
      {RangoliColors.map((color, i) => (
        <View
          key={i}
          style={[
            styles.diamond,
            {
              width: dotSize,
              height: dotSize,
              backgroundColor: color,
              // slight size variation for organic feel
              opacity: i % 3 === 0 ? 1 : i % 3 === 1 ? 0.8 : 0.6,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    overflow: 'hidden',
  },
  diamond: {
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
});
