import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GuidanceInstruction } from '@core/live-navigation/types';

interface InstructionBannerProps {
  instruction: GuidanceInstruction | null;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  normal: '#2563EB',
};

const InstructionBanner: React.FC<InstructionBannerProps> = memo(({ instruction }) => {
  if (!instruction) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No active guidance</Text>
      </View>
    );
  }

  const color = PRIORITY_COLORS[instruction.priority] ?? '#6B7280';

  return (
    <View
      style={[styles.container, { borderLeftColor: color }]}
      accessibilityLabel={`Guidance: ${instruction.text}`}
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
    >
      <Text
        style={[styles.text, { color }]}
        numberOfLines={2}
      >
        {instruction.text}
      </Text>
      {instruction.distanceCm != null && (
        <Text style={styles.distance}>
          {instruction.distanceCm < 100
            ? `${Math.round(instruction.distanceCm)} cm`
            : `${(instruction.distanceCm / 100).toFixed(1)} m`}
        </Text>
      )}
    </View>
  );
});

InstructionBanner.displayName = 'InstructionBanner';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1F2937',
    borderLeftWidth: 4,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    flexShrink: 1,
  },
  distance: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});

export { InstructionBanner };
