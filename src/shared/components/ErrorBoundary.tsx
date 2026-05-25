import React, { Component, type ReactNode, type ErrorInfo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { logger } from '@core/debug';
import { errorHandler } from '@core/error/ErrorHandler';
import { accessibilityEngine } from '@core/accessibility';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  name?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    const name = this.props.name ?? 'ErrorBoundary';
    logger.error(`[${name}] Caught error: ${error.message}`);
    errorHandler.handleError(error, { component: name, componentStack: errorInfo.componentStack });
    try {
      accessibilityEngine.announce?.(
        'An error occurred. The application has recovered.',
        'high',
        false,
      );
    } catch {}
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <View style={styles.container}>
          <Text style={styles.icon}>!</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            The application encountered an unexpected issue. Previous functionality has been
            preserved.
          </Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#0F172A',
  },
  icon: {
    fontSize: 48,
    fontWeight: '800',
    color: '#EF4444',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 22,
  },
});
