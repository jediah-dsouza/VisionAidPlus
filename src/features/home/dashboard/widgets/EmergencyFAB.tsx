import React, { useCallback, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { useAppSelector, useAppDispatch } from '@app/store';
import { emergencyActions } from '@app/store/slices/emergencySlice';
import { useEmergency } from '@features/emergency/hooks/useEmergency';
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
  const {
    status,
    countdownRemaining,
    countdownTotal,
    contacts,
    contactsNotified,
    isActive,
    startCountdown,
    cancelEmergency,
    triggerEmergency,
  } = useEmergency();

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (status === 'triggered' || status === 'sending') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();

      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      rotate.start();

      return () => {
        pulse.stop();
        rotate.stop();
      };
    }
    pulseAnim.setValue(1);
    rotateAnim.setValue(0);
  }, [status, pulseAnim, rotateAnim]);

  const handlePress = useCallback(() => {
    if (disabled || isActive) return;

    dispatch(emergencyActions.startCountdown(env.EMERGENCY_COUNTDOWN_SECONDS));
    startCountdown(env.EMERGENCY_COUNTDOWN_SECONDS);

    accessibilityEngine.announce(
      `Emergency will activate in ${env.EMERGENCY_COUNTDOWN_SECONDS} seconds. Tap to cancel.`,
      'critical',
      true,
    );
    accessibilityEngine.triggerHaptic('emergency');

    if (onTrigger) {
      onTrigger();
    }
  }, [disabled, isActive, dispatch, startCountdown, onTrigger]);

  const handleCancel = useCallback(() => {
    cancelEmergency();
    accessibilityEngine.announce('Emergency cancelled', 'high', true);
  }, [cancelEmergency]);

  const fabSize = size === 'lg' ? 72 : 56;
  const countdownProgress = countdownTotal > 0
    ? countdownRemaining / countdownTotal
    : 0;

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  if (status === 'countdown' && countdownRemaining > 0) {
    return (
      <Pressable
        style={[styles.countdownContainer, { width: fabSize + 40, height: fabSize + 40 }]}
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel={`Cancel emergency. ${countdownRemaining} seconds remaining`}
      >
        <View style={[styles.countdownRing, { borderColor: semanticTokens.colors.warning.default }]}>
          <Text style={styles.countdownText}>{countdownRemaining}</Text>
          <View style={[styles.countdownProgress, { width: `${(1 - countdownProgress) * 100}%` }]} />
        </View>
        <Text style={styles.cancelLabel}>TAP TO CANCEL</Text>
      </Pressable>
    );
  }

  if (status === 'triggered' || status === 'sending') {
    return (
      <Pressable
        style={[
          styles.container,
          {
            width: fabSize,
            height: fabSize,
            backgroundColor: semanticTokens.colors.background.subtle,
            borderWidth: 2,
            borderColor: semanticTokens.colors.danger.default,
          },
        ]}
        onPress={handleCancel}
        accessibilityRole="button"
        accessibilityLabel={
          `Emergency active. ${contactsNotified > 0 ? `${contactsNotified} contacts notified.` : 'Sending alerts.'} Tap to cancel.`
        }
      >
        <Animated.View
          style={[
            styles.pulseRing,
            { transform: [{ rotate: rotateInterpolation }] },
          ]}
        />
        <Animated.Text
          style={[
            styles.triggeredIcon,
            { transform: [{ scale: pulseAnim }] },
          ]}
        >
          🚨
        </Animated.Text>
      </Pressable>
    );
  }

  if (status === 'resolved' || status === 'cancelled') {
    return (
      <Pressable
        style={[
          styles.container,
          {
            width: fabSize,
            height: fabSize,
            backgroundColor: semanticTokens.colors.neutral.subtle,
          },
        ]}
        onPress={() => {
          accessibilityEngine.announce('Emergency reset. Ready for next use.', 'normal');
          dispatch(emergencyActions.resetEmergency());
        }}
        accessibilityRole="button"
        accessibilityLabel="Reset emergency state. Press to re-enable emergency button."
      >
        <Text style={{ fontSize: 20, color: semanticTokens.colors.foreground.muted }}>✓</Text>
      </Pressable>
    );
  }

  const accessibilityLabel = contacts.length > 0
    ? `Emergency button. ${contacts.length} contact${contacts.length !== 1 ? 's' : ''} configured. Press to start emergency.`
    : 'Emergency button. No contacts configured. Press to start emergency.';

  return (
    <Pressable
      style={[
        styles.container,
        {
          width: fabSize,
          height: fabSize,
          backgroundColor: semanticTokens.colors.danger.default,
        },
        disabled && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || isActive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint="Press to start emergency countdown. You can cancel within the countdown period."
    >
      <Text style={[styles.icon, { fontSize: size === 'lg' ? 28 : 22 }]}>🆘</Text>
      {contacts.filter(c => c.notifyOnEmergency).length > 0 && (
        <View style={styles.contactBadge}>
          <Text style={styles.contactCount}>{contacts.filter(c => c.notifyOnEmergency).length}</Text>
        </View>
      )}
      {contacts.filter(c => c.notifyOnEmergency).length === 0 && contacts.length > 0 && (
        <View style={[styles.contactBadge, { backgroundColor: semanticTokens.colors.warning.default }]}>
          <Text style={styles.contactCount}>!</Text>
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
    borderRadius: 16,
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
    backgroundColor: semanticTokens.colors.warning.subtle,
    overflow: 'hidden',
  },
  countdownText: {
    fontSize: 32,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.warning.default,
    zIndex: 1,
  },
  countdownProgress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 4,
    backgroundColor: semanticTokens.colors.warning.default,
    borderRadius: 2,
  },
  cancelLabel: {
    marginTop: tokens.spacing[2],
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    letterSpacing: 0.5,
  },
  triggeredIcon: {
    fontSize: 28,
  },
  pulseRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: semanticTokens.colors.danger.default,
    borderStyle: 'dashed',
  },
});
