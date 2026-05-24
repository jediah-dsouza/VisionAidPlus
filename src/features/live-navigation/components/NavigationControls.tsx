import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { EnvironmentMode } from '@core/live-navigation/types';

interface NavigationControlsProps {
  isNavigating: boolean;
  isPaused: boolean;
  canResume: boolean;
  environment: EnvironmentMode;
  sensitivity: number;
  onStart: () => void;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onEnvironmentChange: (mode: EnvironmentMode) => void;
  onSensitivityChange: (level: number) => void;
}

const ENVIRONMENTS: EnvironmentMode[] = ['indoor', 'outdoor', 'night', 'tunnel'];
const ENV_LABELS: Record<EnvironmentMode, string> = {
  indoor: '🏠 Indoor',
  outdoor: '🌳 Outdoor',
  night: '🌙 Night',
  tunnel: '🚇 Tunnel',
};

const NavigationControls: React.FC<NavigationControlsProps> = memo(({
  isNavigating,
  isPaused,
  environment,
  sensitivity,
  onStart,
  onStop,
  onPause,
  onResume,
  onEnvironmentChange,
  onSensitivityChange,
}) => {
  const increaseSensitivity = useCallback(() => {
    onSensitivityChange(Math.min(10, sensitivity + 1));
  }, [sensitivity, onSensitivityChange]);

  const decreaseSensitivity = useCallback(() => {
    onSensitivityChange(Math.max(1, sensitivity - 1));
  }, [sensitivity, onSensitivityChange]);

  return (
    <View style={styles.container}>
      {!isNavigating ? (
        <TouchableOpacity
          style={styles.startButton}
          onPress={onStart}
          accessibilityLabel="Start navigation"
          accessibilityRole="button"
        >
          <Text style={styles.startButtonText}>Start Navigation</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.activeControls}>
          <TouchableOpacity
            style={styles.controlButton}
            onPress={isPaused ? onResume : onPause}
            accessibilityLabel={isPaused ? 'Resume navigation' : 'Pause navigation'}
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>{isPaused ? '▶ Resume' : '⏸ Pause'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, styles.stopButton]}
            onPress={onStop}
            accessibilityLabel="Stop navigation"
            accessibilityRole="button"
          >
            <Text style={styles.controlText}>⏹ Stop</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.configRow}>
        <Text style={styles.configLabel}>Environment:</Text>
        <View style={styles.envButtons}>
          {ENVIRONMENTS.map(env => (
            <TouchableOpacity
              key={env}
              style={[
                styles.envButton,
                environment === env && styles.envButtonActive,
              ]}
              onPress={() => onEnvironmentChange(env)}
              accessibilityLabel={`${env} mode`}
              accessibilityRole="button"
            >
              <Text
                style={[
                  styles.envText,
                  environment === env && styles.envTextActive,
                ]}
              >
                {ENV_LABELS[env]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.configRow}>
        <Text style={styles.configLabel}>Sensitivity: {sensitivity}/10</Text>
        <View style={styles.sensitivityControls}>
          <TouchableOpacity
            style={styles.sensitivityButton}
            onPress={decreaseSensitivity}
            accessibilityLabel="Decrease sensitivity"
            accessibilityRole="button"
          >
            <Text style={styles.sensitivityButtonText}>−</Text>
          </TouchableOpacity>
          <View style={styles.sensitivityBar}>
            <View style={[styles.sensitivityFill, { width: `${sensitivity * 10}%` }]} />
          </View>
          <TouchableOpacity
            style={styles.sensitivityButton}
            onPress={increaseSensitivity}
            accessibilityLabel="Increase sensitivity"
            accessibilityRole="button"
          >
            <Text style={styles.sensitivityButtonText}>+</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

NavigationControls.displayName = 'NavigationControls';

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#111827',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  startButton: {
    backgroundColor: '#2563EB',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  activeControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    backgroundColor: '#374151',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  stopButton: {
    backgroundColor: '#991B1B',
  },
  controlText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  configRow: {
    marginTop: 12,
  },
  configLabel: {
    color: '#D1D5DB',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  envButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  envButton: {
    backgroundColor: '#1F2937',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#374151',
  },
  envButtonActive: {
    backgroundColor: '#1E3A5F',
    borderColor: '#2563EB',
  },
  envText: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  envTextActive: {
    color: '#60A5FA',
    fontWeight: '600',
  },
  sensitivityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sensitivityButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensitivityButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  sensitivityBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#1F2937',
    borderRadius: 3,
    overflow: 'hidden',
  },
  sensitivityFill: {
    height: '100%',
    backgroundColor: '#2563EB',
    borderRadius: 3,
  },
});

export { NavigationControls };
export type { NavigationControlsProps };
