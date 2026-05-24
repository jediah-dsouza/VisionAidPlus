import React, { useRef, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

type Props = {
  children?: React.ReactNode;
  style?: object;
};

export const CameraView: React.FC<Props> = ({ children, style }) => {
  const viewRef = useRef<View>(null);

  return (
    <View
      ref={viewRef}
      style={[styles.container, style]}
      accessibilityLabel="Camera viewfinder"
      accessibilityRole="adjustable"
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
});
