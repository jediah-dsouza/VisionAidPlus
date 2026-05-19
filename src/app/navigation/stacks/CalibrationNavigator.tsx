import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { CalibrationStackParamList } from '../types/navigation';
import { getDefaultScreenOptions } from '../utils/navigationConfig';
import { Button, Card, Loader } from '@shared/design-system';
import { tokens, semanticTokens } from '@shared/design-system/theme';
import { navigationGuard } from '../utils/navigationGuards';

const CalibrationStack = createNativeStackNavigator<CalibrationStackParamList>();

export const CalibrationNavigator: React.FC = () => (
  <CalibrationStack.Navigator id="CalibrationStack" screenOptions={getDefaultScreenOptions()}>
    <CalibrationStack.Screen
      name="CalibrationStart"
      component={CalibrationStartScreen}
      options={{ title: 'Device Calibration' }}
    />
    <CalibrationStack.Screen
      name="CalibrationInstructions"
      component={CalibrationInstructionsScreen}
      options={{ title: 'Instructions' }}
    />
    <CalibrationStack.Screen
      name="CalibrationComplete"
      component={CalibrationCompleteScreen}
      options={{ title: 'Complete' }}
    />
  </CalibrationStack.Navigator>
);

const CalibrationStartScreen = () => (
  <View style={styles.container}>
    <Card variant="elevated" padding="lg">
      <Text style={styles.cardTitle}>Calibrate Your Device</Text>
      <Text style={styles.cardDescription}>
        Proper calibration ensures accurate obstacle detection and navigation assistance.
      </Text>
    </Card>
    <Button
      variant="primary"
      size="lg"
      fullWidth
      onPress={() =>
        navigationGuard.navigate('Calibration', { screen: 'CalibrationInstructions' })
      }>
      Start Calibration
    </Button>
  </View>
);

const CalibrationInstructionsScreen = () => {
  const [step, setStep] = useState(0);
  const instructions = [
    'Hold the device at chest level',
    'Point the sensor forward',
    'Stay still for 5 seconds',
    'Calibration complete!',
  ];

  return (
    <View style={styles.container}>
      <Card variant="elevated" padding="lg">
        <Text style={styles.stepLabel}>
          Step {step + 1} of {instructions.length}
        </Text>
        <Text style={styles.instructionText}>{instructions[step]}</Text>
      </Card>

      {step < instructions.length - 1 ? (
        <Button variant="primary" size="lg" fullWidth onPress={() => setStep(step + 1)}>
          Continue
        </Button>
      ) : (
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onPress={() =>
            navigationGuard.navigate('Calibration', { screen: 'CalibrationComplete' })
          }>
          Finish
        </Button>
      )}
    </View>
  );
};

const CalibrationCompleteScreen = () => (
  <View style={styles.container}>
    <View style={styles.successIcon}>
      <Text style={styles.successEmoji}>✓</Text>
    </View>
    <Text style={styles.successTitle}>Calibration Complete!</Text>
    <Text style={styles.successDescription}>
      Your device is now calibrated for optimal performance.
    </Text>
    <Button variant="primary" size="lg" fullWidth onPress={() => navigationGuard.navigate('Main')}>
      Done
    </Button>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
    padding: tokens.spacing[4],
    gap: tokens.spacing[6],
    justifyContent: 'center',
  },
  cardTitle: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  },
  cardDescription: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
  },
  stepLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
    textAlign: 'center',
    marginBottom: tokens.spacing[2],
  },
  instructionText: {
    fontSize: semanticTokens.fontSize.lg,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
    fontWeight: tokens.fontWeight.medium,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: semanticTokens.colors.success.default,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
  },
  successEmoji: {
    fontSize: 40,
    color: '#FFFFFF',
  },
  successTitle: {
    fontSize: semanticTokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
  },
  successDescription: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
  },
});
