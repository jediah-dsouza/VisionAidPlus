import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';

interface SettingSliderProps {
  label: string;
  description?: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  formatValue?: (value: number) => string;
  onValueChange: (value: number) => void;
  disabled?: boolean;
}

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 24;
const STEP_BUTTON_SIZE = 40;

export const SettingSlider: React.FC<SettingSliderProps> = ({
  label,
  description,
  value,
  min,
  max,
  step = 1,
  formatValue,
  onValueChange,
  disabled = false,
}) => {
  const lastAnnounce = useRef(0);

  const announce = useCallback(
    (val: number) => {
      const now = Date.now();
      if (now - lastAnnounce.current > 1500) {
        lastAnnounce.current = now;
        const display = formatValue ? formatValue(val) : `${val}`;
        accessibilityEngine.announce(`${label}: ${display}`, 'low');
      }
    },
    [label, formatValue],
  );

  const increment = useCallback(() => {
    const next = Math.min(value + step, max);
    onValueChange(next);
    announce(next);
  }, [value, step, max, onValueChange, announce]);

  const decrement = useCallback(() => {
    const next = Math.max(value - step, min);
    onValueChange(next);
    announce(next);
  }, [value, step, min, onValueChange, announce]);

  const displayValue = formatValue ? formatValue(value) : `${value}`;
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <View
      style={[styles.container, disabled && styles.disabled]}
      accessibilityLabel={`${label}: ${displayValue}`}
      accessibilityHint={description}
      accessibilityRole="adjustable"
      accessibilityActions={[
        { name: 'increment', label: 'Increase' },
        { name: 'decrement', label: 'Decrease' },
      ]}
      onAccessibilityAction={(event) => {
        if (event.nativeEvent.actionName === 'increment') increment();
        if (event.nativeEvent.actionName === 'decrement') decrement();
      }}>
      <View style={styles.header}>
        <View style={styles.info}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {label}
          </Text>
          {description ? (
            <Text style={[styles.description, disabled && styles.descriptionDisabled]}>
              {description}
            </Text>
          ) : null}
        </View>
        <Text style={styles.value}>{displayValue}</Text>
      </View>

      <View style={styles.sliderRow}>
        <Pressable
          onPress={decrement}
          disabled={disabled || value <= min}
          style={[styles.stepButton, disabled && styles.stepButtonDisabled]}
          accessibilityLabel={`Decrease ${label}`}
          accessibilityRole="button">
          <Text style={styles.stepButtonText}>−</Text>
        </Pressable>

        <View style={styles.trackContainer}>
          <View style={styles.track}>
            <View style={[styles.trackFill, { width: `${pct}%` }]} />
          </View>
          <View style={[styles.thumb, { left: `${pct}%`, marginLeft: -THUMB_SIZE / 2 }]} />
        </View>

        <Pressable
          onPress={increment}
          disabled={disabled || value >= max}
          style={[styles.stepButton, disabled && styles.stepButtonDisabled]}
          accessibilityLabel={`Increase ${label}`}
          accessibilityRole="button">
          <Text style={styles.stepButtonText}>+</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
  },
  disabled: {
    opacity: 0.5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: tokens.spacing[2],
  },
  info: {
    flex: 1,
    marginRight: tokens.spacing[3],
  },
  label: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  labelDisabled: {
    color: semanticTokens.colors.foreground.subtle,
  },
  description: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  descriptionDisabled: {
    color: semanticTokens.colors.foreground.subtle,
  },
  value: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.primary.default,
  },
  sliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: tokens.spacing[1],
  },
  stepButton: {
    width: STEP_BUTTON_SIZE,
    height: STEP_BUTTON_SIZE,
    borderRadius: STEP_BUTTON_SIZE / 2,
    backgroundColor: semanticTokens.colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepButtonDisabled: {
    backgroundColor: semanticTokens.colors.surface.elevated,
  },
  stepButtonText: {
    fontSize: 20,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.primary.default,
  },
  trackContainer: {
    flex: 1,
    height: THUMB_SIZE,
    justifyContent: 'center',
    marginHorizontal: tokens.spacing[2],
  },
  track: {
    height: TRACK_HEIGHT,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: TRACK_HEIGHT / 2,
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
    backgroundColor: semanticTokens.colors.primary.default,
    borderRadius: TRACK_HEIGHT / 2,
  },
  thumb: {
    position: 'absolute',
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
  },
});
