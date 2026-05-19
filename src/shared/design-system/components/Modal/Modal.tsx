import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal as RNModal,
  Pressable,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { semanticTokens } from '../../theme/semantic';
import { tokens } from '../../theme/tokens';

interface ModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  closeOnOverlayPress?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'full';
  animationType?: 'none' | 'slide' | 'fade';
}

const sizeStyles = {
  sm: { maxWidth: 320 },
  md: { maxWidth: 400 },
  lg: { maxWidth: 520 },
  full: { maxWidth: undefined },
};

export const Modal: React.FC<ModalProps> = ({
  visible,
  onClose,
  title,
  description,
  children,
  showCloseButton = true,
  closeOnOverlayPress = true,
  size = 'md',
  animationType = 'fade',
}) => {
  const reducedMotion = useReducedMotion();

  const handleOverlayPress = () => {
    if (closeOnOverlayPress) {
      onClose();
    }
  };

  return (
    <RNModal
      visible={visible}
      transparent
      animationType={reducedMotion ? 'none' : animationType}
      onRequestClose={onClose}
      accessibilityViewIsModal>
      <Pressable
        style={styles.overlay}
        onPress={handleOverlayPress}
        accessibilityRole="button"
        accessibilityLabel="Close modal"
        accessibilityState={{ expanded: visible }}>
        <Pressable
          style={[styles.container, sizeStyles[size]]}
          onPress={e => e.stopPropagation()}
          accessibilityRole="button"
          accessibilityLabel={title || 'Modal dialog'}>
          <SafeAreaView style={styles.safeArea}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}>
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  {title && (
                    <Text style={styles.title} accessibilityRole="header">
                      {title}
                    </Text>
                  )}
                  {description && <Text style={styles.description}>{description}</Text>}
                </View>
                {showCloseButton && (
                  <Pressable
                    style={styles.closeButton}
                    onPress={onClose}
                    accessibilityRole="button"
                    accessibilityLabel="Close">
                    <Text style={styles.closeText}>✕</Text>
                  </Pressable>
                )}
              </View>
              <View style={styles.content}>{children}</View>
            </ScrollView>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </RNModal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[4],
  },
  container: {
    width: '100%',
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.modal,
    overflow: 'hidden',
  },
  safeArea: {
    maxHeight: '80%',
  },
  scrollContent: {
    padding: tokens.spacing[6],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: tokens.spacing[4],
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  description: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[2],
  },
  closeButton: {
    width: semanticTokens.touchTarget.minimum,
    height: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: tokens.spacing[2],
  },
  closeText: {
    fontSize: 20,
    color: semanticTokens.colors.foreground.muted,
  },
  content: {
    marginTop: tokens.spacing[2],
  },
});
