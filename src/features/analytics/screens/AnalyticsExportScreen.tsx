import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useAppDispatch, useAppSelector } from '@app/store';
import { analyticsSlice } from '@app/store/slices/analyticsSlice';
import { Card, Button } from '@shared/design-system';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { AnalyticsExportButton } from '../components/AnalyticsExportButton';
import type { ExportFormat } from '@core/analytics/types';

export const AnalyticsExportScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const alertHistory = useAppSelector(state => state.analytics?.alertHistory ?? []);
  const exportProgress = useAppSelector(state => state.analytics?.exportProgress ?? {
    isExporting: false,
    progress: 0,
    totalRecords: 0,
    error: null,
  });

  const [format, setFormat] = useState<ExportFormat>('json');
  const [dateRange, setDateRange] = useState<{ start: number; end?: number }>({
    start: 0,
  });

  const handleFormatSelect = useCallback((f: ExportFormat) => {
    setFormat(f);
  }, []);

  const handleExport = useCallback(() => {
    const total = alertHistory.length;
    if (total === 0) return;

    dispatch(
      analyticsSlice.actions.setExportProgress({
        isExporting: true,
        progress: 0,
        totalRecords: total,
        error: null,
      }),
    );

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.ceil(total / 10);
      if (progress >= total) {
        clearInterval(interval);
        dispatch(
          analyticsSlice.actions.setExportProgress({
            isExporting: false,
            progress: total,
            totalRecords: total,
            error: null,
          }),
        );
      } else {
        dispatch(
          analyticsSlice.actions.setExportProgress({
            isExporting: true,
            progress,
            totalRecords: total,
            error: null,
          }),
        );
      }
    }, 200);
  }, [alertHistory.length, dispatch]);

  const handleCancel = useCallback(() => {
    dispatch(
      analyticsSlice.actions.setExportProgress({
        isExporting: false,
        progress: 0,
        totalRecords: 0,
        error: 'Cancelled',
      }),
    );
  }, [dispatch]);

  const totalFiltered = alertHistory.filter(a => {
    if (dateRange.start > 0 && a.timestamp < dateRange.start) return false;
    if (dateRange.end && a.timestamp > dateRange.end) return false;
    return true;
  }).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      accessibilityLabel="Export analytics data screen">
      <Card variant="elevated" padding="md">
        <Text style={styles.sectionTitle}>Export Format</Text>
        <View style={styles.formatRow}>
          {(['json', 'csv'] as ExportFormat[]).map(f => (
            <TouchableOpacity
              key={f}
              style={[styles.formatChip, format === f && styles.formatChipActive]}
              onPress={() => handleFormatSelect(f)}
              accessibilityLabel={`${f.toUpperCase()} format${format === f ? ', selected' : ''}`}
              accessibilityRole="button"
              accessibilityState={{ selected: format === f }}>
              <Text
                style={[
                  styles.formatChipText,
                  format === f && styles.formatChipTextActive,
                ]}>
                {f.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      <Card variant="elevated" padding="md">
        <Text style={styles.sectionTitle}>Date Range</Text>
        <Text style={styles.rangeInfo}>
          {dateRange.start > 0
            ? `From: ${new Date(dateRange.start).toLocaleDateString()}`
            : 'All time'}
          {dateRange.end
            ? ` To: ${new Date(dateRange.end).toLocaleDateString()}`
            : ''}
        </Text>
        <View style={styles.rangeActions}>
          <Button
            variant="outline"
            size="sm"
            onPress={() =>
              setDateRange({
                start: Date.now() - 7 * 24 * 60 * 60 * 1000,
              })
            }
            accessibilityLabel="Last 7 days">
            7 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() =>
              setDateRange({
                start: Date.now() - 30 * 24 * 60 * 60 * 1000,
              })
            }
            accessibilityLabel="Last 30 days">
            30 Days
          </Button>
          <Button
            variant="outline"
            size="sm"
            onPress={() => setDateRange({ start: 0 })}
            accessibilityLabel="All time">
            All Time
          </Button>
        </View>
      </Card>

      <Card variant="default" padding="md">
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Records to export:</Text>
          <Text style={styles.summaryValue}>{totalFiltered}</Text>
        </View>
      </Card>

      {exportProgress.isExporting ? (
        <View style={styles.cancelContainer}>
          <Button
            variant="danger"
            size="md"
            onPress={handleCancel}
            accessibilityLabel="Cancel export">
            Cancel Export
          </Button>
        </View>
      ) : (
        <AnalyticsExportButton
          onExport={handleExport}
          disabled={totalFiltered === 0}
        />
      )}

      {exportProgress.error && !exportProgress.isExporting && (
        <Card variant="default" padding="md">
          <Text style={styles.errorText}>{exportProgress.error}</Text>
        </Card>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  content: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[3],
  },
  formatRow: {
    flexDirection: 'row',
    gap: tokens.spacing[3],
  },
  formatChip: {
    flex: 1,
    paddingVertical: tokens.spacing[2],
    borderRadius: tokens.radius.md,
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
    backgroundColor: semanticTokens.colors.surface.elevated,
    alignItems: 'center',
  },
  formatChipActive: {
    backgroundColor: semanticTokens.colors.primary.default,
    borderColor: semanticTokens.colors.primary.default,
  },
  formatChipText: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.muted,
  },
  formatChipTextActive: {
    color: semanticTokens.colors.foreground.default,
  },
  rangeInfo: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[3],
  },
  rangeActions: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
  },
  summaryValue: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  cancelContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.danger.default,
  },
});
