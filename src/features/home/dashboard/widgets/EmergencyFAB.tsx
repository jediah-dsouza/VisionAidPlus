import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useAppSelector, useAppDispatch } from '@app/store';
import { emergencyActions } from '@app/store/slices/emergencySlice';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { accessibilityEngine } from '@core/accessibility';
import env from '../../../../env';

interface EmergencyFABProps {
  onTrigger?: () => void;
  size?: 'md' | 'lg';
  disabled?: boolean;
  position?: 'bottomLeft' | 'bottomRight' | 'bottomCenter';
}

export const EmergencyFAB: React.FC<EmergencyFABProps> = ({
  onTrigger,
  size = 'lg',
  disabled = false,
  position = 'bottomRight',
}) => {
  const dispatch = useAppDispatch();
  const { status, countdownRemaining, contacts } = useAppSelector(state => state.emergency);
  const [isPressed, setIsPressed] = useState(false);

  const isActive = status !== 'idle';
  const countdownSeconds = env.EMERGENCY_COUNTDOWN_SECONDS;

  const handlePressIn = useCallback(() => {
    if (disabled || isActive) return;
    setIsPressed(true);
    accessibilityEngine.announce(
      `Emergency button pressed. Will trigger in ${countdownSeconds} seconds unless cancelled.`,
      'critical',
    );
  }, [disabled, isActive, countdownSeconds]);

  const handlePressOut = useCallback(() => {
    if (disabled || isActive) return;
    setIsPressed(false);
  }, [disabled, isActive]);

  const handlePress = useCallback(() => {
    if (disabled) return;

    dispatch(emergencyActions.startCountdown(countdownSeconds));
    accessibilityEngine.announce(
      `Emergency triggered. ${countdownSeconds} seconds to cancel.`,
      'critical',
    );

    if (onTrigger) {
      onTrigger();
    }
  }, [disabled, countdownSeconds, dispatch, onTrigger]);

  const handleCancel = useCallback(() => {
    dispatch(emergencyActions.cancelEmergency());
    accessibilityEngine.announce('Emergency cancelled', 'high');
  }, [dispatch]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (status === 'countdown' && countdownRemaining > 0) {
      interval = setInterval(() => {
        if (countdownRemaining > 1) {
          dispatch(emergencyActions.updateCountdown(countdownRemaining - 1));
          accessibilityEngine.announce(`${countdownRemaining - 1}`, 'high');
        } else {
          clearInterval(interval);
          dispatch(emergencyActions.triggerEmergency());
          accessibilityEngine.announce('Emergency triggered. Sending alerts.', 'critical');
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [status, countdownRemaining, dispatch]);

  const fabSize = size === 'lg' ? 72 : 56;
  const iconSize = size === 'lg' ? 32 : 24;

  const accessibilityLabel = isActive
    ? `Emergency active. ${status === 'countdown' ? `${countdownRemaining} seconds remaining` : status}`
    : 'Emergency button. Press and hold to trigger emergency alert.';

  if (isActive && status === 'countdown') {
    return (
      <Pressable
        style={[styles.countdownContainer, { width: fabSize + 40, height: fabSize + 40 }]}
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel={`Cancel emergency. ${countdownRemaining} seconds remaining`}>
        <View style={[styles.countdownRing, { borderColor: semanticTokens.colors.danger.default }]}>
          <Text style={styles.countdownText}>{countdownRemaining}</Text>
        </View>
        <Text style={styles.cancelLabel}>TAP TO CANCEL</Text>
      </Pressable>
    );
  }

  if (isActive && status === 'triggered') {
    return (
      <View
        style={[
          styles.container,
          {
            width: fabSize,
            height: fabSize,
            backgroundColor: semanticTokens.colors.danger.default,
          },
        ]}
        accessibilityLabel="Emergency triggered. Alerts being sent."
        accessibilityRole="alert">
        <Text style={styles.triggeredIcon}>🚨</Text>
        <View style={styles.pulseAnimation}>
          <View style={styles.pulse} />
          <View style={[styles.pulse, styles.pulseDelay]} />
        </View>
      </View>
    );
  }

  return (
    <Pressable
      style={[
        styles.container,
        {
          width: fabSize,
          height: fabSize,
          backgroundColor: isPressed
            ? semanticTokens.colors.danger.active
            : semanticTokens.colors.danger.default,
        },
        disabled && styles.disabled,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Press to start emergency countdown">
      <Text style={[styles.icon, { fontSize: iconSize }]}>🆘</Text>
      {contacts.length > 0 && (
        <View style={styles.contactBadge}>
          <Text style={styles.contactCount}>{contacts.length}</Text>
        </View>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: tokens.spacing[6],
    bottom: tokens.spacing[6],
    borderRadius: semanticTokens.radius.lg,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  icon: {
    color: '#FFFFFF',
  },
  disabled: {
    opacity: 0.5,
  },
  contactBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: semanticTokens.colors.primary.default,
    borderRadius: tokens.radius.full,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  contactCount: {
    fontSize: 10,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
  },
  countdownContainer: {
    position: 'absolute',
    right: tokens.spacing[6],
    bottom: tokens.spacing[6],
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownRing: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: semanticTokens.colors.danger.subtle,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.danger.default,
  },
  cancelLabel: {
    marginTop: tokens.spacing[2],
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  triggeredIcon: {
    fontSize: 28,
  },
  pulseAnimation: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pulse: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: semanticTokens.radius.lg,
    backgroundColor: semanticTokens.colors.danger.default,
    opacity: 0,
  },
  pulseDelay: {
    opacity: 0.5,
  },
});
