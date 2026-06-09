import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Colors, Typography, Spacing, Radius } from '@theme/index';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <View style={styles.container}>
        <Text style={styles.emoji}>😔</Text>
        <Text style={styles.title}>Something went wrong</Text>
        <Text style={styles.subtitle}>
          An unexpected error occurred. Your data is safe.
        </Text>
        {__DEV__ && this.state.error && (
          <ScrollView style={styles.errorBox}>
            <Text style={styles.errorText}>{this.state.error.message}</Text>
          </ScrollView>
        )}
        <TouchableOpacity style={styles.button} onPress={this.reset}>
          <Text style={styles.buttonText}>Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  emoji: { fontSize: 56, marginBottom: Spacing.md },
  title: { ...Typography.h2, color: Colors.text, textAlign: 'center', marginBottom: Spacing.sm },
  subtitle: { ...Typography.body, color: Colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  errorBox: {
    marginTop: Spacing.md,
    backgroundColor: '#FFF3F3',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    maxHeight: 120,
    width: '100%',
  },
  errorText: { fontSize: 11, color: '#C00', fontFamily: 'monospace' },
  button: {
    marginTop: Spacing.xl,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Spacing.xxl,
    borderRadius: Radius.full,
  },
  buttonText: { ...Typography.body, color: 'white', fontWeight: '700' },
});
