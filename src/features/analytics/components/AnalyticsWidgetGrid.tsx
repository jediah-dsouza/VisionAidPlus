import React from 'react';
import { View, StyleSheet } from 'react-native';
import { tokens } from '@shared/design-system/theme';
import type { AnalyticsWidgetConfig } from '../types';
import { AnalyticsSafetyWidget } from './AnalyticsSafetyWidget';
import { AnalyticsObstacleWidget } from './AnalyticsObstacleWidget';
import { AnalyticsUsageWidget } from './AnalyticsUsageWidget';
import { AnalyticsAlertListWidget } from './AnalyticsAlertListWidget';
import { AnalyticsSessionWidget } from './AnalyticsSessionWidget';

interface AnalyticsWidgetGridProps {
  config: AnalyticsWidgetConfig[];
}

const WIDGET_MAP: Record<string, React.FC<{ compact?: boolean }>> = {
  safety: AnalyticsSafetyWidget,
  obstacles: AnalyticsObstacleWidget,
  usage: AnalyticsUsageWidget,
  alerts: AnalyticsAlertListWidget,
  session: AnalyticsSessionWidget,
};

export const AnalyticsWidgetGrid: React.FC<AnalyticsWidgetGridProps> = React.memo(
  ({ config }) => {
    const sorted = [...config].sort((a, b) => a.order - b.order);

    return (
      <View style={styles.grid} accessibilityLabel="Analytics widgets grid" accessibilityRole="text">
        {sorted.map(item => {
          const Widget = WIDGET_MAP[item.id];
          if (!Widget) return null;
          const isCompact = item.size === 'compact';
          return (
            <View
              key={item.id}
              style={[styles.widgetWrapper, isCompact && styles.widgetCompact]}>
              <Widget compact={isCompact} />
            </View>
          );
        })}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  grid: {
    gap: tokens.spacing[3],
    padding: tokens.spacing[2],
  },
  widgetWrapper: {
    width: '100%',
  },
  widgetCompact: {
    width: '48%',
  },
});
