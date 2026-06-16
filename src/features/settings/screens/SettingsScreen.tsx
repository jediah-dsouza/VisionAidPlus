import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Button, Modal } from '@shared/design-system';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import { useSettings } from '../hooks/useSettings';
import { SettingToggle, SettingSlider, SettingSelect, SettingCategory } from '../components';
import { SETTINGS_CATEGORIES } from '../types/categories';
import type { UserPreferences, PreferenceCategory } from '../types';
import type { SettingFieldDefinition } from '../types/categories';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@app/navigation/types/navigation';

export const SettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { preferences, loaded, setPreference, resetToDefaults } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleChange = useCallback(
    (category: PreferenceCategory, key: string, value: unknown) => {
      setPreference(category, key, value);
    },
    [setPreference],
  );

  const renderField = useCallback(
    (field: SettingFieldDefinition) => {
      const currentValue = (preferences[field.category] as unknown as Record<string, unknown>)[
        field.key
      ];

      if (field.dependsOn) {
        const parentValue =
          preferences[field.dependsOn.category][
            field.dependsOn.key as keyof UserPreferences[typeof field.dependsOn.category]
          ];
        if (parentValue !== field.dependsOn.value) {
          return null;
        }
      }

      switch (field.type) {
        case 'toggle':
          return (
            <SettingToggle
              key={`${field.category}_${String(field.key)}`}
              label={field.label}
              description={field.description}
              value={currentValue as boolean}
              onValueChange={v => handleChange(field.category, field.key, v)}
            />
          );

        case 'slider':
          return (
            <SettingSlider
              key={`${field.category}_${String(field.key)}`}
              label={field.label}
              description={field.description}
              value={currentValue as number}
              min={field.min ?? 0}
              max={field.max ?? 100}
              step={field.step ?? 1}
              onValueChange={v => handleChange(field.category, field.key, v)}
            />
          );

        case 'select':
          return (
            <SettingSelect
              key={`${field.category}_${String(field.key)}`}
              label={field.label}
              description={field.description}
              value={currentValue as string}
              options={field.options ?? []}
              onValueChange={v => handleChange(field.category, field.key, v)}
            />
          );

        default:
          return null;
      }
    },
    [preferences, handleChange],
  );

  if (!loaded) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textPrimary }]}>Loading settings...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="Settings screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      {SETTINGS_CATEGORIES.map(category => (
        <SettingCategory
          key={category.id}
          title={category.title}
          description={category.description}>
          {category.fields.map(renderField)}
        </SettingCategory>
      ))}

      <Pressable
        onPress={() => navigation.navigate('Emergency', { screen: 'EmergencyHome' })}
        accessibilityRole="button"
        style={({ pressed }) => [pressed && { opacity: 0.85 }]}>
        <View
          style={styles.safetyInfo}
          accessibilityLabel="Emergency and Safety. Emergency contacts and safety preferences are managed in the Emergency screen.">
          <Text style={styles.safetyTitle}>Emergency & Safety</Text>
          <Text style={styles.safetyDescription}>
            Emergency contacts and safety preferences are managed in the Emergency screen.
          </Text>
        </View>
      </Pressable>

      <View style={styles.resetContainer}>
        <Button variant="danger" size="md" onPress={() => setShowResetConfirm(true)}>
          Reset to Defaults
        </Button>
      </View>

      <Modal
        visible={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        title="Reset Settings"
        description="This will reset all settings to their default values. This action cannot be undone."
        size="sm">
        <View style={styles.modalActions}>
          <Button variant="ghost" size="md" onPress={() => setShowResetConfirm(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            onPress={() => {
              resetToDefaults();
              setShowResetConfirm(false);
            }}>
            Reset
          </Button>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: tokens.spacing[4],
    paddingBottom: tokens.spacing[12],
    gap: tokens.spacing[2],
  },
  header: {
    marginBottom: tokens.spacing[6],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  loadingText: {
    fontSize: semanticTokens.fontSize.lg,
  },
  safetyInfo: {
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
    minHeight: semanticTokens.touchTarget.comfortable,
  },
  safetyTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  safetyDescription: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 1,
  },
  resetContainer: {
    marginTop: tokens.spacing[4],
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing[3],
    marginTop: tokens.spacing[4],
  },
});
