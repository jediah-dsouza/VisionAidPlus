import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CameraView } from '../components/CameraView';
import { DetectionOverlay } from '../components/DetectionOverlay';
import { AIStatusIndicator } from '../components/AIStatusIndicator';
import { useCamera } from '../hooks/useCamera';
import { useDetectionStream } from '../hooks/useDetectionStream';

export const AICameraScreen: React.FC = () => {
  const { viewState, startCamera, stopCamera, toggleOverlay } = useCamera();
  const { detections, clear } = useDetectionStream(20);
  const isActive = viewState.sessionState === 'active';

  return (
    <View style={styles.screen}>
      <CameraView>
        <DetectionOverlay detections={detections} visible={viewState.overlayVisible} />
      </CameraView>

      <View style={styles.controls}>
        <AIStatusIndicator state={viewState.sessionState} frameRate={viewState.frameRate} />

        <View style={styles.buttons}>
          <TouchableOpacity
            style={[styles.button, isActive ? styles.buttonStop : styles.buttonStart]}
            onPress={isActive ? stopCamera : startCamera}
            accessibilityLabel={isActive ? 'Stop camera' : 'Start camera'}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{isActive ? 'Stop' : 'Start'}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={toggleOverlay}
            accessibilityLabel={viewState.overlayVisible ? 'Hide overlay' : 'Show overlay'}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>
              {viewState.overlayVisible ? 'Hide Overlay' : 'Show Overlay'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSecondary}
            onPress={clear}
            accessibilityLabel="Clear detections"
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>Clear</Text>
          </TouchableOpacity>
        </View>

        {viewState.error && (
          <Text style={styles.error}>{viewState.error}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    position: 'absolute',
    top: 44,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    gap: 12,
  },
  buttons: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonStart: {
    backgroundColor: '#22C55E',
  },
  buttonStop: {
    backgroundColor: '#EF4444',
  },
  buttonSecondary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  error: {
    color: '#EF4444',
    fontSize: 12,
  },
});
