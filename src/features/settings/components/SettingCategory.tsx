import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';

interface SettingCategoryProps {
  icon: string;
  title: string;
  description: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export const SettingCategory: React.FC<SettingCategoryProps> = ({
  icon,
  title,
  description,
  children,
  defaultExpanded = false,
}) => {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const toggleExpanded = () => {
    const next = !expanded;
    setExpanded(next);
    accessibilityEngine.announce(
      `${title} category ${next ? 'expanded' : 'collapsed'}`,
      'low',
    );
  };

  return (
    <View style={styles.container}>
      <Pressable
        onPress={toggleExpanded}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${description}. ${expanded ? 'Expanded' : 'Collapsed'}. Tap to ${expanded ? 'collapse' : 'expand'}.`}
        accessibilityState={{ expanded }}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
          expanded && styles.headerExpanded,
        ]}>
        <Text style={styles.icon}>{icon}</Text>
        <View style={styles.headerInfo}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.subtitle}>{description}</Text>
        </View>
        <Text style={[styles.chevron, expanded && styles.chevronExpanded]}>
          ›
        </Text>
      </Pressable>
      {expanded && <View style={styles.fields}>{children}</View>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: tokens.spacing[2],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
    minHeight: semanticTokens.touchTarget.minimum,
  },
  headerPressed: {
    opacity: 0.85,
  },
  headerExpanded: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  icon: {
    fontSize: 22,
    marginRight: tokens.spacing[3],
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  subtitle: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 1,
  },
  chevron: {
    fontSize: 24,
    color: semanticTokens.colors.foreground.subtle,
    marginLeft: tokens.spacing[2],
  },
  chevronExpanded: {
    transform: [{ rotate: '90deg' }],
  },
  fields: {
    paddingHorizontal: tokens.spacing[2],
    paddingBottom: tokens.spacing[2],
    backgroundColor: semanticTokens.colors.surface.elevated,
    borderBottomLeftRadius: semanticTokens.radius.md,
    borderBottomRightRadius: semanticTokens.radius.md,
    gap: 1,
  },
});
