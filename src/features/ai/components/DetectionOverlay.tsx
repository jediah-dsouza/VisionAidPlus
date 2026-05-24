import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { DetectionContract } from '@core/camera/types';
import { DetectionBoundary } from './DetectionBoundary';

type Props = {
  detections?: DetectionContract[];
  visible?: boolean;
};

export const DetectionOverlay: React.FC<Props> = ({ detections = [], visible = true }) => {
  if (!visible) return null;

  return (
    <View style={styles.overlay} pointerEvents="box-none" accessibilityLabel="Detection overlay">
      {detections.map(d => (
        <DetectionBoundary key={d.id} detection={d} />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
  },
});
