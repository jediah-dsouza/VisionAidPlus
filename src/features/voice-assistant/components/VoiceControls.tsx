import React, { memo, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface VoiceControlsProps {
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onClear: () => void;
  onToggleMute: () => void;
}

const VoiceControls: React.FC<VoiceControlsProps> = memo(({
  isSpeaking,
  isPaused,
  isMuted,
  onPause,
  onResume,
  onCancel,
  onClear,
  onToggleMute,
}) => {
  return (
    <View style={styles.container} accessibilityRole="toolbar" accessibilityLabel="Voice controls">
      {isSpeaking && !isPaused && (
        <TouchableOpacity
          style={styles.button}
          onPress={onPause}
          accessibilityRole="button"
          accessibilityLabel="Pause speech"
        >
          <Text style={styles.buttonText}>⏸ Pause</Text>
        </TouchableOpacity>
      )}

      {isPaused && (
        <TouchableOpacity
          style={[styles.button, styles.resumeButton]}
          onPress={onResume}
          accessibilityRole="button"
          accessibilityLabel="Resume speech"
        >
          <Text style={styles.buttonText}>▶ Resume</Text>
        </TouchableOpacity>
      )}

      {(isSpeaking || isPaused) && (
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel current speech"
        >
          <Text style={styles.buttonText}>⏹ Cancel</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[styles.button, styles.clearButton]}
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel="Clear speech queue"
      >
        <Text style={styles.buttonText}>🗑 Clear</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, isMuted ? styles.mutedButton : styles.muteButton]}
        onPress={onToggleMute}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Unmute' : 'Mute'}
      >
        <Text style={styles.buttonText}>{isMuted ? '🔇 Unmute' : '🔊 Mute'}</Text>
      </TouchableOpacity>
    </View>
  );
});

VoiceControls.displayName = 'VoiceControls';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
  },
  button: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1F2937',
  },
  buttonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#E5E7EB',
  },
  resumeButton: { backgroundColor: '#065F46' },
  cancelButton: { backgroundColor: '#7F1D1D' },
  clearButton: { backgroundColor: '#374151' },
  muteButton: { backgroundColor: '#1E3A5F' },
  mutedButton: { backgroundColor: '#7F1D1D' },
});

export { VoiceControls };
