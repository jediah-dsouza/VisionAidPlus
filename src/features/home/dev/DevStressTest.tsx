/**
 * DevStressTest - Stress Test Mode Controller
 *
 * DEV ONLY - NOT INCLUDED IN PRODUCTION
 *
 * Features:
 * - Rapidly emit random events
 * - Validate app stability
 * - Detect duplicate events
 * - Detect memory leaks
 * - Detect navigation race conditions
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { devSimulationEngine } from './DevSimulationEngine';
import type { SimulationMetrics } from './DevSimulationEngine';

interface DevStressTestProps {
  onMetricsUpdate?: (metrics: SimulationMetrics) => void;
}

export const DevStressTest: React.FC<DevStressTestProps> = ({ onMetricsUpdate }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [duration, setDuration] = useState(10000);
  const [results, setResults] = useState<{
    eventsEmitted: number;
    droppedEvents: number;
    averageLatency: number;
    errors: string[];
  } | null>(null);
  const startTimeRef = useRef<number>(0);

  const handleStartStressTest = useCallback(() => {
    setIsRunning(true);
    setResults(null);
    startTimeRef.current = Date.now();

    console.log(`[DevStressTest] Starting stress test for ${duration}ms`);

    devSimulationEngine.startStressTest(duration);

    const intervalId = setInterval(() => {
      const metrics = devSimulationEngine.getMetrics();
      onMetricsUpdate?.(metrics);
    }, 500);

    setTimeout(() => {
      clearInterval(intervalId);
      setIsRunning(false);

      const finalMetrics = devSimulationEngine.getMetrics();
      setResults({
        eventsEmitted: finalMetrics.totalEvents,
        droppedEvents: finalMetrics.droppedEvents,
        averageLatency: finalMetrics.averageLatency,
        errors: [],
      });

      console.log('[DevStressTest] Stress test completed', finalMetrics);
    }, duration + 500);
  }, [duration, onMetricsUpdate]);

  const handleStopStressTest = useCallback(() => {
    devSimulationEngine.stopStressTest();
    setIsRunning(false);
    console.log('[DevStressTest] Stress test manually stopped');
  }, []);

  const handleQuickTest = useCallback(
    (testDuration: number) => {
      setDuration(testDuration);
      setTimeout(() => handleStartStressTest(), 100);
    },
    [handleStartStressTest],
  );

  const durationOptions = [
    { label: '5s', value: 5000 },
    { label: '10s', value: 10000 },
    { label: '30s', value: 30000 },
    { label: '1m', value: 60000 },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🚀 Stress Test Mode</Text>
        {isRunning && (
          <View style={styles.runningIndicator}>
            <View style={styles.pulseDot} />
            <Text style={styles.runningText}>Running...</Text>
          </View>
        )}
      </View>

      <View style={styles.durationSelector}>
        <Text style={styles.sectionLabel}>Duration:</Text>
        <View style={styles.durationOptions}>
          {durationOptions.map(option => (
            <Pressable
              key={option.value}
              style={[
                styles.durationOption,
                duration === option.value && styles.durationOptionActive,
              ]}
              onPress={() => setDuration(option.value)}
              disabled={isRunning}
              accessibilityRole="button"
              accessibilityLabel={`Set duration to ${option.label}`}>
              <Text
                style={[
                  styles.durationOptionText,
                  duration === option.value && styles.durationOptionTextActive,
                ]}>
                {option.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.actions}>
        {isRunning ? (
          <Pressable
            style={[styles.button, styles.stopButton]}
            onPress={handleStopStressTest}
            accessibilityRole="button"
            accessibilityLabel="Stop stress test">
            <Text style={styles.stopButtonText}>■ Stop</Text>
          </Pressable>
        ) : (
          <Pressable
            style={[styles.button, styles.startButton]}
            onPress={handleStartStressTest}
            accessibilityRole="button"
            accessibilityLabel="Start stress test">
            <Text style={styles.startButtonText}>▶ Start Stress Test</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.quickActions}>
        <Text style={styles.sectionLabel}>Quick Tests:</Text>
        <View style={styles.quickButtons}>
          <Pressable
            style={styles.quickButton}
            onPress={() => handleQuickTest(5000)}
            disabled={isRunning}
            accessibilityRole="button"
            accessibilityLabel="Run 5 second stress test">
            <Text style={styles.quickButtonText}>5s</Text>
          </Pressable>
          <Pressable
            style={styles.quickButton}
            onPress={() => handleQuickTest(10000)}
            disabled={isRunning}
            accessibilityRole="button"
            accessibilityLabel="Run 10 second stress test">
            <Text style={styles.quickButtonText}>10s</Text>
          </Pressable>
          <Pressable
            style={styles.quickButton}
            onPress={() => handleQuickTest(15000)}
            disabled={isRunning}
            accessibilityRole="button"
            accessibilityLabel="Run 15 second stress test">
            <Text style={styles.quickButtonText}>15s</Text>
          </Pressable>
        </View>
      </View>

      {results && (
        <View style={styles.results}>
          <Text style={styles.resultsTitle}>Results:</Text>
          <View style={styles.resultsGrid}>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.eventsEmitted}</Text>
              <Text style={styles.resultLabel}>Events</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.droppedEvents}</Text>
              <Text style={styles.resultLabel}>Dropped</Text>
            </View>
            <View style={styles.resultItem}>
              <Text style={styles.resultValue}>{results.averageLatency.toFixed(1)}ms</Text>
              <Text style={styles.resultLabel}>Avg Latency</Text>
            </View>
          </View>
          {results.errors.length > 0 && (
            <View style={styles.errors}>
              <Text style={styles.errorsTitle}>Errors:</Text>
              {results.errors.map((error, index) => (
                <Text key={index} style={styles.errorText}>
                  - {error}
                </Text>
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.info}>
        <Text style={styles.infoText}>
          Stress test rapidly emits random events to validate app stability. Watch the Event Console
          for real-time feedback.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.lg,
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  runningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: semanticTokens.colors.danger.default,
  },
  runningText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.danger.default,
    fontWeight: tokens.fontWeight.medium,
  },
  durationSelector: {
    gap: tokens.spacing[2],
  },
  sectionLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  durationOptions: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  durationOption: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
  },
  durationOptionActive: {
    backgroundColor: semanticTokens.colors.primary.muted,
    borderColor: semanticTokens.colors.primary.default,
  },
  durationOptionText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
  },
  durationOptionTextActive: {
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
  actions: {
    gap: tokens.spacing[2],
  },
  button: {
    padding: tokens.spacing[3],
    borderRadius: semanticTokens.radius.md,
    alignItems: 'center',
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  startButton: {
    backgroundColor: semanticTokens.colors.primary.default,
  },
  startButtonText: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: '#FFFFFF',
  },
  stopButton: {
    backgroundColor: semanticTokens.colors.danger.default,
  },
  stopButtonText: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: '#FFFFFF',
  },
  quickActions: {
    gap: tokens.spacing[2],
  },
  quickButtons: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  quickButton: {
    flex: 1,
    padding: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
    alignItems: 'center',
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  quickButtonText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
    fontWeight: tokens.fontWeight.medium,
  },
  results: {
    padding: tokens.spacing[3],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: semanticTokens.radius.md,
    gap: tokens.spacing[2],
  },
  resultsTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  resultsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  resultItem: {
    alignItems: 'center',
  },
  resultValue: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.primary.default,
  },
  resultLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  errors: {
    marginTop: tokens.spacing[2],
    paddingTop: tokens.spacing[2],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  errorsTitle: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.danger.default,
    marginBottom: tokens.spacing[1],
  },
  errorText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.danger.default,
  },
  info: {
    padding: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.background.muted,
    borderRadius: semanticTokens.radius.md,
  },
  infoText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    textAlign: 'center',
  },
});
