import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Vibration,
  Animated,
  Easing,
} from 'react-native';
import { useTheme } from '@app/providers/ThemeProvider';
import { Card, Button } from '@shared/design-system';
import { useEmergency } from '../hooks/useEmergency';
import { emergencyContactManager } from '@core/emergency';
import { semanticTokens } from '@shared/design-system/theme/semantic';
import { tokens } from '@shared/design-system/theme/tokens';
import { accessibilityEngine } from '@core/accessibility';

type EmergencyView = 'sos' | 'contacts' | 'history' | 'settings';

export const EmergencyScreen: React.FC = () => {
  const { colors } = useTheme();
  const {
    status,
    countdownRemaining,
    countdownTotal,
    contacts,
    contactsNotified,
    contactsFailed,
    smsSent,
    sessionId,
    history,
    gpsCoordinates,
    escalationAttempts,
    isActive,
    startCountdown,
    triggerEmergency,
    cancelEmergency,
    resolveEmergency,
    addContact,
    removeContact,
    escalate,
  } = useEmergency();

  const [activeView, setActiveView] = useState<EmergencyView>('sos');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const initialFocusRef = useRef(true);

  useEffect(() => {
    if (status === 'triggered' || status === 'sending') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();

      const rotate = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      rotate.start();

      if (initialFocusRef.current) {
        accessibilityEngine.announce(
          'Emergency active. Emergency contacts are being notified.',
          'critical',
          true,
        );
        initialFocusRef.current = false;
      }

      return () => {
        pulse.stop();
        rotate.stop();
      };
    }

    if (status === 'idle') {
      initialFocusRef.current = true;
    }
  }, [status, pulseAnim, rotateAnim]);

  const handleSOSPress = useCallback(() => {
    if (status === 'countdown') {
      cancelEmergency();
    } else if (status === 'idle') {
      Vibration.vibrate([0, 100, 50, 100, 50, 100]);
      startCountdown();
    } else if (status === 'triggered' || status === 'sending') {
      cancelEmergency();
    } else if (status === 'resolved' || status === 'cancelled') {
      startCountdown();
    }
  }, [status, startCountdown, cancelEmergency]);

  const handleAddContact = useCallback(() => {
    if (!contactName.trim() || !contactPhone.trim()) return;

    addContact({
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relationship: contactRelation.trim() || 'Other',
      isPrimary: contacts.length === 0,
      notifyOnEmergency: true,
    });

    setContactName('');
    setContactPhone('');
    setContactRelation('');
    accessibilityEngine.announce('Emergency contact added', 'normal');
  }, [contactName, contactPhone, contactRelation, contacts.length, addContact]);

  const handleRemoveContact = useCallback((id: string, name: string) => {
    removeContact(id);
    accessibilityEngine.announce(`${name} removed from emergency contacts`, 'high');
  }, [removeContact]);

  const rotateInterpolation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusColor = () => {
    switch (status) {
      case 'countdown': return semanticTokens.colors.warning.default;
      case 'triggered':
      case 'sending': return semanticTokens.colors.danger.default;
      case 'resolved': return semanticTokens.colors.success.default;
      case 'cancelled': return semanticTokens.colors.neutral.default;
      default: return semanticTokens.colors.primary.default;
    }
  };

  const getStatusLabel = () => {
    switch (status) {
      case 'countdown': return `ACTIVATING IN ${countdownRemaining}s`;
      case 'triggered': return 'EMERGENCY ACTIVE';
      case 'sending': return 'SENDING ALERTS';
      case 'resolved': return 'EMERGENCY RESOLVED';
      case 'cancelled': return 'EMERGENCY CANCELLED';
      case 'idle': return 'READY';
      default: return '';
    }
  };

  const countdownProgress = countdownTotal > 0
    ? countdownRemaining / countdownTotal
    : 0;

  const renderSOSView = () => (
    <View style={styles.sosContainer}>
      <View style={styles.statusBar}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
        <Text style={[styles.statusLabel, { color: getStatusColor() }]}>
          {getStatusLabel()}
        </Text>
      </View>

      {(status === 'triggered' || status === 'sending') && (
        <Animated.View
          style={[
            styles.radarRing,
            { transform: [{ rotate: rotateInterpolation }] },
          ]}
        >
          <Text style={styles.radarText}>SENDING</Text>
        </Animated.View>
      )}

      <Pressable
        style={({ pressed }) => [
          styles.sosButton,
          (status === 'countdown') && styles.sosButtonCountdown,
          (status === 'triggered' || status === 'sending') && styles.sosButtonActive,
          pressed && styles.sosButtonPressed,
        ]}
        onPress={handleSOSPress}
        accessibilityRole="button"
        accessibilityLabel={
          status === 'countdown'
            ? `Cancel emergency. ${countdownRemaining} seconds remaining. Tap to cancel.`
            : status === 'triggered'
              ? 'Emergency active. Tap to cancel.'
              : 'Press to start emergency countdown'
        }
        accessibilityHint={
          status === 'idle'
            ? 'Triple press to activate emergency. You will have 5 seconds to cancel.'
            : undefined
        }
      >
        <Animated.Text
          style={[
            styles.sosText,
            (status === 'triggered' || status === 'sending') && { transform: [{ scale: pulseAnim }] },
          ]}
        >
          {status === 'countdown' ? 'CANCEL' : status === 'triggered' || status === 'sending' ? 'ACTIVE' : 'SOS'}
        </Animated.Text>
        {status === 'countdown' && (
          <Text style={styles.countdownNumber}>{countdownRemaining}</Text>
        )}
        {status === 'countdown' && (
          <View style={styles.progressBarContainer}>
            <View
              style={[
                styles.progressBar,
                { width: `${(1 - countdownProgress) * 100}%` },
              ]}
            />
          </View>
        )}
      </Pressable>

      <Text style={[styles.instruction, { color: semanticTokens.colors.foreground.muted }]}>
        {status === 'idle' && 'Press SOS to start countdown'}
        {status === 'countdown' && 'Tap CANCEL to abort emergency'}
        {status === 'triggered' && 'Emergency alerts are being sent'}
        {status === 'sending' && 'Notifying emergency contacts...'}
        {status === 'resolved' && 'Emergency has been resolved'}
        {status === 'cancelled' && 'Emergency was cancelled'}
      </Text>

      {(status === 'triggered' || status === 'sending') && (
        <View style={styles.emergencyInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Contacts Notified</Text>
            <Text style={styles.infoValue}>{contactsNotified}</Text>
          </View>
          {contactsFailed > 0 && (
            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: semanticTokens.colors.danger.default }]}>
                Failed
              </Text>
              <Text style={[styles.infoValue, { color: semanticTokens.colors.danger.default }]}>
                {contactsFailed}
              </Text>
            </View>
          )}
          {smsSent > 0 && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>SMS Sent</Text>
              <Text style={styles.infoValue}>{smsSent}</Text>
            </View>
          )}
          {gpsCoordinates && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Location Shared</Text>
              <Text style={styles.infoValue}>Yes</Text>
            </View>
          )}
        </View>
      )}

      {(status === 'triggered' || status === 'sending') && (
        <View style={styles.emergencyActions}>
          <Button
            variant="secondary"
            size="md"
            fullWidth
            onPress={escalate}
            accessibilityLabel="Escalate emergency"
          >
            Escalate Emergency
          </Button>
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onPress={resolveEmergency}
            accessibilityLabel="Resolve emergency"
          >
            Mark as Resolved
          </Button>
        </View>
      )}

      {(status === 'resolved' || status === 'cancelled') && (
        <Button
          variant="primary"
          size="md"
          fullWidth
          onPress={handleSOSPress}
          accessibilityLabel="Start new emergency"
        >
          Start New Emergency
        </Button>
      )}

      {contacts.length > 0 && status === 'idle' && (
        <Card variant="outline" padding="md" style={styles.contactsPreview}>
          <Text style={styles.contactsPreviewTitle}>
            {contacts.length} emergency contact{contacts.length !== 1 ? 's' : ''} configured
          </Text>
          {contacts.filter(c => c.notifyOnEmergency).length === 0 && (
            <Text style={styles.warningText}>
              No contacts will be notified. Enable notification in contact settings.
            </Text>
          )}
        </Card>
      )}

      {contacts.length === 0 && status === 'idle' && (
        <Card variant="outline" padding="md" style={styles.contactsPreview}>
          <Text style={styles.warningText}>
            No emergency contacts configured. Add contacts for alerts.
          </Text>
        </Card>
      )}
    </View>
  );

  const renderContactsView = () => (
    <ScrollView style={styles.contactsContainer} nestedScrollEnabled>
      <Text style={styles.sectionTitle}>Emergency Contacts</Text>
      <Text style={styles.sectionSubtitle}>
        These contacts will be notified when emergency is triggered.
      </Text>

      {contacts.length === 0 ? (
        <Card variant="default" padding="md">
          <Text style={{ color: semanticTokens.colors.foreground.muted }}>
            No emergency contacts added yet.
          </Text>
        </Card>
      ) : (
        contacts.map(contact => (
          <Card key={contact.id} variant="default" padding="md" style={styles.contactCard}>
            <View style={styles.contactHeader}>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                {contact.isPrimary && (
                  <View style={styles.primaryBadge}>
                    <Text style={styles.primaryBadgeText}>PRIMARY</Text>
                  </View>
                )}
              </View>
              <Pressable
                style={styles.removeButton}
                onPress={() => handleRemoveContact(contact.id, contact.name)}
                accessibilityLabel={`Remove ${contact.name}`}
                accessibilityRole="button"
              >
                <Text style={styles.removeButtonText}>Remove</Text>
              </Pressable>
            </View>
            <Text style={styles.contactDetail}>📞 {contact.phone}</Text>
            <Text style={styles.contactDetail}>
              {contact.relationship}
              {!contact.notifyOnEmergency && ' (Notifications off)'}
            </Text>
          </Card>
        ))
      )}

      <View style={styles.addContactSection}>
        <Text style={styles.sectionTitle}>Add New Contact</Text>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Name</Text>
          <View style={styles.inputWrapper}>
            <Pressable
              style={styles.inputField}
              onPress={() => {}}
              accessibilityLabel="Contact name"
              accessibilityRole="none"
            >
              <Text
                style={[
                  styles.inputText,
                  !contactName && styles.inputPlaceholder,
                ]}
                onPress={() => {
                  accessibilityEngine.announce('Tap name field to enter text via keyboard', 'normal');
                }}
              >
                {contactName || 'Tap to enter name'}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Phone</Text>
          <View style={styles.inputWrapper}>
            <Pressable
              style={styles.inputField}
              onPress={() => {
                accessibilityEngine.announce('Tap phone field to enter number via keyboard', 'normal');
              }}
              accessibilityLabel="Contact phone number"
            >
              <Text
                style={[
                  styles.inputText,
                  !contactPhone && styles.inputPlaceholder,
                ]}
              >
                {contactPhone || 'Tap to enter phone'}
              </Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Relationship</Text>
          <View style={styles.inputWrapper}>
            <Pressable
              style={styles.inputField}
              onPress={() => {
                accessibilityEngine.announce('Tap relationship field to enter via keyboard', 'normal');
              }}
              accessibilityLabel="Relationship to contact"
            >
              <Text
                style={[
                  styles.inputText,
                  !contactRelation && styles.inputPlaceholder,
                ]}
              >
                {contactRelation || 'Tap to enter relationship'}
              </Text>
            </Pressable>
          </View>
        </View>
        <Button
          variant="primary"
          size="md"
          fullWidth
          onPress={handleAddContact}
          disabled={!contactName.trim() || !contactPhone.trim()}
          accessibilityLabel="Add emergency contact"
        >
          Add Contact
        </Button>
      </View>
    </ScrollView>
  );

  const renderHistoryView = () => (
    <View style={styles.historyContainer}>
      <Text style={styles.sectionTitle}>Emergency History</Text>
      {history.length === 0 ? (
        <Card variant="default" padding="md">
          <Text style={{ color: semanticTokens.colors.foreground.muted }}>
            No emergency history.
          </Text>
        </Card>
      ) : (
        history.map(entry => (
          <Card key={entry.id} variant="default" padding="md" style={styles.historyCard}>
            <Text style={styles.historyStatus}>{entry.status}</Text>
            <Text style={styles.historyTime}>
              {new Date(entry.startedAt).toLocaleString()}
            </Text>
            {entry.contactsNotified > 0 && (
              <Text style={styles.historyDetail}>
                {entry.contactsNotified} contact(s) notified
              </Text>
            )}
            {entry.duration > 0 && (
              <Text style={styles.historyDetail}>
                Duration: {Math.round(entry.duration / 1000)}s
              </Text>
            )}
          </Card>
        ))
      )}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.navTabs}>
        {([
          { key: 'sos', label: 'SOS' },
          { key: 'contacts', label: 'Contacts' },
          { key: 'history', label: 'History' },
        ] as const).map(tab => (
          <Pressable
            key={tab.key}
            style={[
              styles.navTab,
              activeView === tab.key && {
                borderBottomColor: getStatusColor(),
                borderBottomWidth: 2,
              },
            ]}
            onPress={() => {
              setActiveView(tab.key);
              accessibilityEngine.announce(`${tab.label} view`, 'normal');
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeView === tab.key }}
          >
            <Text
              style={[
                styles.navTabText,
                activeView === tab.key && { color: getStatusColor() },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        nestedScrollEnabled
      >
        {activeView === 'sos' && renderSOSView()}
        {activeView === 'contacts' && renderContactsView()}
        {activeView === 'history' && renderHistoryView()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  navTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.border.default,
    backgroundColor: semanticTokens.colors.surface.default,
  },
  navTab: {
    flex: 1,
    paddingVertical: tokens.spacing[3],
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  navTabText: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.muted,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
  },
  sosContainer: {
    alignItems: 'center',
    gap: tokens.spacing[4],
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
    letterSpacing: 1,
  },
  radarRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: semanticTokens.colors.danger.default,
    justifyContent: 'center',
    alignItems: 'center',
    borderStyle: 'dashed',
  },
  radarText: {
    fontSize: 8,
    color: semanticTokens.colors.danger.default,
    fontWeight: tokens.fontWeight.bold,
    letterSpacing: 1,
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
    shadowRadius: 20,
    elevation: 12,
  },
  sosButtonCountdown: {
    backgroundColor: semanticTokens.colors.warning.default,
    shadowColor: semanticTokens.colors.warning.default,
  },
  sosButtonActive: {
    backgroundColor: semanticTokens.colors.background.subtle,
    borderWidth: 3,
    borderColor: semanticTokens.colors.danger.default,
    shadowColor: semanticTokens.colors.danger.default,
  },
  sosButtonPressed: {
    transform: [{ scale: 0.95 }],
  },
  sosText: {
    fontSize: 36,
    fontWeight: tokens.fontWeight.black,
    color: '#FFFFFF',
    letterSpacing: 4,
  },
  countdownNumber: {
    fontSize: 56,
    fontWeight: tokens.fontWeight.black,
    color: '#FFFFFF',
    marginTop: tokens.spacing[1],
  },
  progressBarContainer: {
    position: 'absolute',
    bottom: 40,
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
  },
  instruction: {
    fontSize: semanticTokens.fontSize.base,
    textAlign: 'center',
    paddingHorizontal: tokens.spacing[4],
  },
  emergencyInfo: {
    width: '100%',
    gap: tokens.spacing[2],
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.lg,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  infoValue: {
    fontSize: semanticTokens.fontSize.sm,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  emergencyActions: {
    width: '100%',
    gap: tokens.spacing[3],
  },
  contactsPreview: {
    width: '100%',
  },
  contactsPreviewTitle: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.default,
    fontWeight: tokens.fontWeight.medium,
  },
  warningText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.warning.default,
    marginTop: tokens.spacing[1],
  },
  contactsContainer: {
    flex: 1,
    gap: tokens.spacing[4],
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.xl,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  sectionSubtitle: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginBottom: tokens.spacing[2],
  },
  contactCard: {
    marginBottom: tokens.spacing[2],
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: tokens.spacing[1],
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[2],
  },
  contactName: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  primaryBadge: {
    backgroundColor: semanticTokens.colors.primary.muted,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[0.5],
    borderRadius: semanticTokens.radius.sm,
  },
  primaryBadgeText: {
    fontSize: 10,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.primary.default,
  },
  contactDetail: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[0.5],
  },
  removeButton: {
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
  },
  removeButtonText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.danger.default,
    fontWeight: tokens.fontWeight.medium,
  },
  addContactSection: {
    marginTop: tokens.spacing[6],
    gap: tokens.spacing[3],
  },
  inputGroup: {
    gap: tokens.spacing[1],
  },
  inputLabel: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  inputWrapper: {
    backgroundColor: semanticTokens.colors.surface.default,
    borderRadius: semanticTokens.radius.md,
    borderWidth: 1,
    borderColor: semanticTokens.colors.border.default,
  },
  inputField: {
    padding: tokens.spacing[3],
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  inputText: {
    fontSize: semanticTokens.fontSize.base,
    color: semanticTokens.colors.foreground.default,
  },
  inputPlaceholder: {
    color: semanticTokens.colors.foreground.disabled,
  },
  historyContainer: {
    gap: tokens.spacing[4],
  },
  historyCard: {
    marginBottom: tokens.spacing[2],
  },
  historyStatus: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
    textTransform: 'capitalize',
  },
  historyTime: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[0.5],
  },
  historyDetail: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
    marginTop: tokens.spacing[0.5],
  },
});
