import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

type Props = {
  confidence: number;
};

export const ConfidenceBadge: React.FC<Props> = ({ confidence }) => {
  const percentage = Math.round(confidence * 100);
  const color = getConfidenceColor(confidence);

  return (
    <View style={[styles.badge, { backgroundColor: color }]}>
      <Text style={styles.text}>{percentage}%</Text>
    </View>
  );
};

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return '#22C55E';
  if (confidence >= 0.6) return '#F59E0B';
  if (confidence >= 0.4) return '#EF4444';
  return '#6B7280';
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  text: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
