import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Typography, Spacing, Radius, Shadows } from '@theme/index';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  haptic?: boolean;
}

export default function Button({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
  haptic = true,
}: ButtonProps) {
  const handlePress = async () => {
    if (haptic) {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        disabled={isDisabled}
        activeOpacity={0.85}
        style={[fullWidth && styles.fullWidth, style]}
      >
        <LinearGradient
          colors={isDisabled ? ['#ccc', '#bbb'] : [Colors.primary, Colors.primaryDark ?? Colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles[`size_${size}`], styles.shadow]}
        >
          {loading ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <Text style={[styles.text, styles[`text_${size}`], styles.textWhite, textStyle]}>
              {icon ? `${icon} ` : ''}{label}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        styles[`size_${size}`],
        styles[`variant_${variant}`],
        isDisabled && styles.disabled,
        fullWidth && styles.fullWidth,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'ghost' ? Colors.primary : 'white'}
          size="small"
        />
      ) : (
        <Text
          style={[
            styles.text,
            styles[`text_${size}`],
            variant === 'outline' || variant === 'ghost'
              ? styles.textPrimary
              : variant === 'danger'
              ? styles.textWhite
              : styles.textWhite,
            isDisabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {icon ? `${icon} ` : ''}{label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  fullWidth: { alignSelf: 'stretch' },
  shadow: Shadows.md as any,
  disabled: { opacity: 0.5 },

  size_sm: { paddingVertical: 8, paddingHorizontal: Spacing.md },
  size_md: { paddingVertical: 14, paddingHorizontal: Spacing.xl },
  size_lg: { paddingVertical: 18, paddingHorizontal: Spacing.xxl },

  variant_secondary: { backgroundColor: Colors.secondary },
  variant_outline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: Colors.primary },
  variant_ghost: { backgroundColor: 'transparent' },
  variant_danger: { backgroundColor: Colors.error ?? '#EF4444' },

  text: { fontWeight: '700' },
  text_sm: { fontSize: 13 },
  text_md: { fontSize: 15 },
  text_lg: { fontSize: 17 },

  textWhite: { color: 'white' },
  textPrimary: { color: Colors.primary },
  textDisabled: { color: '#aaa' },
});
