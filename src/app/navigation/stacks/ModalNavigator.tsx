import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ModalStackParamList } from '../types/navigation';
import { getModalScreenOptions } from '../utils/navigationConfig';
import { Modal, Button } from '@shared/design-system';
import { useTheme } from '@app/providers/ThemeProvider';
import { tokens, semanticTokens } from '@shared/design-system/theme';

const ModalStack = createNativeStackNavigator<ModalStackParamList>();

export const ModalNavigator: React.FC = () => (
  <ModalStack.Navigator
    id="ModalStack"
    screenOptions={{
      ...getModalScreenOptions(),
      presentation: 'modal',
    }}>
    <ModalStack.Screen
      name="Confirmation"
      component={ConfirmationScreen}
      options={{ title: 'Confirm' }}
    />
    <ModalStack.Screen name="Alert" component={AlertScreen} options={{ title: 'Alert' }} />
    <ModalStack.Screen
      name="BottomSheet"
      component={BottomSheetScreen}
      options={{ title: 'Options', presentation: 'modal' }}
    />
  </ModalStack.Navigator>
);

const ConfirmationScreen = ({ route }: any) => {
  const { title, message, confirmText = 'Confirm', cancelText = 'Cancel' } = route.params || {};

  return (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>{title || 'Confirm Action'}</Text>
      <Text style={styles.modalMessage}>{message || 'Are you sure you want to continue?'}</Text>
      <View style={styles.modalActions}>
        <Button variant="ghost" size="md" onPress={() => {}}>
          {cancelText}
        </Button>
        <Button variant="primary" size="md" onPress={() => {}}>
          {confirmText}
        </Button>
      </View>
    </View>
  );
};

const AlertScreen = ({ route }: any) => {
  const { title, message } = route.params || {};

  return (
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>{title || 'Alert'}</Text>
      <Text style={styles.modalMessage}>{message}</Text>
      <View style={styles.modalActions}>
        <Button variant="primary" size="md" onPress={() => {}}>
          OK
        </Button>
      </View>
    </View>
  );
};

const BottomSheetScreen = () => (
  <View style={styles.modalContent}>
    <Text style={styles.modalTitle}>Options</Text>
    <Button variant="ghost" size="lg" fullWidth onPress={() => {}}>
      Option 1
    </Button>
    <Button variant="ghost" size="lg" fullWidth onPress={() => {}}>
      Option 2
    </Button>
    <Button variant="ghost" size="lg" fullWidth onPress={() => {}}>
      Option 3
    </Button>
  </View>
);

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
    padding: tokens.spacing[6],
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
    marginBottom: tokens.spacing[4],
  },
  modalMessage: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    marginBottom: tokens.spacing[6],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: tokens.spacing[3],
  },
});
