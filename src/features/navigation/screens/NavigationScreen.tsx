import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Button, Input, Loader, VoiceFeedbackBanner } from '@shared/design-system';
import { useNavigation } from '../hooks/useNavigation';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface NavigationScreenProps {
  navigation?: any;
}

const mockDestinations = [
  { id: '1', name: 'Central Park', address: 'New York, NY' },
  { id: '2', name: 'Grocery Store', address: '123 Main St' },
  { id: '3', name: 'Pharmacy', address: '456 Oak Ave' },
  { id: '4', name: 'Bus Station', address: '789 Transit Rd' },
  { id: '5', name: 'Library', address: '101 Library Ln' },
];

export const NavigationScreen: React.FC<NavigationScreenProps> = () => {
  const { colors } = useTheme();
  const { status, currentInstruction, startNavigation, stopNavigation } = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const isNavigating = status === 'active';

  const filteredDestinations = mockDestinations.filter(
    d =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSelectDestination = (destination: { id: string; name: string }) => {
    setShowResults(false);
    setSearchQuery('');
    startNavigation(destination.name);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Navigate</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Voice-guided navigation
        </Text>
      </View>

      <View style={styles.content}>
        {!isNavigating ? (
          <>
            <Input
              placeholder="Search destination..."
              value={searchQuery}
              onChangeText={text => {
                setSearchQuery(text);
                setShowResults(text.length > 0);
              }}
              rightElement={
                searchQuery.length > 0 ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    onPress={() => {
                      setSearchQuery('');
                      setShowResults(false);
                    }}>
                    Clear
                  </Button>
                ) : undefined
              }
            />

            {showResults && (
              <Card variant="elevated" padding="none" style={styles.resultsCard}>
                <FlatList
                  data={filteredDestinations}
                  keyExtractor={item => item.id}
                  renderItem={({ item }) => (
                    <Button
                      variant="ghost"
                      size="lg"
                      fullWidth
                      onPress={() => handleSelectDestination(item)}
                      style={styles.resultItem}>
                      <View style={styles.resultContent}>
                        <Text style={styles.resultName}>{item.name}</Text>
                        <Text style={styles.resultAddress}>{item.address}</Text>
                      </View>
                    </Button>
                  )}
                  keyboardShouldPersistTaps="handled"
                />
              </Card>
            )}

            <View style={styles.quickDestinations}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                Quick Destinations
              </Text>
              <View style={styles.quickGrid}>
                {['Home', 'Work', 'Pharmacy', 'Store'].map(label => (
                  <Button
                    key={label}
                    variant="outline"
                    size="md"
                    onPress={() => startNavigation(label)}>
                    {label}
                  </Button>
                ))}
              </View>
            </View>

            <Card variant="outline" padding="md">
              <Text style={styles.infoTitle}>How Navigation Works</Text>
              <View style={styles.infoList}>
                <Text style={styles.infoItem}>• Voice-guided turn-by-turn directions</Text>
                <Text style={styles.infoItem}>• Obstacle alerts during navigation</Text>
                <Text style={styles.infoItem}>• Haptic feedback for crossings</Text>
                <Text style={styles.infoItem}>• Works offline with cached maps</Text>
              </View>
            </Card>
          </>
        ) : (
          <View style={styles.navigationView}>
            <View style={styles.navStatus}>
              <Text style={styles.navIcon}>🧭</Text>
              <Text style={styles.navTitle}>Navigation Active</Text>
            </View>

            <Card variant="elevated" padding="lg" style={styles.instructionCard}>
              <Text style={styles.instructionText}>
                {currentInstruction || 'Following route...'}
              </Text>
            </Card>

            <View style={styles.navStats}>
              <View style={styles.navStatItem}>
                <Text style={styles.navStatValue}>1.2 km</Text>
                <Text style={styles.navStatLabel}>Remaining</Text>
              </View>
              <View style={styles.navStatItem}>
                <Text style={styles.navStatValue}>8 min</Text>
                <Text style={styles.navStatLabel}>ETA</Text>
              </View>
            </View>

            <VoiceFeedbackBanner
              message="Navigation started. Follow the voice directions."
              type="info"
              duration={5000}
            />

            <Button variant="danger" size="lg" fullWidth onPress={stopNavigation}>
              Stop Navigation
            </Button>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[1],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.base,
  },
  content: {
    flex: 1,
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  resultsCard: {
    maxHeight: 200,
    marginTop: tokens.spacing[2],
  },
  resultItem: {
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.border.muted,
  },
  resultContent: {
    alignItems: 'flex-start',
    paddingHorizontal: tokens.spacing[2],
  },
  resultName: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  resultAddress: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  quickDestinations: {
    gap: tokens.spacing[3],
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
  },
  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  infoTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  infoList: {
    gap: tokens.spacing[1],
  },
  infoItem: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  navigationView: {
    flex: 1,
    gap: tokens.spacing[6],
  },
  navStatus: {
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  navIcon: {
    fontSize: 64,
  },
  navTitle: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  instructionCard: {
    alignItems: 'center',
  },
  instructionText: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
  },
  navStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  navStatItem: {
    alignItems: 'center',
  },
  navStatValue: {
    fontSize: semanticTokens.fontSize['2xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.primary.default,
  },
  navStatLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
});
