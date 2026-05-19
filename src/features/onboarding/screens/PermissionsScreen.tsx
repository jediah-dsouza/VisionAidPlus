import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Button } from '@shared/design-system/components';
import { tokens, semanticTokens } from '@shared/design-system/theme';
import { useOnboarding } from '../hooks/useOnboarding';
import { usePermissions } from '../hooks/usePermissions';
import { navigationGuard } from '../../../app/navigation/utils/navigationGuards';
import type { PermissionState } from '../types';

interface PermissionItemProps {
  icon: string;
  title: string;
  description: string;
  status: PermissionState[keyof PermissionState];
  onRequest: () => void;
  onOpenSettings?: () => void;
}

const PermissionItem: React.FC<PermissionItemProps> = ({
  icon,
  title,
  description,
  status,
  onRequest,
  onOpenSettings,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'granted':
        return semanticTokens.colors.success.default;
      case 'denied':
        return semanticTokens.colors.danger.default;
      case 'blocked':
        return semanticTokens.colors.warning.default;
      default:
        return semanticTokens.colors.foreground.muted;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'granted':
        return 'Granted';
      case 'denied':
        return 'Denied';
      case 'blocked':
        return 'Blocked';
      default:
        return 'Not Granted';
    }
  };

  return (
    <View style={styles.permissionItem}>
      <View style={styles.permissionIcon}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>
      <View style={styles.permissionContent}>
        <Text style={styles.permissionTitle}>{title}</Text>
        <Text style={styles.permissionDescription}>{description}</Text>
        <View style={styles.permissionStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, { color: getStatusColor() }]}>{getStatusText()}</Text>
        </View>
        {(status === 'denied' || status === 'blocked') && onOpenSettings && (
          <Pressable style={styles.settingsButton} onPress={onOpenSettings}>
            <Text style={styles.settingsButtonText}>Open Settings</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

export const PermissionsScreen: React.FC = () => {
  const { permissions, updatePermission, allPermissionsGranted, hasDeniedPermissions } =
    useOnboarding();
  const { requestPermission, requestAllPermissions, openSettings, isLoading } = usePermissions();

  const handleRequestPermission = useCallback(
    async (permission: keyof PermissionState) => {
      const status = await requestPermission(permission);
      updatePermission(permission, status);
    },
    [requestPermission, updatePermission],
  );

  const handleRequestAll = useCallback(async () => {
    await requestAllPermissions();
  }, [requestAllPermissions]);

  const handleContinue = useCallback(() => {
    navigationGuard.navigate('Onboarding', { screen: 'DevicePairing' });
  }, []);

  const permissionItems: Array<{
    key: keyof PermissionState;
    icon: string;
    title: string;
    description: string;
  }> = [
    {
      key: 'camera',
      icon: '📷',
      title: 'Camera',
      description: 'Required for object detection and navigation',
    },
    {
      key: 'location',
      icon: '📍',
      title: 'Location',
      description: 'Required for navigation and location-based alerts',
    },
    {
      key: 'bluetooth',
      icon: '📡',
      title: 'Bluetooth',
      description: 'Required to connect to your VisionAid device',
    },
    {
      key: 'notifications',
      icon: '🔔',
      title: 'Notifications',
      description: 'Required for emergency alerts and updates',
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Permissions</Text>
          <Text style={styles.subtitle}>
            VisionAid+ needs certain permissions to provide the best experience
          </Text>
        </View>

        <View style={styles.permissionsList}>
          {permissionItems.map(item => (
            <PermissionItem
              key={item.key}
              icon={item.icon}
              title={item.title}
              description={item.description}
              status={permissions[item.key]}
              onRequest={() => handleRequestPermission(item.key)}
              onOpenSettings={openSettings}
            />
          ))}
        </View>

        {hasDeniedPermissions && (
          <View style={styles.warningContainer}>
            <Text style={styles.warningText}>
              Some permissions were denied. You can grant them in Settings for full functionality.
            </Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          onPress={handleRequestAll}
          isLoading={isLoading}
          disabled={isLoading}>
          Grant All Permissions
        </Button>
        <Button variant="primary" size="lg" fullWidth onPress={handleContinue} disabled={isLoading}>
          Continue
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: tokens.spacing[6],
    paddingVertical: tokens.spacing[6],
  },
  header: {
    marginBottom: tokens.spacing[6],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    lineHeight: 26,
  },
  permissionsList: {
    gap: tokens.spacing[4],
  },
  permissionItem: {
    flexDirection: 'row',
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.lg,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: semanticTokens.colors.primary.subtle,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing[4],
  },
  iconText: {
    fontSize: 24,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[1],
  },
  permissionDescription: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[2],
  },
  permissionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: tokens.spacing[2],
  },
  statusText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
  },
  settingsButton: {
    marginTop: tokens.spacing[2],
    alignSelf: 'flex-start',
  },
  settingsButtonText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
  },
  warningContainer: {
    marginTop: tokens.spacing[4],
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.warning.subtle,
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    borderColor: semanticTokens.colors.warning.default,
  },
  warningText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.warning.default,
    textAlign: 'center',
  },
  footer: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
});

export default PermissionsScreen;
