import React, { useEffect, useRef, useImperativeHandle, forwardRef, useCallback } from 'react';
import { View, Animated, Dimensions, StyleSheet } from 'react-native';
import { RangoliColors } from '@theme/index';

const { width: W, height: H } = Dimensions.get('window');
const PARTICLE_COUNT = 60;

interface Particle {
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  opacity: Animated.Value;
  color: string;
  size: number;
  shape: 'circle' | 'rect';
}

export interface ConfettiHandle {
  burst: () => void;
}

function createParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: new Animated.Value(Math.random() * W),
    y: new Animated.Value(-20),
    rot: new Animated.Value(0),
    opacity: new Animated.Value(1),
    color: RangoliColors[i % RangoliColors.length],
    size: 6 + Math.random() * 8,
    shape: Math.random() > 0.5 ? 'circle' : 'rect',
  }));
}

const ConfettiOverlay = forwardRef<ConfettiHandle>((_, ref) => {
  const particles = useRef<Particle[]>(createParticles());
  const visible = useRef(new Animated.Value(0)).current;

  const burst = useCallback(() => {
    // Reset positions
    particles.current.forEach((p) => {
      p.x.setValue(Math.random() * W);
      p.y.setValue(-20 - Math.random() * 100);
      p.rot.setValue(0);
      p.opacity.setValue(1);
    });

    visible.setValue(1);

    const animations = particles.current.map((p) => {
      const duration = 1800 + Math.random() * 1200;
      const delay = Math.random() * 400;
      return Animated.parallel([
        Animated.timing(p.y, {
          toValue: H + 40,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.x, {
          toValue: p.x._value + (Math.random() - 0.5) * 200,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(p.rot, {
          toValue: (Math.random() > 0.5 ? 1 : -1) * 4 * Math.PI,
          duration,
          delay,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(delay + duration * 0.7),
          Animated.timing(p.opacity, {
            toValue: 0,
            duration: duration * 0.3,
            useNativeDriver: true,
          }),
        ]),
      ]);
    });

    Animated.parallel(animations).start(() => {
      visible.setValue(0);
    });
  }, []);

  useImperativeHandle(ref, () => ({ burst }), [burst]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity: visible }]}
    >
      {particles.current.map((p, i) => (
        <Animated.View
          key={i}
          style={[
            styles.particle,
            p.shape === 'circle' ? { borderRadius: p.size / 2 } : { borderRadius: 2 },
            {
              width: p.size,
              height: p.size,
              backgroundColor: p.color,
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: p.rot.interpolate({ inputRange: [-Math.PI * 4, Math.PI * 4], outputRange: ['-720deg', '720deg'] }) },
              ],
              opacity: p.opacity,
            },
          ]}
        />
      ))}
    </Animated.View>
  );
});

ConfettiOverlay.displayName = 'ConfettiOverlay';
export default ConfettiOverlay;

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  particle: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
