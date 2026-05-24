import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Button } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface ScanHeaderProps {
  isScanning: boolean;
  onScanToggle: () => void;
}

export const ScanHeader: React.FC<ScanHeaderProps> = ({ isScanning, onScanToggle }) => (
  <View style={styles.container} accessibilityLabel="Device scanning controls">
    <View style={styles.statusRow}>
      {isScanning && (
        <View style={styles.scanningIndicator}>
          <ActivityIndicator size="small" color={semanticTokens.colors.primary.default} />
          <Text style={styles.scanningText}>Scanning...</Text>
        </View>
      )}
    </View>
    <Button
      variant={isScanning ? 'danger' : 'primary'}
      size="lg"
      fullWidth
      onPress={onScanToggle}
      accessibilityLabel={isScanning ? 'Stop scanning for devices' : 'Start scanning for devices'}
      accessibilityState={{ busy: isScanning }}>
      {isScanning ? 'Stop Scanning' : 'Scan for Devices'}
    </Button>
  </View>
);

const styles = StyleSheet.create({
  container: {
    gap: tokens.spacing[3],
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 24,
  },
  scanningIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  scanningText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
  },
});
