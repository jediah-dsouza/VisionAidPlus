import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useAppDispatch, useAppSelector } from '@app/store';
import { analyticsSlice } from '@app/store/slices/analyticsSlice';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import type { AnalyticsCategory, AnalyticsSeverity, AnalyticsSource } from '@core/analytics/types';

const CATEGORIES: AnalyticsCategory[] = ['safety', 'obstacle', 'usage', 'alert', 'session', 'performance'];

const SEVERITIES: AnalyticsSeverity[] = ['info', 'warning', 'critical'];

const SOURCES: AnalyticsSource[] = ['voice', 'ble', 'emergency', 'navigation', 'ai', 'safety', 'system'];

export const AnalyticsFilterBar: React.FC = React.memo(() => {
  const filter = useAppSelector(state => {
    if (!state.analytics?.filter) {
      return { timeRange: { start: 0 }, categories: [], severities: [], priorities: [], sources: [] };
    }
    return state.analytics.filter;
  });
  const dispatch = useAppDispatch();

  const toggleCategory = useCallback(
    (cat: AnalyticsCategory) => {
      const next = filter.categories.includes(cat)
        ? filter.categories.filter(c => c !== cat)
        : [...filter.categories, cat];
      dispatch(analyticsSlice.actions.setFilter({ categories: next }));
    },
    [filter.categories, dispatch],
  );

  const toggleSeverity = useCallback(
    (sev: AnalyticsSeverity) => {
      const next = filter.severities.includes(sev)
        ? filter.severities.filter(s => s !== sev)
        : [...filter.severities, sev];
      dispatch(analyticsSlice.actions.setFilter({ severities: next }));
    },
    [filter.severities, dispatch],
  );

  const toggleSource = useCallback(
    (src: AnalyticsSource) => {
      const next = filter.sources.includes(src)
        ? filter.sources.filter(s => s !== src)
        : [...filter.sources, src];
      dispatch(analyticsSlice.actions.setFilter({ sources: next }));
    },
    [filter.sources, dispatch],
  );

  const clearFilters = useCallback(() => {
    dispatch(analyticsSlice.actions.resetFilter());
  }, [dispatch]);

  const hasActiveFilters =
    filter.categories.length > 0 ||
    filter.severities.length > 0 ||
    filter.sources.length > 0;

  return (
    <View style={styles.container} accessibilityLabel="Analytics filter controls" accessibilityRole="text">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
        {CATEGORIES.map(cat => {
          const active = filter.categories.includes(cat);
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleCategory(cat)}
              accessibilityLabel={`${active ? 'Remove' : 'Add'} ${cat} category filter`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
        {SEVERITIES.map(sev => {
          const active = filter.severities.includes(sev);
          return (
            <TouchableOpacity
              key={sev}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleSeverity(sev)}
              accessibilityLabel={`${active ? 'Remove' : 'Add'} ${sev} severity filter`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {sev}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scrollRow}>
        {SOURCES.map(src => {
          const active = filter.sources.includes(src);
          return (
            <TouchableOpacity
              key={src}
              style={[styles.chip, active && styles.chipActive]}
              onPress={() => toggleSource(src)}
              accessibilityLabel={`${active ? 'Remove' : 'Add'} ${src} source filter`}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}>
              <Text style={[styles.chipText, active && styles.chipTextActive]}>
                {src}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      {hasActiveFilters && (
        <TouchableOpacity
          style={styles.clearButton}
          onPress={clearFilters}
          accessibilityLabel="Clear all filters"
          accessibilityRole="button">
          <Text style={styles.clearText}>Clear Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing[2],
    paddingVertical: tokens.spacing[2],
  },
  scrollRow: {
    flexGrow: 0,
  },
  chip: {
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
    borderRadius: tokens.radius.full,
    backgroundColor: semanticTokens.colors.surface.elevated,
    marginRight: tokens.spacing[2],
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
  },
  chipActive: {
    backgroundColor: semanticTokens.colors.primary.default,
    borderColor: semanticTokens.colors.primary.default,
  },
  chipText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    textTransform: 'capitalize',
  },
  chipTextActive: {
    color: semanticTokens.colors.foreground.default,
    fontWeight: tokens.fontWeight.medium,
  },
  clearButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[1],
  },
  clearText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
  },
});
