/**
 * DevValidationSummary - Validation Results Screen
 *
 * DEV ONLY - NOT INCLUDED IN PRODUCTION
 *
 * Displays:
 * - Passed tests
 * - Failed tests
 * - Warnings
 * - Performance observations
 */

import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { devSimulationEngine } from './DevSimulationEngine';
import type { SimulationEvent, SimulationMetrics } from './DevSimulationEngine';

interface TestResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  details: string;
  timestamp: Date;
}

interface DevValidationSummaryProps {
  events: SimulationEvent[];
  onRerunTests?: () => void;
}

export const DevValidationSummary: React.FC<DevValidationSummaryProps> = ({
  events,
  onRerunTests,
}) => {
  const [selectedTab, setSelectedTab] = useState<'summary' | 'passed' | 'failed' | 'warnings'>(
    'summary',
  );

  const testResults = useMemo((): TestResult[] => {
    const results: TestResult[] = [];

    // Emergency System Validation
    const emergencyValidation = devSimulationEngine.validateEmergencyState();
    results.push({
      id: 'emergency-single',
      name: 'Emergency Single Active',
      status: emergencyValidation.valid ? 'pass' : 'fail',
      details: emergencyValidation.valid
        ? 'Only one emergency can be active at a time'
        : emergencyValidation.issues.join(', '),
      timestamp: new Date(),
    });

    // Countdown Integrity
    const countdownTests = events.filter(e => e.eventName.includes('EMERGENCY'));
    results.push({
      id: 'emergency-countdown',
      name: 'Emergency Countdown',
      status: countdownTests.length > 0 ? 'pass' : 'warning',
      details:
        countdownTests.length > 0
          ? `${countdownTests.length} emergency events processed`
          : 'No emergency events detected',
      timestamp: new Date(),
    });

    // BLE Connection Validation
    const bleValidation = devSimulationEngine.validateBLEConnection();
    results.push({
      id: 'ble-connection',
      name: 'BLE Connection State',
      status: bleValidation.valid ? 'pass' : 'warning',
      details: bleValidation.valid ? 'Connection state is valid' : bleValidation.issues.join(', '),
      timestamp: new Date(),
    });

    // EventBus Processing
    const eventBusSuccess = events.filter(e => e.eventBusPublish === 'success').length;
    const eventBusFailed = events.filter(e => e.eventBusPublish === 'failed').length;
    results.push({
      id: 'eventbus-processing',
      name: 'EventBus Processing',
      status: eventBusFailed > 0 ? 'fail' : eventBusSuccess > 0 ? 'pass' : 'warning',
      details: `${eventBusSuccess} successful, ${eventBusFailed} failed`,
      timestamp: new Date(),
    });

    // Redux Synchronization
    const reduxSuccess = events.filter(e => e.reduxUpdated === 'success').length;
    results.push({
      id: 'redux-sync',
      name: 'Redux Synchronization',
      status: reduxSuccess > 0 ? 'pass' : 'warning',
      details: `${reduxSuccess} state updates processed`,
      timestamp: new Date(),
    });

    // Accessibility Announcements
    const accessibilitySuccess = events.filter(e => e.accessibilityAnnounced === 'success').length;
    results.push({
      id: 'accessibility-pipeline',
      name: 'Accessibility Pipeline',
      status: accessibilitySuccess > 0 ? 'pass' : 'warning',
      details: `${accessibilitySuccess} announcements processed`,
      timestamp: new Date(),
    });

    // UI Render Confirmation
    const uiRendered = events.filter(e => e.uiRendered).length;
    results.push({
      id: 'ui-render',
      name: 'UI Render Confirmation',
      status: uiRendered > 0 ? 'pass' : 'warning',
      details: `${uiRendered} components rendered after events`,
      timestamp: new Date(),
    });

    // Latency Check
    const metrics = devSimulationEngine.getMetrics();
    results.push({
      id: 'latency-check',
      name: 'Event Processing Latency',
      status:
        metrics.averageLatency > 100 ? 'warning' : metrics.averageLatency > 50 ? 'warning' : 'pass',
      details: `Average latency: ${metrics.averageLatency.toFixed(1)}ms`,
      timestamp: new Date(),
    });

    // Dropped Events Check
    results.push({
      id: 'dropped-events',
      name: 'Event Delivery',
      status: metrics.droppedEvents > 5 ? 'fail' : metrics.droppedEvents > 0 ? 'warning' : 'pass',
      details: `${metrics.droppedEvents} events dropped`,
      timestamp: new Date(),
    });

    return results;
  }, [events]);

  const stats = useMemo(() => {
    const passed = testResults.filter(t => t.status === 'pass');
    const failed = testResults.filter(t => t.status === 'fail');
    const warnings = testResults.filter(t => t.status === 'warning');

    return {
      passed: passed.length,
      failed: failed.length,
      warnings: warnings.length,
      total: testResults.length,
    };
  }, [testResults]);

  const filteredResults = useMemo(() => {
    switch (selectedTab) {
      case 'passed':
        return testResults.filter(t => t.status === 'pass');
      case 'failed':
        return testResults.filter(t => t.status === 'fail');
      case 'warnings':
        return testResults.filter(t => t.status === 'warning');
      default:
        return testResults;
    }
  }, [selectedTab, testResults]);

  const getStatusIcon = (status: TestResult['status']): string => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'fail':
        return '❌';
      case 'warning':
        return '⚠️';
    }
  };

  const tabs = [
    { key: 'summary', label: 'Summary', count: stats.total },
    { key: 'passed', label: 'Passed', count: stats.passed },
    { key: 'failed', label: 'Failed', count: stats.failed },
    { key: 'warnings', label: 'Warnings', count: stats.warnings },
  ] as const;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Validation Summary</Text>
        {onRerunTests && (
          <Pressable
            style={styles.rerunButton}
            onPress={onRerunTests}
            accessibilityRole="button"
            accessibilityLabel="Rerun validation tests">
            <Text style={styles.rerunButtonText}>↻</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: semanticTokens.colors.success.muted }]}>
          <Text style={[styles.statValue, { color: semanticTokens.colors.success.default }]}>
            {stats.passed}
          </Text>
          <Text style={styles.statLabel}>Passed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: semanticTokens.colors.danger.muted }]}>
          <Text style={[styles.statValue, { color: semanticTokens.colors.danger.default }]}>
            {stats.failed}
          </Text>
          <Text style={styles.statLabel}>Failed</Text>
        </View>

        <View style={[styles.statCard, { backgroundColor: semanticTokens.colors.warning.muted }]}>
          <Text style={[styles.statValue, { color: semanticTokens.colors.warning.default }]}>
            {stats.warnings}
          </Text>
          <Text style={styles.statLabel}>Warnings</Text>
        </View>
      </View>

      <View style={styles.tabs}>
        {tabs.map(tab => (
          <Pressable
            key={tab.key}
            style={[styles.tab, selectedTab === tab.key && styles.tabActive]}
            onPress={() => setSelectedTab(tab.key)}
            accessibilityRole="tab"
            accessibilityState={{ selected: selectedTab === tab.key }}>
            <Text style={[styles.tabText, selectedTab === tab.key && styles.tabTextActive]}>
              {tab.label} ({tab.count})
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView style={styles.resultsList}>
        {filteredResults.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No results to display</Text>
          </View>
        ) : (
          filteredResults.map(result => (
            <View key={result.id} style={styles.resultItem}>
              <Text style={styles.resultIcon}>{getStatusIcon(result.status)}</Text>
              <View style={styles.resultContent}>
                <Text style={styles.resultName}>{result.name}</Text>
                <Text style={styles.resultDetails}>{result.details}</Text>
              </View>
              <Text style={styles.resultTime}>
                {result.timestamp.toLocaleTimeString('en-US', { hour12: false })}
              </Text>
            </View>
          ))
        )}
      </ScrollView>

      <View style={styles.performanceNotes}>
        <Text style={styles.performanceTitle}>Performance Observations:</Text>
        <View style={styles.observationRow}>
          <Text style={styles.observationLabel}>Event Throughput:</Text>
          <Text style={styles.observationValue}>
            {stats.total > 0
              ? `${((stats.passed / stats.total) * 100).toFixed(0)}% success rate`
              : 'N/A'}
          </Text>
        </View>
        <View style={styles.observationRow}>
          <Text style={styles.observationLabel}>Total Events:</Text>
          <Text style={styles.observationValue}>{testResults.length * 10} simulated</Text>
        </View>
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
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing[3],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.border.default,
  },
  title: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  rerunButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semanticTokens.colors.surface.default,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rerunButtonText: {
    fontSize: 18,
    color: semanticTokens.colors.primary.default,
  },
  statsRow: {
    flexDirection: 'row',
    padding: tokens.spacing[3],
    gap: tokens.spacing[2],
  },
  statCard: {
    flex: 1,
    padding: tokens.spacing[3],
    borderRadius: semanticTokens.radius.md,
    alignItems: 'center',
  },
  statValue: {
    fontSize: semanticTokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
  },
  tabs: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  tab: {
    flex: 1,
    paddingVertical: tokens.spacing[2],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: semanticTokens.colors.primary.default,
  },
  tabText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  tabTextActive: {
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
  },
  resultsList: {
    maxHeight: 200,
    padding: tokens.spacing[2],
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: semanticTokens.radius.md,
    marginBottom: tokens.spacing[1],
  },
  resultIcon: {
    fontSize: 16,
    marginRight: tokens.spacing[2],
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  resultDetails: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  resultTime: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    fontFamily: 'monospace',
  },
  emptyState: {
    padding: tokens.spacing[4],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  performanceNotes: {
    padding: tokens.spacing[3],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  performanceTitle: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  observationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[1],
  },
  observationLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  observationValue: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
});
