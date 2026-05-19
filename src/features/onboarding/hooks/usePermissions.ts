import { useState, useCallback, useEffect } from 'react';
import { Platform, PermissionsAndroid, Linking } from 'react-native';
import { accessibilityEngine, logger } from '../../../core';
import type { PermissionStatus, PermissionState } from '../types';

interface UsePermissionsReturn {
  permissions: PermissionState;
  checkPermissions: () => Promise<void>;
  requestPermission: (permission: keyof PermissionState) => Promise<PermissionStatus>;
  requestAllPermissions: () => Promise<boolean>;
  openSettings: () => void;
  isLoading: boolean;
}

const permissionMap: Record<keyof PermissionState, string> = {
  camera: 'android.permission.CAMERA',
  location: 'android.permission.ACCESS_FINE_LOCATION',
  notifications: 'android.permission.POST_NOTIFICATIONS',
  bluetooth: 'android.permission.BLUETOOTH_CONNECT',
};

export const usePermissions = (): UsePermissionsReturn => {
  const [permissions, setPermissions] = useState<PermissionState>({
    camera: 'undetermined',
    location: 'undetermined',
    notifications: 'undetermined',
    bluetooth: 'undetermined',
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkPermissions = useCallback(async () => {
    if (Platform.OS !== 'android') {
      return;
    }

    const newPermissions: PermissionState = { ...permissions };

    for (const [key, androidPermission] of Object.entries(permissionMap)) {
      try {
        const status = await PermissionsAndroid.check(
          androidPermission as Parameters<typeof PermissionsAndroid.check>[0],
        );
        newPermissions[key as keyof PermissionState] = status ? 'granted' : 'undetermined';
      } catch (error) {
        logger.error(`Error checking permission ${key}`, error);
        newPermissions[key as keyof PermissionState] = 'undetermined';
      }
    }

    setPermissions(newPermissions);
  }, [permissions]);

  const requestPermission = useCallback(
    async (permission: keyof PermissionState): Promise<PermissionStatus> => {
      if (Platform.OS !== 'android') {
        return 'granted';
      }

      setIsLoading(true);
      try {
        const androidPermission = permissionMap[permission];
        const result = await PermissionsAndroid.request(
          androidPermission as Parameters<typeof PermissionsAndroid.request>[0],
          {
            title: getPermissionTitle(permission),
            message: getPermissionMessage(permission),
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          },
        );

        let status: PermissionStatus;
        if (result === PermissionsAndroid.RESULTS.GRANTED) {
          status = 'granted';
          accessibilityEngine.announce(`${permission} permission granted`, 'normal');
        } else if (result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
          status = 'blocked';
          accessibilityEngine.announce(
            `${permission} permission blocked. Please enable in settings.`,
            'high',
          );
        } else {
          status = 'denied';
          accessibilityEngine.announce(`${permission} permission denied`, 'normal');
        }

        setPermissions(prev => ({ ...prev, [permission]: status }));
        return status;
      } catch (error) {
        logger.error(`Error requesting permission ${permission}`, error);
        return 'denied';
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const requestAllPermissions = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    let allGranted = true;

    for (const key of Object.keys(permissionMap) as Array<keyof PermissionState>) {
      const currentStatus = permissions[key];
      if (currentStatus !== 'granted') {
        const status = await requestPermission(key);
        if (status !== 'granted') {
          allGranted = false;
        }
      }
    }

    setIsLoading(false);
    return allGranted;
  }, [permissions, requestPermission]);

  const openSettings = useCallback(() => {
    Linking.openSettings();
    accessibilityEngine.announce('Opening device settings', 'normal');
  }, []);

  useEffect(() => {
    checkPermissions();
  }, []);

  return {
    permissions,
    checkPermissions,
    requestPermission,
    requestAllPermissions,
    openSettings,
    isLoading,
  };
};

const getPermissionTitle = (permission: keyof PermissionState): string => {
  const titles: Record<keyof PermissionState, string> = {
    camera: 'Camera Permission Required',
    location: 'Location Permission Required',
    notifications: 'Notification Permission',
    bluetooth: 'Bluetooth Permission Required',
  };
  return titles[permission];
};

const getPermissionMessage = (permission: keyof PermissionState): string => {
  const messages: Record<keyof PermissionState, string> = {
    camera: 'VisionAid+ needs camera access to provide object detection and navigation assistance.',
    location:
      'VisionAid+ needs location access to provide navigation directions and location-based alerts.',
    notifications:
      'Enable notifications to receive emergency alerts and important updates from VisionAid+.',
    bluetooth:
      'VisionAid+ needs Bluetooth access to connect to your VisionAid device for obstacle detection.',
  };
  return messages[permission];
};
