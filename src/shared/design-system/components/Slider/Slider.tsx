import React, { useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, GestureResponderEvent } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

interface SliderProps {
  label?: string;
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  value,
  min = 0,
  max = 100,
  step = 1,
  onValueChange,
  disabled = false,
  showValue = true,
  formatValue = v => String(v),
}) => {
  const reducedMotion = useReducedMotion();
  const progress = ((value - min) / (max - min)) * 100;
  const isDisabled = disabled;

  const handleTrackPress = useCallback(
    (event: GestureResponderEvent) => {
      if (isDisabled) return;

      const { locationX } = event.nativeEvent;
      const trackWidth = 300;
      const percentage = Math.max(0, Math.min(1, locationX / trackWidth));
      const newValue = min + percentage * (max - min);
      const steppedValue = Math.round(newValue / step) * step;
      onValueChange(Math.max(min, Math.min(max, steppedValue)));
    },
    [isDisabled, min, max, step, onValueChange],
  );

  const accessibilityLabel = label
    ? `${label}, ${formatValue(value)}, range ${formatValue(min)} to ${formatValue(max)}`
    : `Slider value ${formatValue(value)}`;

  return (
    <View style={styles.wrapper}>
      {(label || showValue) && (
        <View style={styles.labelRow}>
          {label && (
            <Text style={styles.label} accessibilityRole="text">
              {label}
            </Text>
          )}
          {showValue && <Text style={styles.valueText}>{formatValue(value)}</Text>}
        </View>
      )}
      <Pressable
        style={[styles.track, isDisabled && styles.disabled]}
        onPress={handleTrackPress}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{
          min,
          max,
          now: value,
          text: formatValue(value),
        }}
        accessibilityState={{ disabled: isDisabled }}>
        <View style={[styles.progress, { width: `${progress}%` }]} />
        <View
          style={[styles.thumb, { left: `${progress}%` }, reducedMotion && styles.thumbNoAnimation]}
          accessibilityElementsHidden
        />
      </Pressable>
      <View style={styles.rangeLabels}>
        <Text style={styles.rangeText}>{formatValue(min)}</Text>
        <Text style={styles.rangeText}>{formatValue(max)}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    gap: tokens.spacing[2],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  valueText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  track: {
    height: 8,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: 4,
    position: 'relative',
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  progress: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: semanticTokens.colors.primary.default,
    borderRadius: 4,
  },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    marginLeft: -12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  thumbNoAnimation: {
    transform: [],
  },
  disabled: {
    opacity: 0.5,
  },
  rangeLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  rangeText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
  },
});
