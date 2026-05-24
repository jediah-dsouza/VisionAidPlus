import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card, Button } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import type { CalibrationStatus } from '../types';

interface CalibrationAccessCardProps {
  status: CalibrationStatus;
  isCalibrating: boolean;
  isConnected: boolean;
  onStartCalibration: () => void;
  onCancelCalibration: () => void;
}

export const CalibrationAccessCard: React.FC<CalibrationAccessCardProps> = ({
  status,
  isCalibrating,
  isConnected,
  onStartCalibration,
  onCancelCalibration,
}) => (
  <Card variant="default" padding="md" accessibilityLabel="Device calibration">
    <View style={styles.header}>
      <Text style={styles.icon}>⚙️</Text>
      <View style={styles.headerText}>
        <Text style={styles.title}>Calibration</Text>
        <Text style={styles.status}>
          {status === 'complete'
            ? '✅ Calibrated'
            : status === 'failed'
              ? '❌ Failed'
              : status === 'in_progress'
                ? 'In progress...'
                : 'Ready'}
        </Text>
      </View>
    </View>
    <Text style={styles.description}>
      {status === 'complete'
        ? 'Your device is calibrated and ready.'
        : 'Calibrate your device sensors for optimal detection accuracy.'}
    </Text>
    <Button
      variant={isCalibrating ? 'danger' : 'primary'}
      size="md"
      fullWidth
      onPress={isCalibrating ? onCancelCalibration : onStartCalibration}
      disabled={!isConnected && !isCalibrating}
      isLoading={isCalibrating}
      accessibilityLabel={isCalibrating ? 'Cancel calibration' : 'Start device calibration'}
      accessibilityState={{ disabled: !isConnected && !isCalibrating }}>
      {isCalibrating ? 'Cancel' : 'Start Calibration'}
    </Button>
  </Card>
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    marginBottom: tokens.spacing[3],
  },
  icon: {
    fontSize: 28,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  status: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  description: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.subtle,
    marginBottom: tokens.spacing[3],
    lineHeight: 20,
  },
});
