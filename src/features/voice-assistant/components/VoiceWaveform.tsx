import React, { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { WaveformFrame } from '@core/voice-assistant/types';

interface VoiceWaveformProps {
  frames: WaveformFrame[];
  active: boolean;
  height?: number;
  barWidth?: number;
  barGap?: number;
}

const VoiceWaveform: React.FC<VoiceWaveformProps> = memo(({
  frames,
  active,
  height = 40,
  barWidth = 3,
  barGap = 1,
}) => {
  if (!active || frames.length === 0) return null;

  const maxFrames = Math.min(frames.length, 60);
  const recentFrames = frames.slice(-maxFrames);

  return (
    <View
      style={[styles.container, { height }]}
      accessibilityRole="image"
      accessibilityLabel={`Voice waveform with ${recentFrames.length} samples`}
    >
      {recentFrames.map((frame, idx) => {
        const barHeight = Math.max(2, frame.amplitude * height * 0.8);
        return (
          <View
            key={idx}
            style={[
              styles.bar,
              {
                width: barWidth,
                height: barHeight,
                marginRight: barGap,
                opacity: 0.4 + (idx / recentFrames.length) * 0.6,
              },
            ]}
          />
        );
      })}
    </View>
  );
});

VoiceWaveform.displayName = 'VoiceWaveform';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bar: {
    backgroundColor: '#10B981',
    borderRadius: 1,
  },
});

export { VoiceWaveform };
