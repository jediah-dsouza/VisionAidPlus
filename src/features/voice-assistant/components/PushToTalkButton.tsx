import React, { memo, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface PushToTalkButtonProps {
  active: boolean;
  level: number;
  onActivate: () => void;
  onDeactivate: () => void;
}

const PushToTalkButton: React.FC<PushToTalkButtonProps> = memo(({
  active,
  level,
  onActivate,
  onDeactivate,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
    }).start();
    onActivate();
  }, [onActivate, scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
    onDeactivate();
  }, [onDeactivate, scaleAnim]);

  const borderColor = active
    ? `rgba(16, 185, 129, ${0.4 + level * 0.6})`
    : '#374151';

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.buttonWrapper, { transform: [{ scale: scaleAnim }] }]}>
        <TouchableOpacity
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={0.7}
          style={[
            styles.button,
            { borderColor },
            active && styles.buttonActive,
          ]}
          accessibilityRole="button"
          accessibilityLabel={active ? 'Release to stop talking' : 'Press and hold to talk'}
          accessibilityHint="Hold to record voice commands"
        >
          <Text style={[styles.icon, active && styles.iconActive]}>
            {active ? '🎙' : '🎤'}
          </Text>
          <Text style={[styles.label, active && styles.labelActive]}>
            {active ? 'Listening...' : 'Hold to Talk'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
});

PushToTalkButton.displayName = 'PushToTalkButton';

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  buttonWrapper: {
    borderRadius: 80,
  },
  button: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#1F2937',
    borderWidth: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: {
    backgroundColor: '#064E3B',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 8,
  },
  icon: {
    fontSize: 32,
    marginBottom: 4,
  },
  iconActive: {
    fontSize: 36,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  labelActive: {
    color: '#10B981',
  },
});

export { PushToTalkButton };
