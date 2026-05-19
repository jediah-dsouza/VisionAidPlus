import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';
import { Button } from '../Button/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container} accessibilityRole="text">
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text style={styles.title}>{title}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
      {actionLabel && onAction && (
        <View style={styles.actionContainer}>
          <Button variant="primary" size="md" onPress={onAction}>
            {actionLabel}
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[8],
    gap: tokens.spacing[4],
  },
  iconContainer: {
    marginBottom: tokens.spacing[2],
  },
  title: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    textAlign: 'center',
  },
  description: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  actionContainer: {
    marginTop: tokens.spacing[4],
  },
});
