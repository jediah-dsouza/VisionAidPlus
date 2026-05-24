import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useAppSelector } from '@app/store';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { AnalyticsWidgetGrid } from '../components/AnalyticsWidgetGrid';
import type { AnalyticsWidgetConfig } from '../types';

const DEFAULT_WIDGET_CONFIG: AnalyticsWidgetConfig[] = [
  { id: 'session', size: 'full', order: 1 },
  { id: 'safety', size: 'full', order: 2 },
  { id: 'obstacles', size: 'full', order: 3 },
  { id: 'usage', size: 'full', order: 4 },
  { id: 'alerts', size: 'full', order: 5 },
];

export const DashboardScreen: React.FC = () => {
  const isActive = useAppSelector(state => state.analytics?.isActive ?? false);
  const sessionId = useAppSelector(state => state.analytics?.sessionId ?? null);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="Analytics dashboard">
      <View style={styles.statusBar}>
        <View
          style={[
            styles.statusDot,
            { backgroundColor: isActive ? semanticTokens.colors.success.default : semanticTokens.colors.foreground.subtle },
          ]}
        />
        <Text style={styles.statusText}>
          {isActive ? 'Analytics Active' : 'Analytics Inactive'}
        </Text>
        {sessionId && (
          <Text style={styles.sessionId} numberOfLines={1}>
            Session: {sessionId.slice(0, 16)}...
          </Text>
        )}
      </View>
      <AnalyticsWidgetGrid config={DEFAULT_WIDGET_CONFIG} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  content: {
    paddingBottom: tokens.spacing[6],
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.border.default,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusText: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  sessionId: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.subtle,
    flex: 1,
    textAlign: 'right',
  },
});
