import React, { ReactNode } from 'react';
import { View } from 'react-native';
import { useScreenReaderEnabled } from '../../hooks';

export interface AccessibilityWrapperProps {
  children: ReactNode;
  accessibilityLabel: string;
  accessibilityHint?: string;
  accessibilityRole?: 'button' | 'text' | 'image' | 'none';
}

export function AccessibilityContainer({
  children,
  accessibilityLabel,
  accessibilityHint,
  accessibilityRole,
}: AccessibilityWrapperProps) {
  const screenReaderEnabled = useScreenReaderEnabled();

  return (
    <View
      accessible={screenReaderEnabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      accessibilityRole={accessibilityRole}>
      {children}
    </View>
  );
}
