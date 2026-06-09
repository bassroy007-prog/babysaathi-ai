import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@theme/index';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  required?: boolean;
}

const Input = forwardRef<TextInput, InputProps>(({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  required,
  style,
  ...props
}, ref) => {
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={[
        styles.inputRow,
        focused && styles.inputRowFocused,
        error ? styles.inputRowError : null,
      ]}>
        {leftIcon && <Text style={styles.icon}>{leftIcon}</Text>}

        <TextInput
          ref={ref}
          style={[styles.input, leftIcon && styles.inputWithLeft, rightIcon && styles.inputWithRight, style]}
          placeholderTextColor={Colors.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIconBtn}>
            <Text style={styles.icon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
      </View>

      {error ? (
        <Text style={styles.error}>⚠️ {error}</Text>
      ) : hint ? (
        <Text style={styles.hint}>{hint}</Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  container: { marginBottom: Spacing.md },
  label: { ...Typography.small, fontWeight: '600', color: Colors.text, marginBottom: 6 },
  required: { color: Colors.primary },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    minHeight: 50,
  },
  inputRowFocused: { borderColor: Colors.primary },
  inputRowError: { borderColor: Colors.error ?? '#EF4444' },

  icon: { fontSize: 18, marginHorizontal: 4 },
  rightIconBtn: { padding: 4 },

  input: { flex: 1, ...Typography.body, color: Colors.text, paddingVertical: 12 },
  inputWithLeft: { marginLeft: 8 },
  inputWithRight: { marginRight: 8 },

  error: { ...Typography.caption, color: Colors.error ?? '#EF4444', marginTop: 4 },
  hint: { ...Typography.caption, color: Colors.textSecondary, marginTop: 4 },
});
