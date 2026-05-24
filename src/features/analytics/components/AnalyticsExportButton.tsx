import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAppSelector } from '@app/store';
import { Card } from '@shared/design-system';
import { semanticTokens, tokens } from '@shared/design-system/theme';

interface AnalyticsExportButtonProps {
  onExport: () => void;
  disabled?: boolean;
}

export const AnalyticsExportButton: React.FC<AnalyticsExportButtonProps> = React.memo(
  ({ onExport, disabled = false }) => {
    const exportProgress = useAppSelector(
      state => state.analytics?.exportProgress ?? {
        isExporting: false,
        progress: 0,
        totalRecords: 0,
        error: null,
      },
    );

    const handlePress = useCallback(() => {
      if (!exportProgress.isExporting && !disabled) {
        onExport();
      }
    }, [exportProgress.isExporting, disabled, onExport]);

    return (
      <Card variant="default" padding="md">
        <TouchableOpacity
          style={[styles.button, disabled && styles.buttonDisabled]}
          onPress={handlePress}
          disabled={disabled || exportProgress.isExporting}
          accessibilityLabel={
            exportProgress.isExporting
              ? `Exporting, ${exportProgress.progress} of ${exportProgress.totalRecords} records`
              : 'Export analytics data'
          }
          accessibilityRole="button"
          accessibilityState={{ disabled: disabled || exportProgress.isExporting }}>
          {exportProgress.isExporting ? (
            <View style={styles.progressContainer}>
              <ActivityIndicator
                size="small"
                color={semanticTokens.colors.foreground.default}
              />
              <Text style={styles.buttonText}>
                {exportProgress.totalRecords > 0
                  ? `${Math.round((exportProgress.progress / exportProgress.totalRecords) * 100)}%`
                  : 'Exporting...'}
              </Text>
            </View>
          ) : (
            <Text style={styles.buttonText}>Export Data</Text>
          )}
        </TouchableOpacity>
        {exportProgress.progress > 0 && exportProgress.totalRecords > 0 && (
          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${(exportProgress.progress / exportProgress.totalRecords) * 100}%` },
              ]}
            />
          </View>
        )}
        {exportProgress.error && (
          <Text style={styles.errorText}>{exportProgress.error}</Text>
        )}
      </Card>
    );
  },
);

const styles = StyleSheet.create({
  button: {
    backgroundColor: semanticTokens.colors.primary.default,
    paddingVertical: tokens.spacing[3],
    borderRadius: tokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: semanticTokens.touchTarget.minimum,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  progressBarBg: {
    height: 4,
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderRadius: tokens.radius.full,
    marginTop: tokens.spacing[2],
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: semanticTokens.colors.primary.default,
    borderRadius: tokens.radius.full,
  },
  errorText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.danger.default,
    marginTop: tokens.spacing[2],
  },
});
