import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Card, Button } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

export const AlertDetailsScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation();
  const { alertId } = route.params || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Alert Details</Text>
        <Text style={styles.subtitle}>ID: {alertId}</Text>
      </View>
      <Card variant="elevated" padding="md">
        <Text style={styles.placeholder}>Alert details view</Text>
      </Card>
      <Button variant="ghost" size="md" fullWidth onPress={() => navigation.goBack()}>
        Back
      </Button>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
  },
  header: {
    gap: tokens.spacing[1],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
  },
  placeholder: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    padding: tokens.spacing[4],
  },
});
