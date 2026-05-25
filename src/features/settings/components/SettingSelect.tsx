import React, { useState, useCallback } from 'react';
import { View, Text, Pressable, Modal, FlatList, StyleSheet } from 'react-native';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import { Button } from '@shared/design-system';
import { accessibilityEngine } from '@core/accessibility/AccessibilityEngine';

interface SettingSelectProps {
  label: string;
  description?: string;
  value: string;
  options: string[];
  onValueChange: (value: string) => void;
  disabled?: boolean;
  formatOption?: (option: string) => string;
}

export const SettingSelect: React.FC<SettingSelectProps> = ({
  label,
  description,
  value,
  options,
  onValueChange,
  disabled = false,
  formatOption,
}) => {
  const [showModal, setShowModal] = useState(false);

  const handlePress = useCallback(() => {
    if (disabled) return;
    accessibilityEngine.announce(`${label}. Select from ${options.length} options.`, 'low');
    setShowModal(true);
  }, [disabled, label, options.length]);

  const handleSelect = useCallback(
    (option: string) => {
      const display = formatOption ? formatOption(option) : option;
      accessibilityEngine.announce(`Selected ${display} for ${label}`, 'low');
      onValueChange(option);
      setShowModal(false);
    },
    [label, onValueChange, formatOption],
  );

  const displayValue = formatOption ? formatOption(value) : value;

  return (
    <>
      <Pressable
        onPress={handlePress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={`${description}. Current value: ${displayValue}. Tap to change.`}
        accessibilityState={{ disabled }}
        style={({ pressed }) => [
          styles.container,
          pressed && !disabled && styles.pressed,
          disabled && styles.disabled,
        ]}>
        <View style={styles.info}>
          <Text style={[styles.label, disabled && styles.labelDisabled]}>
            {label}
          </Text>
          {description ? (
            <Text style={[styles.description, disabled && styles.descriptionDisabled]}>
              {description}
            </Text>
          ) : null}
        </View>
        <View style={styles.valueRow}>
          <Text style={styles.value}>{displayValue}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </Pressable>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
        accessibilityViewIsModal>
        <Pressable
          style={styles.overlay}
          onPress={() => setShowModal(false)}
          accessibilityLabel="Close selection">
          <Pressable style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>{label}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item}
              renderItem={({ item }) => {
                const isSelected = item === value;
                const displayItem = formatOption ? formatOption(item) : item;
                return (
                  <Pressable
                    onPress={() => handleSelect(item)}
                    style={[styles.option, isSelected && styles.optionSelected]}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: isSelected }}>
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}>
                      {displayItem}
                    </Text>
                    {isSelected ? (
                      <Text style={styles.checkmark}>✓</Text>
                    ) : null}
                  </Pressable>
                );
              }}
            />
            <View style={styles.modalActions}>
              <Button variant="ghost" size="md" onPress={() => setShowModal(false)}>
                Cancel
              </Button>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
    minHeight: semanticTokens.touchTarget.minimum,
  },
  pressed: {
    opacity: 0.85,
  },
  disabled: {
    opacity: 0.5,
  },
  info: {
    flex: 1,
    marginRight: tokens.spacing[3],
  },
  label: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  labelDisabled: {
    color: semanticTokens.colors.foreground.subtle,
  },
  description: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: 2,
  },
  descriptionDisabled: {
    color: semanticTokens.colors.foreground.subtle,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  value: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    marginRight: tokens.spacing[2],
  },
  chevron: {
    fontSize: 24,
    color: semanticTokens.colors.foreground.subtle,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[4],
  },
  modalContent: {
    width: '100%',
    maxHeight: '70%',
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.lg,
    padding: tokens.spacing[4],
  },
  modalTitle: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[4],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: tokens.spacing[3],
    paddingHorizontal: tokens.spacing[3],
    borderRadius: semanticTokens.radius.sm,
    minHeight: semanticTokens.touchTarget.minimum,
  },
  optionSelected: {
    backgroundColor: semanticTokens.colors.primary.subtle,
  },
  optionText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
  },
  optionTextSelected: {
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.semibold,
  },
  checkmark: {
    fontSize: 18,
    color: semanticTokens.colors.primary.default,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: tokens.spacing[4],
    paddingTop: tokens.spacing[3],
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.muted,
  },
});
