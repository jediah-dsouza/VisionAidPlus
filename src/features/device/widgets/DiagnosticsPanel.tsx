import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Card } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface DiagnosticsPanelProps {
  totalPacketsReceived: number;
  totalPacketsParsed: number;
  totalParseErrors: number;
  averageParseTimeMs: number;
  totalReconnections: number;
  totalDisconnections: number;
  uptimeFormatted: string;
  lastPacketAt: number | null;
  hasActivity: boolean;
}

export const DiagnosticsPanel: React.FC<DiagnosticsPanelProps> = ({
  totalPacketsReceived,
  totalPacketsParsed,
  totalParseErrors,
  averageParseTimeMs,
  totalReconnections,
  totalDisconnections,
  uptimeFormatted,
  lastPacketAt,
  hasActivity,
}) => {
  const [expanded, setExpanded] = useState(false);
  const errorRate =
    totalPacketsReceived > 0 ? ((totalParseErrors / totalPacketsReceived) * 100).toFixed(1) : '0.0';

  return (
    <Card variant="default" padding="md">
      <Pressable
        onPress={() => setExpanded(prev => !prev)}
        accessibilityRole="button"
        accessibilityLabel={`Diagnostics. ${expanded ? 'Tap to collapse' : 'Tap to expand'}`}>
        <View style={styles.header}>
          <Text style={styles.title}>Diagnostics</Text>
          <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
        </View>
      </Pressable>

      {expanded && (
        <View style={styles.content} accessibilityLabel="Device diagnostics data">
          <View style={styles.summaryRow}>
            <StatBlock label="Packets" value={totalPacketsReceived.toString()} />
            <StatBlock label="Parsed" value={totalPacketsParsed.toString()} />
            <StatBlock
              label="Errors"
              value={totalParseErrors.toString()}
              color={totalParseErrors > 0 ? semanticTokens.colors.danger.default : undefined}
            />
            <StatBlock label="Err Rate" value={`${errorRate}%`} />
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <StatBlock label="Reconnects" value={totalReconnections.toString()} />
            <StatBlock label="Disconnects" value={totalDisconnections.toString()} />
            <StatBlock label="Avg Parse" value={`${averageParseTimeMs.toFixed(1)}ms`} />
            <StatBlock label="Uptime" value={uptimeFormatted} />
          </View>
          <View style={styles.divider} />
          <Text style={styles.lastPacket}>
            {lastPacketAt
              ? `Last packet: ${new Date(lastPacketAt).toLocaleTimeString()}`
              : 'No packets received'}
          </Text>
        </View>
      )}

      {!expanded && hasActivity && (
        <Text style={styles.miniSummary}>
          {totalPacketsReceived} packets, {totalParseErrors} errors
        </Text>
      )}
    </Card>
  );
};

const StatBlock: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <View style={styles.statBlock}>
    <Text style={[styles.statValue, color ? { color } : undefined]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
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
  expandIcon: {
    fontSize: 12,
    color: semanticTokens.colors.foreground.muted,
  },
  content: {
    marginTop: tokens.spacing[3],
    gap: tokens.spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBlock: {
    alignItems: 'center',
    minWidth: 60,
  },
  statValue: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  statLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: semanticTokens.colors.border.muted,
  },
  lastPacket: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
  },
  miniSummary: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    marginTop: tokens.spacing[2],
  },
});
