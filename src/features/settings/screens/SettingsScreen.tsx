import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Switch } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Toggle, Slider, Button, Modal } from '@shared/design-system';
import { useSettings } from '../hooks/useSettings';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface SettingsScreenProps {
  navigation?: any;
}

interface SettingsSectionProps {
  title: string;
  children: React.ReactNode;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
  <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <View style={styles.sectionContent}>{children}</View>
  </View>
);

interface SettingsItemProps {
  label: string;
  description?: string;
  value?: boolean | string | number;
  onToggle?: (value: boolean) => void;
  onPress?: () => void;
  type?: 'toggle' | 'navigation' | 'value';
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  label,
  description,
  value,
  onToggle,
  onPress,
  type = 'navigation',
}) => {
  const content = (
    <View style={styles.item}>
      <View style={styles.itemInfo}>
        <Text style={styles.itemLabel}>{label}</Text>
        {description && <Text style={styles.itemDescription}>{description}</Text>}
      </View>
      {type === 'toggle' && (
        <Switch
          value={value as boolean}
          onValueChange={onToggle}
          trackColor={{
            false: semanticTokens.colors.surface.elevated,
            true: semanticTokens.colors.primary.default,
          }}
          thumbColor="#FFFFFF"
        />
      )}
      {type === 'value' && <Text style={styles.itemValue}>{value as string}</Text>}
      {type === 'navigation' && <Text style={styles.chevron}>›</Text>}
    </View>
  );

  if (onPress && type === 'navigation') {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
        {content}
      </Pressable>
    );
  }

  return content;
};

export const SettingsScreen: React.FC<SettingsScreenProps> = () => {
  const { colors } = useTheme();
  const { settings, updateSetting, resetToDefaults } = useSettings();
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      accessibilityLabel="Settings screen">
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>
      </View>

      <SettingsSection title="Voice & Audio">
        <SettingsItem
          label="Text-to-Speech"
          description="Enable voice announcements"
          value={settings.ttsEnabled}
          onToggle={value => updateSetting('ttsEnabled', value)}
          type="toggle"
        />
        <SettingsItem
          label="Speech Rate"
          description={`${settings.ttsSpeechRate.toFixed(1)}x speed`}
          type="value"
        />
        <SettingsItem
          label="Language"
          description={settings.ttsLanguage}
          type="navigation"
          onPress={() => {}}
        />
      </SettingsSection>

      <SettingsSection title="Accessibility">
        <SettingsItem
          label="High Contrast Mode"
          description="Increase visual contrast"
          value={settings.highContrastMode}
          onToggle={value => updateSetting('highContrastMode', value)}
          type="toggle"
        />
        <SettingsItem
          label="Large Text"
          description="Increase text size throughout the app"
          value={settings.largeText}
          onToggle={value => updateSetting('largeText', value)}
          type="toggle"
        />
        <SettingsItem
          label="Reduced Motion"
          description="Minimize animations and transitions"
          value={settings.reducedMotion}
          onToggle={value => updateSetting('reducedMotion', value)}
          type="toggle"
        />
        <SettingsItem
          label="Haptic Feedback"
          description="Vibration feedback for interactions"
          value={settings.hapticFeedback}
          onToggle={value => updateSetting('hapticFeedback', value)}
          type="toggle"
        />
      </SettingsSection>

      <SettingsSection title="Emergency">
        <SettingsItem
          label="Countdown Duration"
          description={`${settings.emergencyCountdown} seconds`}
          type="value"
        />
        <SettingsItem
          label="Auto Reconnect"
          description="Automatically reconnect to device"
          value={settings.autoReconnect}
          onToggle={value => updateSetting('autoReconnect', value)}
          type="toggle"
        />
      </SettingsSection>

      <SettingsSection title="Privacy">
        <SettingsItem
          label="Analytics"
          description="Share usage data to improve the app"
          value={settings.analyticsEnabled}
          onToggle={value => updateSetting('analyticsEnabled', value)}
          type="toggle"
        />
      </SettingsSection>

      <SettingsSection title="About">
        <SettingsItem label="Version" value="1.0.0" type="value" />
        <SettingsItem label="Terms of Service" type="navigation" onPress={() => {}} />
        <SettingsItem label="Privacy Policy" type="navigation" onPress={() => {}} />
        <SettingsItem label="Open Source Licenses" type="navigation" onPress={() => {}} />
      </SettingsSection>

      <View style={styles.dangerZone}>
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
  content: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[6],
  },
  header: {
    marginBottom: tokens.spacing[2],
  },
  title: {
    fontSize: semanticTokens.fontSize['3xl'],
    fontWeight: tokens.fontWeight.bold,
  },
  section: {
    gap: tokens.spacing[3],
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  sectionContent: {
    gap: tokens.spacing[1],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
    minHeight: semanticTokens.touchTarget.minimum,
  },
  itemInfo: {
    flex: 1,
    marginRight: tokens.spacing[3],
  },
  itemLabel: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  itemDescription: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  itemValue: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
  },
  chevron: {
    fontSize: 24,
    color: semanticTokens.colors.foreground.subtle,
  },
  dangerZone: {
    marginTop: tokens.spacing[4],
    paddingTop: tokens.spacing[4],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.muted,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: tokens.spacing[3],
    marginTop: tokens.spacing[4],
  },
});
