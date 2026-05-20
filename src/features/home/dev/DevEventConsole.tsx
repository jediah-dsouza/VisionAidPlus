/**
 * DevEventConsole - Event Log Panel
 *
 * DEV ONLY - NOT INCLUDED IN PRODUCTION
 *
 * Displays:
 * - Timestamp
 * - Event name
 * - Middleware result
 * - Reducer update
 * - UI render confirmation
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import type { SimulationEvent } from './DevSimulationEngine';

interface DevEventConsoleProps {
  events: SimulationEvent[];
  onClear?: () => void;
  maxHeight?: number;
}

const getStatusColor = (
  status: 'pending' | 'success' | 'failed' | 'skipped' | undefined,
): string => {
  switch (status) {
    case 'success':
      return semanticTokens.colors.success.default;
    case 'failed':
      return semanticTokens.colors.danger.default;
    case 'skipped':
      return semanticTokens.colors.warning.default;
    case 'pending':
    default:
      return semanticTokens.colors.neutral[500];
  }
};

const formatTimestamp = (date: Date): string => {
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

const EventRow: React.FC<{ event: SimulationEvent }> = ({ event }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={styles.eventRow}
      onPress={() => setExpanded(!expanded)}
      accessibilityRole="button"
      accessibilityLabel={`Event ${event.eventName} at ${formatTimestamp(event.timestamp)}`}>
      <View style={styles.eventHeader}>
        <Text style={styles.timestamp}>{formatTimestamp(event.timestamp)}</Text>
        <Text style={styles.eventName} numberOfLines={1}>
          {event.eventName}
        </Text>
        <View style={styles.statusIndicators}>
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor(event.eventBusPublish) }]}
            accessibilityLabel={`EventBus: ${event.eventBusPublish}`}
          />
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(event.middlewareProcessed) },
            ]}
            accessibilityLabel={`Middleware: ${event.middlewareProcessed}`}
          />
          <View
            style={[styles.statusDot, { backgroundColor: getStatusColor(event.reduxUpdated) }]}
            accessibilityLabel={`Redux: ${event.reduxUpdated}`}
          />
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: event.uiRendered
                  ? semanticTokens.colors.success.default
                  : semanticTokens.colors.neutral[500],
              },
            ]}
            accessibilityLabel={`UI: ${event.uiRendered ? 'rendered' : 'pending'}`}
          />
        </View>
      </View>

      {expanded && (
        <View style={styles.eventDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>EventBus:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(event.eventBusPublish) }]}>
              {event.eventBusPublish.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Middleware:</Text>
            <Text
              style={[styles.detailValue, { color: getStatusColor(event.middlewareProcessed) }]}>
              {event.middlewareProcessed.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Redux:</Text>
            <Text style={[styles.detailValue, { color: getStatusColor(event.reduxUpdated) }]}>
              {event.reduxUpdated.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Accessibility:</Text>
            <Text
              style={[styles.detailValue, { color: getStatusColor(event.accessibilityAnnounced) }]}>
              {event.accessibilityAnnounced.toUpperCase()}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>UI Rendered:</Text>
            <Text
              style={[
                styles.detailValue,
                {
                  color: event.uiRendered
                    ? semanticTokens.colors.success.default
                    : semanticTokens.colors.neutral[500],
                },
              ]}>
              {event.uiRendered ? 'YES' : 'NO'}
            </Text>
          </View>
          {event.payload && (
            <View style={styles.payloadContainer}>
              <Text style={styles.detailLabel}>Payload:</Text>
              <Text style={styles.payloadText}>{JSON.stringify(event.payload, null, 2)}</Text>
            </View>
          )}
        </View>
      )}
    </Pressable>
  );
};

export const DevEventConsole: React.FC<DevEventConsoleProps> = ({
  events,
  onClear,
  maxHeight = 300,
}) => {
  const [autoScroll, setAutoScroll] = useState(true);

  const handleClear = useCallback(() => {
    onClear?.();
  }, [onClear]);

  return (
    <View style={[styles.container, { maxHeight }]}>
      <View style={styles.header}>
        <Text style={styles.title}>📋 Event Console</Text>
        <View style={styles.headerActions}>
          <Pressable
            style={[styles.headerButton, autoScroll && styles.headerButtonActive]}
            onPress={() => setAutoScroll(!autoScroll)}
            accessibilityRole="button"
            accessibilityLabel={autoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}>
            <Text style={[styles.headerButtonText, autoScroll && styles.headerButtonTextActive]}>
              Auto-scroll
            </Text>
          </Pressable>
          <Pressable
            style={styles.headerButton}
            onPress={handleClear}
            accessibilityRole="button"
            accessibilityLabel="Clear event log">
            <Text style={styles.headerButtonText}>Clear</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.eventList}
        contentContainerStyle={styles.eventListContent}
        showsVerticalScrollIndicator={true}
        accessibilityLabel={`Event log with ${events.length} events`}>
        {events.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No events logged yet</Text>
            <Text style={styles.emptyHint}>Simulate events using buttons above</Text>
          </View>
        ) : (
          events.map(event => <EventRow key={event.id} event={event} />)
        )}
      </ScrollView>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: semanticTokens.colors.neutral[500] }]}
          />
          <Text style={styles.legendText}>Pending</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: semanticTokens.colors.success.default }]}
          />
          <Text style={styles.legendText}>Success</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: semanticTokens.colors.danger.default }]}
          />
          <Text style={styles.legendText}>Failed</Text>
        </View>
        <View style={styles.legendItem}>
          <View
            style={[styles.legendDot, { backgroundColor: semanticTokens.colors.warning.default }]}
          />
          <Text style={styles.legendText}>Skipped</Text>
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
  headerActions: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  headerButton: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: semanticTokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.default,
  },
  headerButtonActive: {
    backgroundColor: semanticTokens.colors.primary.muted,
  },
  headerButtonText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  headerButtonTextActive: {
    color: semanticTokens.colors.primary.default,
  },
  eventList: {
    flex: 1,
  },
  eventListContent: {
    padding: tokens.spacing[2],
    gap: tokens.spacing[1],
  },
  eventRow: {
    padding: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: semanticTokens.radius.md,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  timestamp: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    fontFamily: 'monospace',
    width: 90,
  },
  eventName: {
    flex: 1,
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  statusIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  eventDetails: {
    marginTop: tokens.spacing[3],
    padding: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.background.muted,
    borderRadius: semanticTokens.radius.sm,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[1],
  },
  detailLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  detailValue: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
  payloadContainer: {
    marginTop: tokens.spacing[2],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.muted,
    paddingTop: tokens.spacing[2],
  },
  payloadText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    fontFamily: 'monospace',
    marginTop: tokens.spacing[1],
  },
  emptyState: {
    padding: tokens.spacing[6],
    alignItems: 'center',
  },
  emptyText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
  },
  emptyHint: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.subtle,
    marginTop: tokens.spacing[1],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[1],
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
});
