import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Vibration } from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Button, Modal } from '@shared/design-system';
import { useEmergency } from '../hooks/useEmergency';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';

interface EmergencyScreenProps {
  navigation?: any;
}

export const EmergencyScreen: React.FC<EmergencyScreenProps> = () => {
  const { colors } = useTheme();
  const { status, countdownRemaining, startCountdown, triggerEmergency, cancelEmergency } =
    useEmergency();

  const [showContacts, setShowContacts] = useState(false);

  const isActive = status === 'countdown' || status === 'triggered';
  const isCountdown = status === 'countdown';

  const handleEmergencyPress = () => {
    if (isCountdown) {
      cancelEmergency();
    } else if (status === 'idle') {
      Vibration.vibrate([0, 500, 200, 500, 200, 500]);
      startCountdown();
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'countdown':
        return `Activating in ${countdownRemaining}...`;
      case 'triggered':
        return 'Emergency Activated!';
      case 'sending':
        return 'Notifying contacts...';
      case 'resolved':
        return 'Emergency Resolved';
      case 'cancelled':
        return 'Emergency Cancelled';
      default:
        return 'Tap to activate emergency';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Emergency</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Quick access to emergency services
        </Text>
      </View>

      <View style={styles.content}>
        <Pressable
          style={[styles.sosButton, isActive && styles.sosButtonActive]}
          onPress={handleEmergencyPress}
          accessibilityRole="button"
          accessibilityLabel={isCountdown ? 'Cancel emergency' : 'Activate emergency'}
          accessibilityState={{ selected: isActive }}>
          <Text style={[styles.sosText, isActive && styles.sosTextActive]}>
            {isCountdown ? 'TAP TO CANCEL' : 'SOS'}
          </Text>
          {isCountdown && <Text style={styles.countdownText}>{countdownRemaining}</Text>}
        </Pressable>

        <Text style={[styles.statusText, { color: colors.textSecondary }]}>{getStatusText()}</Text>

        {status === 'idle' && (
          <Card variant="outline" padding="md">
            <Text style={styles.instructionTitle}>How it works:</Text>
            <View style={styles.instructionsList}>
              <Text style={styles.instructionItem}>• Tap SOS button to start countdown</Text>
              <Text style={styles.instructionItem}>• Emergency contacts will be notified</Text>
              <Text style={styles.instructionItem}>• Location shared with emergency contacts</Text>
              <Text style={styles.instructionItem}>• Cancel within countdown period</Text>
            </View>
          </Card>
        )}

        {status === 'triggered' && (
          <View style={styles.emergencyActions}>
            <Button variant="danger" size="lg" fullWidth onPress={() => {}}>
              Call Emergency Services
            </Button>
            <Button variant="secondary" size="lg" fullWidth onPress={() => setShowContacts(true)}>
              View Contacts Notified
            </Button>
          </View>
        )}

        <View style={styles.contactsSection}>
          <View style={styles.contactsHeader}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Emergency Contacts
            </Text>
            <Button variant="ghost" size="sm" onPress={() => setShowContacts(true)}>
              Manage
            </Button>
          </View>

          <Card variant="default" padding="md">
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>👤</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>Jane Doe</Text>
                <Text style={styles.contactRelation}>Primary Contact</Text>
              </View>
            </View>
            <View style={styles.contactItem}>
              <Text style={styles.contactIcon}>👤</Text>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>John Smith</Text>
                <Text style={styles.contactRelation}>Emergency Contact</Text>
              </View>
            </View>
          </Card>
        </View>
      </View>

      <Modal
        visible={showContacts}
        onClose={() => setShowContacts(false)}
        title="Emergency Contacts"
        size="md">
        <View style={styles.contactsModal}>
          <Button variant="primary" size="md" fullWidth onPress={() => setShowContacts(false)}>
            Add New Contact
          </Button>
        </View>
      </Modal>
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
    gap: tokens.spacing[6],
    alignItems: 'center',
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: semanticTokens.colors.danger.default,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: semanticTokens.colors.danger.default,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  sosButtonActive: {
    backgroundColor: semanticTokens.colors.danger.subtle,
    transform: [{ scale: 0.95 }],
  },
  sosText: {
    fontSize: 32,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  sosTextActive: {
    fontSize: 20,
  },
  countdownText: {
    fontSize: 48,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
    marginTop: tokens.spacing[2],
  },
  statusText: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.medium,
    textAlign: 'center',
  },
  instructionTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    marginBottom: tokens.spacing[2],
  },
  instructionsList: {
    gap: tokens.spacing[1],
  },
  instructionItem: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  emergencyActions: {
    width: '100%',
    gap: tokens.spacing[3],
  },
  contactsSection: {
    width: '100%',
    gap: tokens.spacing[3],
  },
  contactsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.semibold,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
  },
  contactIcon: {
    fontSize: 24,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.medium,
    color: semanticTokens.colors.foreground.default,
  },
  contactRelation: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  contactsModal: {
    gap: tokens.spacing[4],
  },
});
