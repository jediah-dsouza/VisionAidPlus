import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { devPacketMonitor } from './DevPacketMonitor';
import type { PacketMonitorEntry } from './DevPacketMonitor';

const formatTime = (ts: number): string => {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

const getTypeColor = (entry: PacketMonitorEntry): string => {
  if (entry.parseStatus === 'error') return semanticTokens.colors.danger.default;
  if (entry.payloadType.includes('ERROR') || entry.payloadType.includes('error'))
    return semanticTokens.colors.danger.default;
  if (entry.payloadType.includes('WEAK') || entry.payloadType.includes('LOW_BATTERY'))
    return semanticTokens.colors.warning.default;
  if (entry.payloadType.includes('CONNECTED') || entry.payloadType.includes('FOUND'))
    return semanticTokens.colors.success.default;
  return semanticTokens.colors.foreground.default;
};

const PacketRow: React.FC<{ entry: PacketMonitorEntry }> = ({ entry }) => {
  const [expanded, setExpanded] = useState(false);
  const typeColor = getTypeColor(entry);

  return (
    <Pressable
      style={styles.packetRow}
      onPress={() => setExpanded(!expanded)}
      accessibilityRole="button"
      accessibilityLabel={`Packet ${entry.payloadType} at ${formatTime(entry.timestamp)}`}>
      <View style={styles.packetHeader}>
        <Text style={styles.timestamp}>{formatTime(entry.timestamp)}</Text>
        <Text style={[styles.payloadType, { color: typeColor }]} numberOfLines={1}>
          {entry.payloadType}
        </Text>
        <Text style={styles.parseBadge}>
          {entry.parseStatus === 'success' ? '✓' : '✗'}
        </Text>
      </View>

      {expanded && (
        <View style={styles.packetDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Direction:</Text>
            <Text style={styles.detailValue}>{entry.direction}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Characteristic:</Text>
            <Text style={styles.detailValue}>{entry.characteristicUUID}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Parse Status:</Text>
            <Text style={[styles.detailValue, { color: entry.parseStatus === 'success' ? semanticTokens.colors.success.default : semanticTokens.colors.danger.default }]}>
              {entry.parseStatus}
            </Text>
          </View>
          <View style={styles.payloadContainer}>
            <Text style={styles.detailLabel}>Raw:</Text>
            <Text style={styles.payloadText} selectable>
              {entry.raw}
            </Text>
          </View>
        </View>
      )}
    </Pressable>
  );
};

export const DevPacketMonitorTab: React.FC = () => {
  const [log, setLog] = useState<PacketMonitorEntry[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    devPacketMonitor.initialize();
    intervalRef.current = setInterval(() => {
      setLog(devPacketMonitor.getLog());
    }, 200);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleClear = useCallback(() => {
    devPacketMonitor.clear();
    setLog([]);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📦 BLE Packet Monitor</Text>
        <Pressable
          style={styles.clearButton}
          onPress={handleClear}
          accessibilityRole="button"
          accessibilityLabel="Clear packet log">
          <Text style={styles.clearButtonText}>Clear</Text>
        </Pressable>
      </View>

      <Text style={styles.counterText}>
        Logged: {log.length} packets
      </Text>

      <ScrollView
        style={styles.packetList}
        contentContainerStyle={styles.packetListContent}
        showsVerticalScrollIndicator={true}
        accessibilityLabel={`Packet log with ${log.length} entries`}>
        {log.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No packets captured</Text>
            <Text style={styles.emptyHint}>
              Simulate BLE events to populate the packet log
            </Text>
          </View>
        ) : (
          log.map(entry => <PacketRow key={entry.id} entry={entry} />)
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: tokens.spacing[2],
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
  clearButton: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: semanticTokens.radius.md,
    backgroundColor: semanticTokens.colors.surface.elevated,
  },
  clearButtonText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    fontWeight: tokens.fontWeight.medium,
  },
  counterText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    fontFamily: 'monospace',
  },
  packetList: {
    flex: 1,
  },
  packetListContent: {
    gap: tokens.spacing[1],
    paddingBottom: tokens.spacing[4],
  },
  packetRow: {
    padding: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
  },
  packetHeader: {
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
  payloadType: {
    flex: 1,
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  parseBadge: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  packetDetails: {
    marginTop: tokens.spacing[2],
    padding: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.background.muted,
    borderRadius: semanticTokens.radius.sm,
    gap: tokens.spacing[1],
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
  },
  detailValue: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  payloadContainer: {
    marginTop: tokens.spacing[1],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.muted,
    paddingTop: tokens.spacing[1],
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
});
