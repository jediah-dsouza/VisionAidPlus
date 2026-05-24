import React, { memo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { VoiceLifecycleState } from '@core/voice-assistant/types';

interface VoiceStatusIndicatorProps {
  lifecycle: VoiceLifecycleState;
  isMuted: boolean;
  queueDepth: number;
}

const STATUS_LABELS: Record<VoiceLifecycleState, string> = {
  idle: 'Ready',
  preparing: 'Preparing...',
  queued: 'Queued',
  speaking: 'Speaking',
  paused: 'Paused',
  interrupted: 'Interrupted',
  completed: 'Complete',
  failed: 'Failed',
  cancelled: 'Cancelled',
};

const STATUS_COLORS: Record<VoiceLifecycleState, string> = {
  idle: '#6B7280',
  preparing: '#F59E0B',
  queued: '#3B82F6',
  speaking: '#10B981',
  paused: '#F59E0B',
  interrupted: '#EF4444',
  completed: '#10B981',
  failed: '#EF4444',
  cancelled: '#6B7280',
};

const VoiceStatusIndicator: React.FC<VoiceStatusIndicatorProps> = memo(({
  lifecycle,
  isMuted,
  queueDepth,
}) => {
  const color = STATUS_COLORS[lifecycle];
  const label = STATUS_LABELS[lifecycle];

  return (
    <View style={styles.container} accessibilityLabel={`Voice status: ${label}`}>
      <View style={[styles.dot, { backgroundColor: isMuted ? '#EF4444' : color }]} />
      <Text style={[styles.label, { color: isMuted ? '#EF4444' : color }]}>
        {isMuted ? 'Muted' : label}
      </Text>
      {queueDepth > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{queueDepth}</Text>
        </View>
      )}
    </View>
  );
});

VoiceStatusIndicator.displayName = 'VoiceStatusIndicator';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
  badge: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});

export { VoiceStatusIndicator };
