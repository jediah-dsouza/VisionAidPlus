import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, AccessibilityInfo } from 'react-native';
import { EventPriority } from '@core/events/EventBus';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';
import { accessibilityEventEmitter } from '@core/accessibility/AccessibilityEventEmitter';

export type LiveRegionPoliteness = 'polite' | 'assertive';

export interface LiveRegionProps {
  message?: string;
  priority?: EventPriority;
  politeness?: LiveRegionPoliteness;
  animated?: boolean;
  autoAnnounce?: boolean;
  children?: React.ReactNode;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  priority = 'normal',
  politeness = 'polite',
  autoAnnounce = false,
  children,
}) => {
  const previousMessage = useRef(message);

  useEffect(() => {
    if (autoAnnounce && message && message !== previousMessage.current) {
      previousMessage.current = message;
      accessibilityEngine.announce(message, priority);
      accessibilityEventEmitter.emitAnnouncementStarted(message, priority);
    }
  }, [message, priority, autoAnnounce]);

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={styles.container}>
      {children}
    </View>
  );
};

export const useLiveAnnounce = () => {
  const announce = useCallback(async (message: string, priority: EventPriority = 'normal') => {
    await accessibilityEngine.announce(message, priority);
    accessibilityEventEmitter.emitAnnouncementStarted(message, priority);
  }, []);

  const announceCritical = useCallback(async (message: string) => {
    await accessibilityEngine.announce(message, 'critical');
    accessibilityEventEmitter.emitAnnouncementStarted(message, 'critical');
  }, []);

  const announceHigh = useCallback(async (message: string) => {
    await accessibilityEngine.announce(message, 'high');
    accessibilityEventEmitter.emitAnnouncementStarted(message, 'high');
  }, []);

  const announceNormal = useCallback(async (message: string) => {
    await accessibilityEngine.announce(message, 'normal');
    accessibilityEventEmitter.emitAnnouncementStarted(message, 'normal');
  }, []);

  const announceLow = useCallback(async (message: string) => {
    await accessibilityEngine.announce(message, 'low');
    accessibilityEventEmitter.emitAnnouncementStarted(message, 'low');
  }, []);

  return {
    announce,
    announceCritical,
    announceHigh,
    announceNormal,
    announceLow,
  };
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 1,
    height: 1,
    overflow: 'hidden',
  },
});
