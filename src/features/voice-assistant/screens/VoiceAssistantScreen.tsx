import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useVoiceAssistant } from '../hooks/useVoiceAssistant';
import { VoiceStatusIndicator } from '../components/VoiceStatusIndicator';
import { VoiceWaveform } from '../components/VoiceWaveform';
import { VoiceControls } from '../components/VoiceControls';
import { PushToTalkButton } from '../components/PushToTalkButton';
import { CommandHistoryList } from '../components/CommandHistoryList';

const VoiceAssistantScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const {
    viewState,
    speak,
    pause,
    resume,
    cancelCurrent,
    cancelAll,
    clearQueue,
    setMuted,
    setQuietHours,
    activatePTT,
    deactivatePTT,
    getCommandHistory,
    getMetrics,
  } = useVoiceAssistant();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Assistant</Text>
        <VoiceStatusIndicator
          lifecycle={viewState.lifecycle}
          isMuted={viewState.isMuted}
          queueDepth={viewState.queueDepth}
        />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <VoiceWaveform
          frames={viewState.waveformFrames}
          active={viewState.isSpeaking}
          height={60}
        />

        <VoiceControls
          isSpeaking={viewState.isSpeaking}
          isPaused={viewState.isPaused}
          isMuted={viewState.isMuted}
          onPause={pause}
          onResume={resume}
          onCancel={cancelCurrent}
          onClear={clearQueue}
          onToggleMute={() => setMuted(!viewState.isMuted)}
        />

        <PushToTalkButton
          active={viewState.pttActive}
          level={viewState.pttLevel}
          onActivate={activatePTT}
          onDeactivate={deactivatePTT}
        />

        {viewState.currentSpeech && (
          <View style={styles.currentSpeech}>
            <Text style={styles.speechLabel}>Current Speech</Text>
            <Text style={styles.speechText}>{viewState.currentSpeech.text}</Text>
            <Text style={styles.speechMeta}>
              {viewState.currentSpeech.priority} · {viewState.currentSpeech.category}
            </Text>
          </View>
        )}

        {viewState.metrics && (
          <View style={styles.metrics}>
            <Text style={styles.metricsTitle}>Metrics</Text>
            <View style={styles.metricsGrid}>
              <MetricItem label="Spoken" value={viewState.metrics.totalSpoken} />
              <MetricItem label="Queue" value={viewState.queueDepth} />
              <MetricItem label="Interrupted" value={viewState.metrics.totalInterrupted} />
              <MetricItem label="Failed" value={viewState.metrics.totalFailed} />
              <MetricItem label="Dedup" value={viewState.metrics.totalDuplicatesSuppressed} />
              <MetricItem label="Errors" value={viewState.metrics.errors} />
            </View>
          </View>
        )}

        <View style={styles.historySection}>
          <Text style={styles.historyTitle}>Command History</Text>
          <CommandHistoryList commands={getCommandHistory()} />
        </View>
      </ScrollView>
    </View>
  );
};

const MetricItem: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <View style={styles.metricItem}>
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 32,
  },
  currentSpeech: {
    marginHorizontal: 16,
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  speechLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  speechText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  speechMeta: {
    fontSize: 11,
    color: '#6B7280',
  },
  metrics: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 12,
    backgroundColor: '#1F2937',
    borderRadius: 8,
  },
  metricsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricItem: {
    alignItems: 'center',
    minWidth: 60,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  metricLabel: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 2,
  },
  historySection: {
    marginTop: 16,
    flex: 1,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    marginHorizontal: 16,
    textTransform: 'uppercase',
  },
});

export { VoiceAssistantScreen };
