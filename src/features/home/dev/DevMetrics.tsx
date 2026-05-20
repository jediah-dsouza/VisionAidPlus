/**
 * DevMetrics - Realtime Metrics Display
 *
 * DEV ONLY - NOT INCLUDED IN PRODUCTION
 *
 * Displays:
 * - Render count
 * - Event processing latency
 * - Dropped events
 * - Active listeners
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { devSimulationEngine } from './DevSimulationEngine';
import type { SimulationMetrics } from './DevSimulationEngine';

interface DevMetricsProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

export const DevMetrics: React.FC<DevMetricsProps> = ({
  autoRefresh = true,
  refreshInterval = 1000,
}) => {
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalEvents: 0,
    droppedEvents: 0,
    averageLatency: 0,
    activeListeners: 0,
    renderCount: 0,
    lastEventTime: null,
  });

  useEffect(() => {
    if (!autoRefresh) return;

    const intervalId = setInterval(() => {
      setMetrics(devSimulationEngine.getMetrics());
    }, refreshInterval);

    return () => clearInterval(intervalId);
  }, [autoRefresh, refreshInterval]);

  const formatLatency = (latency: number): string => {
    if (latency === 0) return '--';
    return `${latency.toFixed(1)}ms`;
  };

  const formatTime = (date: Date | null): string => {
    if (!date) return '--:--:--';
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getHealthStatus = (): 'good' | 'warning' | 'critical' => {
    if (metrics.droppedEvents > 10 || metrics.averageLatency > 100) return 'critical';
    if (metrics.droppedEvents > 5 || metrics.averageLatency > 50) return 'warning';
    return 'good';
  };

  const healthStatus = getHealthStatus();
  const healthColors = {
    good: semanticTokens.colors.success.default,
    warning: semanticTokens.colors.warning.default,
    critical: semanticTokens.colors.danger.default,
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📊 Realtime Metrics</Text>
        <View style={[styles.healthBadge, { backgroundColor: `${healthColors[healthStatus]}20` }]}>
          <View style={[styles.healthDot, { backgroundColor: healthColors[healthStatus] }]} />
          <Text style={[styles.healthText, { color: healthColors[healthStatus] }]}>
            {healthStatus.toUpperCase()}
          </Text>
        </View>
      </View>

      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <Text style={styles.metricValue}>{metrics.totalEvents}</Text>
          <Text style={styles.metricLabel}>Total Events</Text>
        </View>

        <View style={styles.metricCard}>
          <Text
            style={[
              styles.metricValue,
              {
                color:
                  metrics.droppedEvents > 0
                    ? semanticTokens.colors.warning.default
                    : semanticTokens.colors.foreground.default,
              },
            ]}>
            {metrics.droppedEvents}
          </Text>
          <Text style={styles.metricLabel}>Dropped</Text>
        </View>

        <View style={styles.metricCard}>
          <Text style={[styles.metricValue, { color: healthColors[healthStatus] }]}>
            {formatLatency(metrics.averageLatency)}
          </Text>
          <Text style={styles.metricLabel}>Avg Latency</Text>
        </View>
      </View>

      <View style={styles.secondaryMetrics}>
        <View style={styles.secondaryRow}>
          <Text style={styles.secondaryLabel}>Active Listeners</Text>
          <Text style={styles.secondaryValue}>{metrics.activeListeners}</Text>
        </View>

        <View style={styles.secondaryRow}>
          <Text style={styles.secondaryLabel}>Render Count</Text>
          <Text style={styles.secondaryValue}>{metrics.renderCount}</Text>
        </View>

        <View style={styles.secondaryRow}>
          <Text style={styles.secondaryLabel}>Last Event</Text>
          <Text style={styles.secondaryValue}>{formatTime(metrics.lastEventTime)}</Text>
        </View>
      </View>

      <View style={styles.performanceBars}>
        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Latency</Text>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.min(metrics.averageLatency, 200)}%`,
                  backgroundColor: healthColors[healthStatus],
                },
              ]}
            />
            <View style={[styles.barThreshold, { left: '50%' }]} />
          </View>
          <Text style={styles.barValue}>{formatLatency(metrics.averageLatency)}</Text>
        </View>

        <View style={styles.performanceRow}>
          <Text style={styles.performanceLabel}>Drop Rate</Text>
          <View style={styles.barContainer}>
            <View
              style={[
                styles.bar,
                {
                  width: `${Math.min((metrics.droppedEvents / metrics.totalEvents) * 100, 100)}%`,
                  backgroundColor:
                    metrics.droppedEvents > 0
                      ? semanticTokens.colors.warning.default
                      : semanticTokens.colors.success.default,
                },
              ]}
            />
          </View>
          <Text style={styles.barValue}>
            {metrics.totalEvents > 0
              ? `${((metrics.droppedEvents / metrics.totalEvents) * 100).toFixed(1)}%`
              : '0%'}
          </Text>
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
  healthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.md,
    gap: tokens.spacing[1],
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  healthText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  metricCard: {
    flex: 1,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: semanticTokens.radius.md,
    padding: tokens.spacing[3],
    alignItems: 'center',
  },
  metricValue: {
    fontSize: semanticTokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  metricLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[1],
    textAlign: 'center',
  },
  secondaryMetrics: {
    gap: tokens.spacing[2],
  },
  secondaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: tokens.spacing[1],
  },
  secondaryLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  secondaryValue: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
    fontFamily: 'monospace',
  },
  performanceBars: {
    gap: tokens.spacing[3],
  },
  performanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  performanceLabel: {
    width: 70,
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  barContainer: {
    flex: 1,
    height: 8,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: 4,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 4,
  },
  barThreshold: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: semanticTokens.colors.warning.default,
  },
  barValue: {
    width: 50,
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'right',
  },
});
