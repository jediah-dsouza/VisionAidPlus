import React from 'react';
import { View, Text, StyleSheet, Pressable, Switch } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

interface ToggleProps {
  label?: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const Toggle: React.FC<ToggleProps> = ({
  label,
  description,
  value,
  onValueChange,
  disabled = false,
  size = 'md',
}) => {
  const reducedMotion = useReducedMotion();
  const isDisabled = disabled;

  const trackWidth = size === 'sm' ? 36 : size === 'md' ? 44 : 52;
  const trackHeight = size === 'sm' ? 20 : size === 'md' ? 24 : 28;
  const thumbSize = trackHeight - 4;
  const thumbOffset = (trackHeight - thumbSize) / 2;

  const accessibilityLabel = description
    ? `${label}, ${description}, ${value ? 'on' : 'off'}`
    : `${label}, ${value ? 'on' : 'off'}`;

  return (
    <Pressable
      style={[styles.wrapper, isDisabled && styles.disabled]}
      onPress={() => !isDisabled && onValueChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value, disabled: isDisabled }}>
      <View style={styles.content}>
        {(label || description) && (
          <View style={styles.labelContainer}>
            {label && <Text style={styles.label}>{label}</Text>}
            {description && <Text style={styles.description}>{description}</Text>}
          </View>
        )}
        <View
          style={[
            styles.track,
            { width: trackWidth, height: trackHeight },
            value && styles.trackOn,
            isDisabled && styles.trackDisabled,
          ]}>
          <View
            style={[
              styles.thumb,
              {
                width: thumbSize,
                height: thumbSize,
                transform: [
                  { translateX: value ? trackWidth - thumbSize - thumbOffset * 2 : thumbOffset },
                ],
              },
              reducedMotion && styles.thumbNoAnimation,
            ]}
          />
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  labelContainer: {
    flex: 1,
    marginRight: tokens.spacing[4],
  },
  label: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  description: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  track: {
    borderRadius: 100,
    backgroundColor: semanticTokens.colors.surface.elevated,
    justifyContent: 'center',
  },
  trackOn: {
    backgroundColor: semanticTokens.colors.primary.default,
  },
  trackDisabled: {
    backgroundColor: semanticTokens.colors.border.muted,
  },
  thumb: {
    borderRadius: 100,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbNoAnimation: {
    transform: [],
  },
});
