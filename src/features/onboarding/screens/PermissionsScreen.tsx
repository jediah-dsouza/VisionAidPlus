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
        return '#22C55E';
      case 'denied':
        return '#EF4444';
      case 'blocked':
        return '#F59E0B';
      default:
        return '#64748B';
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

  const isGranted = status === 'granted';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.permissionItem,
        pressed && !isGranted && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={isGranted ? undefined : onRequest}
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${getStatusText()}. Tap to request`}>
      <View style={[styles.permissionIcon, isGranted && styles.permissionIconGranted]}>
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
      {!isGranted && (
        <View style={styles.chevron}>
          <Text style={styles.chevronText}>›</Text>
        </View>
      )}
    </Pressable>
  );
};

export const PermissionsScreen: React.FC = () => {
  const { permissions, updatePermission, hasDeniedPermissions } = useOnboarding();
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
    <View style={styles.root}>
      <View style={styles.gradientOverlay}>
        <View style={styles.gradientTop} />
        <View style={styles.gradientBottom} />
      </View>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
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
              <Text style={styles.warningIcon}>⚠</Text>
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
          <Button
            variant="primary"
            size="lg"
            fullWidth
            onPress={handleContinue}
            disabled={isLoading}>
            Continue
          </Button>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0B1121',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFill,
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#0F172A',
    opacity: 0.6,
  },
  gradientBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
    backgroundColor: '#1E293B',
    opacity: 0.15,
  },
  container: {
    flex: 1,
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
    fontSize: 30,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    marginBottom: tokens.spacing[2],
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.muted,
    lineHeight: 26,
    letterSpacing: 0.2,
  },
  permissionsList: {
    gap: tokens.spacing[4],
  },
  permissionItem: {
    flexDirection: 'row',
    backgroundColor: '#1A2332',
    borderRadius: 16,
    padding: tokens.spacing[4],
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    alignItems: 'center',
  },
  permissionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: tokens.spacing[4],
  },
  permissionIconGranted: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
  },
  iconText: {
    fontSize: 22,
  },
  permissionContent: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: '#FFFFFF',
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
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.medium,
  },
  settingsButton: {
    marginTop: tokens.spacing[2],
    alignSelf: 'flex-start',
  },
  settingsButtonText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
  chevron: {
    marginLeft: tokens.spacing[2],
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 22,
    color: '#64748B',
    fontWeight: tokens.fontWeight.light,
  },
  warningContainer: {
    marginTop: tokens.spacing[5],
    padding: tokens.spacing[4],
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  warningIcon: {
    fontSize: 18,
  },
  warningText: {
    fontSize: semanticTokens.fontSize.sm,
    color: '#F59E0B',
    textAlign: 'left',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: tokens.spacing[6],
    gap: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
});

export default PermissionsScreen;
