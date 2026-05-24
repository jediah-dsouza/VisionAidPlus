import React, { memo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import type { VoiceCommand } from '@core/voice-assistant/types';

interface CommandHistoryListProps {
  commands: VoiceCommand[];
}

const CommandItem: React.FC<{ item: VoiceCommand }> = memo(({ item }) => (
  <View style={styles.item}>
    <Text style={styles.text}>{item.text}</Text>
    <View style={styles.meta}>
      <Text style={styles.timestamp}>
        {new Date(item.timestamp).toLocaleTimeString()}
      </Text>
      <Text style={[
        styles.result,
        item.result === 'success' ? styles.success :
        item.result === 'failed' ? styles.failed :
        styles.pending,
      ]}>
        {item.result ?? 'pending'}
      </Text>
    </View>
  </View>
));

CommandItem.displayName = 'CommandItem';

const CommandHistoryList: React.FC<CommandHistoryListProps> = memo(({ commands }) => {
  if (commands.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No voice commands yet</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={commands}
      keyExtractor={item => item.id}
      renderItem={({ item }) => <CommandItem item={item} />}
      style={styles.list}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
});

CommandHistoryList.displayName = 'CommandHistoryList';

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 8,
  },
  item: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 12,
    marginBottom: 6,
    marginHorizontal: 16,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 4,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timestamp: {
    fontSize: 11,
    color: '#6B7280',
  },
  result: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  success: { color: '#10B981' },
  failed: { color: '#EF4444' },
  pending: { color: '#F59E0B' },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export { CommandHistoryList };
