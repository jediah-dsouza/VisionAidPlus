/**
 * DashboardDevPanel - Main Dev Testing Panel
 *
 * DEV ONLY - NOT INCLUDED IN PRODUCTION
 *
 * A comprehensive development testing panel for Phase 6 dashboard validation.
 * Provides:
 * - Simulation controls for BLE, AI, Emergency, Navigation events
 * - Event console with lifecycle tracking
 * - Validation indicators with pass/fail status
 * - Stress test mode
 * - Realtime metrics
 * - Validation summary
 */

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal } from 'react-native';
import { semanticTokens, tokens } from '@shared/design-system/theme';
import { devSimulationEngine } from './DevSimulationEngine';
import type { SimulationEvent, SimulationMetrics } from './DevSimulationEngine';
import { DevEventConsole } from './DevEventConsole';
import { DevValidationIndicators } from './DevValidationIndicators';
import { DevStressTest } from './DevStressTest';
import { DevMetrics } from './DevMetrics';
import { DevValidationSummary } from './DevValidationSummary';
import { store } from '@app/store';
import { bleActions } from '@app/store/slices/bleSlice';
import { aiActions } from '@app/store/slices/aiSlice';
import { emergencyActions } from '@app/store/slices/emergencySlice';

// ============================================================================
// DEV MODE GUARD
// ============================================================================
if (!__DEV__) {
  console.warn('[DevPanel] DashboardDevPanel is DISABLED in production');
}

// ============================================================================
// TYPES
// ============================================================================
type DevPanelTab = 'simulation' | 'console' | 'validation' | 'stress' | 'metrics' | 'summary';

interface SimulationButton {
  id: string;
  label: string;
  icon: string;
  onPress: () => void;
  variant: 'default' | 'success' | 'warning' | 'danger';
  disabled?: boolean;
}

// ============================================================================
// SIMULATION BUTTONS DATA
// ============================================================================
const createSimulationButtons = (): SimulationButton[] => [
  // BLE Events
  {
    id: 'ble-connect',
    label: 'BLE Connect',
    icon: '📱',
    onPress: () => {
      console.log('[DevPanel] 🔘 BUTTON PRESSED: BLE Connect');
      devSimulationEngine.simulateBLEConnect();
    },
    variant: 'success',
  },
  {
    id: 'ble-disconnect',
    label: 'BLE Disconnect',
    icon: '📴',
    onPress: () => {
      console.log('[DevPanel] 🔘 BUTTON PRESSED: BLE Disconnect');
      devSimulationEngine.simulateBLEDisconnect();
    },
    variant: 'default',
  },
  {
    id: 'ble-low-battery',
    label: 'BLE Low Battery',
    icon: '🔋',
    onPress: () => devSimulationEngine.simulateBLELowBattery(),
    variant: 'warning',
  },
  {
    id: 'ble-signal-weak',
    label: 'BLE Weak Signal',
    icon: '📶',
    onPress: () => devSimulationEngine.simulateBLESignalWeak(),
    variant: 'warning',
  },

  // AI Events
  {
    id: 'ai-obstacle',
    label: 'AI Obstacle',
    icon: '🚶',
    onPress: () => devSimulationEngine.simulateAIObstacle(),
    variant: 'default',
  },
  {
    id: 'ai-danger',
    label: 'AI Danger',
    icon: '⚠️',
    onPress: () => devSimulationEngine.simulateAIDanger(),
    variant: 'danger',
  },
  {
    id: 'ai-warning',
    label: 'AI Warning',
    icon: '⚡',
    onPress: () => devSimulationEngine.simulateAIWarning(),
    variant: 'warning',
  },
  {
    id: 'ai-clear',
    label: 'AI Clear',
    icon: '✅',
    onPress: () => devSimulationEngine.simulateAISafe(),
    variant: 'success',
  },

  // Emergency Events
  {
    id: 'emergency-trigger',
    label: 'Emergency',
    icon: '🚨',
    onPress: () => devSimulationEngine.simulateEmergencyTriggered(),
    variant: 'danger',
  },
  {
    id: 'emergency-cancel',
    label: 'Cancel Emergency',
    icon: '✕',
    onPress: () => devSimulationEngine.simulateEmergencyCancelled(),
    variant: 'default',
  },

  // Navigation Events
  {
    id: 'nav-start',
    label: 'Nav Start',
    icon: '🧭',
    onPress: () => devSimulationEngine.simulateNavigationStarted(),
    variant: 'success',
  },
  {
    id: 'nav-stop',
    label: 'Nav Stop',
    icon: '⏹',
    onPress: () => devSimulationEngine.simulateNavigationStopped(),
    variant: 'default',
  },
];

// ============================================================================
// SIMULATION SECTION COMPONENT
// ============================================================================
const SimulationSection: React.FC = () => {
  const buttons = createSimulationButtons();

  const getButtonStyle = (variant: SimulationButton['variant']) => {
    switch (variant) {
      case 'success':
        return { backgroundColor: semanticTokens.colors.success.muted };
      case 'warning':
        return { backgroundColor: semanticTokens.colors.warning.muted };
      case 'danger':
        return { backgroundColor: semanticTokens.colors.danger.muted };
      default:
        return { backgroundColor: semanticTokens.colors.surface.elevated };
    }
  };

  const getTextColor = (variant: SimulationButton['variant']) => {
    switch (variant) {
      case 'success':
        return semanticTokens.colors.success.default;
      case 'warning':
        return semanticTokens.colors.warning.default;
      case 'danger':
        return semanticTokens.colors.danger.default;
      default:
        return semanticTokens.colors.foreground.default;
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>🎮 Simulation Controls</Text>
      <View style={styles.buttonGrid}>
        {buttons.map(button => (
          <Pressable
            key={button.id}
            style={[styles.simulationButton, getButtonStyle(button.variant)]}
            onPress={button.onPress}
            disabled={button.disabled}
            accessibilityRole="button"
            accessibilityLabel={button.label}>
            <Text style={styles.buttonIcon}>{button.icon}</Text>
            <Text style={[styles.buttonLabel, { color: getTextColor(button.variant) }]}>
              {button.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.customSimulations}>
        <Text style={styles.subSectionTitle}>Custom AI Obstacle</Text>
        <View style={styles.customSimRow}>
          <Pressable
            style={[
              styles.customSimButton,
              { backgroundColor: semanticTokens.colors.primary.muted },
            ]}
            onPress={() => devSimulationEngine.simulateAIObstacle('left', 100)}
            accessibilityLabel="Simulate obstacle on left">
            <Text style={styles.customSimText}>Left (100cm)</Text>
          </Pressable>
          <Pressable
            style={[
              styles.customSimButton,
              { backgroundColor: semanticTokens.colors.primary.muted },
            ]}
            onPress={() => devSimulationEngine.simulateAIObstacle('center', 50)}
            accessibilityLabel="Simulate obstacle in center">
            <Text style={styles.customSimText}>Center (50cm)</Text>
          </Pressable>
          <Pressable
            style={[
              styles.customSimButton,
              { backgroundColor: semanticTokens.colors.primary.muted },
            ]}
            onPress={() => devSimulationEngine.simulateAIObstacle('right', 200)}
            accessibilityLabel="Simulate obstacle on right">
            <Text style={styles.customSimText}>Right (200cm)</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.debugSection}>
        <Text style={styles.subSectionTitle}>🔧 Force Redux Dispatch (Bypass EventBus)</Text>
        <View style={styles.debugRow}>
          <Pressable
            style={[styles.debugButton, { backgroundColor: semanticTokens.colors.success.muted }]}
            onPress={() => {
              console.log('[DevPanel] 🔧 FORCE DISPATCH: BLE Connected');
              store.dispatch(bleActions.setStatus('connected'));
              store.dispatch(bleActions.setConnectedDevice('force-test-device'));
              console.log('[DevPanel] State after dispatch:', store.getState().ble);
            }}
            accessibilityLabel="Force BLE Connected">
            <Text style={styles.debugButtonText}>Force BLE Connected</Text>
          </Pressable>
          <Pressable
            style={[styles.debugButton, { backgroundColor: semanticTokens.colors.danger.muted }]}
            onPress={() => {
              console.log('[DevPanel] 🔧 FORCE DISPATCH: BLE Disconnected');
              store.dispatch(bleActions.setStatus('disconnected'));
              store.dispatch(bleActions.setConnectedDevice(null));
              console.log('[DevPanel] State after dispatch:', store.getState().ble);
            }}
            accessibilityLabel="Force BLE Disconnected">
            <Text style={styles.debugButtonText}>Force BLE Disconnected</Text>
          </Pressable>
        </View>
        <View style={styles.debugRow}>
          <Pressable
            style={[styles.debugButton, { backgroundColor: semanticTokens.colors.warning.muted }]}
            onPress={() => {
              console.log('[DevPanel] 🔧 FORCE DISPATCH: AI Obstacle');
              store.dispatch(aiActions.setStatus('detecting'));
              store.dispatch(aiActions.setCurrentObstacle({
                type: 'person',
                distance: 150,
                direction: 'center' as const,
                severity: 'caution' as const,
                voiceInstruction: 'Obstacle ahead',
                timestamp: new Date().toISOString(),
              }));
            }}
            accessibilityLabel="Force AI Obstacle">
            <Text style={styles.debugButtonText}>Force AI Obstacle</Text>
          </Pressable>
          <Pressable
            style={[styles.debugButton, { backgroundColor: semanticTokens.colors.danger.muted }]}
            onPress={() => {
              console.log('[DevPanel] 🔧 FORCE DISPATCH: Emergency');
              store.dispatch(emergencyActions.startCountdown(5));
            }}
            accessibilityLabel="Force Emergency">
            <Text style={styles.debugButtonText}>Force Emergency</Text>
          </Pressable>
        </View>
        <Pressable
          style={[styles.debugButton, { backgroundColor: semanticTokens.colors.neutral[700] }]}
          onPress={() => {
            console.log('[DevPanel] Current Redux State:', JSON.stringify(store.getState(), null, 2));
          }}
          accessibilityLabel="Log Redux State">
          <Text style={styles.debugButtonText}>📋 Log Redux State</Text>
        </Pressable>
      </View>
    </View>
  );
};

// ============================================================================
// MAIN DASHBOARD DEV PANEL COMPONENT
// ============================================================================
interface DashboardDevPanelProps {
  initialVisible?: boolean;
}

export const DashboardDevPanel: React.FC<DashboardDevPanelProps> = ({ initialVisible = true }) => {
  const [isVisible, setIsVisible] = useState(initialVisible);
  const [activeTab, setActiveTab] = useState<DevPanelTab>('simulation');
  const [events, setEvents] = useState<SimulationEvent[]>([]);
  const [metrics, setMetrics] = useState<SimulationMetrics>({
    totalEvents: 0,
    droppedEvents: 0,
    averageLatency: 0,
    activeListeners: 0,
    renderCount: 0,
    lastEventTime: null,
  });

  // Update events and metrics from simulation engine
  useEffect(() => {
    const intervalId = setInterval(() => {
      setEvents(devSimulationEngine.getEventLog());
      setMetrics(devSimulationEngine.getMetrics());
      devSimulationEngine.incrementRenderCount();
    }, 200);

    return () => clearInterval(intervalId);
  }, []);

  const handleClearLog = useCallback(() => {
    devSimulationEngine.clearEventLog();
  }, []);

  const handleRerunTests = useCallback(() => {
    console.log('[DevPanel] Rerunning validation tests');
  }, []);

  const tabs = [
    { key: 'simulation', label: '🎮', title: 'Simulate' },
    { key: 'console', label: '📋', title: 'Console' },
    { key: 'validation', label: '✅', title: 'Validate' },
    { key: 'stress', label: '🚀', title: 'Stress' },
    { key: 'metrics', label: '📊', title: 'Metrics' },
    { key: 'summary', label: '📝', title: 'Summary' },
  ] as const;

  if (!isVisible) {
    return (
      <Pressable
        style={styles.toggleButton}
        onPress={() => setIsVisible(true)}
        accessibilityRole="button"
        accessibilityLabel="Open dev panel">
        <Text style={styles.toggleButtonText}>🧪 DEV</Text>
      </Pressable>
    );
  }

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setIsVisible(false)}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>🧪 Dashboard Dev Panel</Text>
          <View style={styles.headerActions}>
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DEV ONLY</Text>
            </View>
            <Pressable
              style={styles.closeButton}
              onPress={() => setIsVisible(false)}
              accessibilityRole="button"
              accessibilityLabel="Close dev panel">
              <Text style={styles.closeButtonText}>✕</Text>
            </Pressable>
          </View>
        </View>

        {/* Tab Bar */}
        <View style={styles.tabBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {tabs.map(tab => (
              <Pressable
                key={tab.key}
                style={[styles.tab, activeTab === tab.key && styles.tabActive]}
                onPress={() => setActiveTab(tab.key)}
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === tab.key }}>
                <Text style={[styles.tabLabel, activeTab === tab.key && styles.tabLabelActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {activeTab === 'simulation' && <SimulationSection />}
          {activeTab === 'console' && <DevEventConsole events={events} onClear={handleClearLog} />}
          {activeTab === 'validation' && (
            <DevValidationIndicators onRunValidation={handleRerunTests} />
          )}
          {activeTab === 'stress' && <DevStressTest onMetricsUpdate={setMetrics} />}
          {activeTab === 'metrics' && <DevMetrics autoRefresh={true} refreshInterval={1000} />}
          {activeTab === 'summary' && (
            <DevValidationSummary events={events} onRerunTests={handleRerunTests} />
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Events: {metrics.totalEvents} | Latency: {metrics.averageLatency.toFixed(1)}ms
          </Text>
        </View>
      </View>
    </Modal>
  );
};

// ============================================================================
// STYLES
// ============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: semanticTokens.colors.background.default,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.surface.default,
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.border.default,
  },
  headerTitle: {
    fontSize: semanticTokens.fontSize.lg,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.foreground.default,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tokens.spacing[3],
  },
  devBadge: {
    backgroundColor: semanticTokens.colors.primary.muted,
    paddingHorizontal: tokens.spacing[2],
    paddingVertical: tokens.spacing[1],
    borderRadius: semanticTokens.radius.md,
  },
  devBadgeText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
    color: semanticTokens.colors.primary.default,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: semanticTokens.colors.surface.elevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: semanticTokens.colors.foreground.default,
  },
  tabBar: {
    backgroundColor: semanticTokens.colors.surface.default,
    borderBottomWidth: 1,
    borderBottomColor: semanticTokens.colors.border.default,
  },
  tab: {
    paddingHorizontal: tokens.spacing[4],
    paddingVertical: tokens.spacing[3],
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: semanticTokens.colors.primary.default,
  },
  tabLabel: {
    fontSize: 18,
    color: semanticTokens.colors.foreground.muted,
  },
  tabLabelActive: {
    color: semanticTokens.colors.primary.default,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: tokens.spacing[4],
    gap: tokens.spacing[4],
    paddingBottom: tokens.spacing[8],
  },
  footer: {
    padding: tokens.spacing[3],
    backgroundColor: semanticTokens.colors.surface.default,
    borderTopWidth: 1,
    borderTopColor: semanticTokens.colors.border.default,
  },
  footerText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.foreground.muted,
    textAlign: 'center',
    fontFamily: 'monospace',
  },
  section: {
    gap: tokens.spacing[4],
  },
  sectionTitle: {
    fontSize: semanticTokens.fontSize.base,
    fontWeight: tokens.fontWeight.semibold,
    color: semanticTokens.colors.foreground.default,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tokens.spacing[2],
  },
  simulationButton: {
    width: '30%',
    aspectRatio: 1,
    borderRadius: semanticTokens.radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    padding: tokens.spacing[2],
    minHeight: semanticTokens.touchTarget.minimum,
  },
  buttonIcon: {
    fontSize: 20,
    marginBottom: tokens.spacing[1],
  },
  buttonLabel: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.medium,
    textAlign: 'center',
  },
  customSimulations: {
    marginTop: tokens.spacing[2],
    gap: tokens.spacing[2],
  },
  subSectionTitle: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.muted,
  },
  customSimRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  customSimButton: {
    flex: 1,
    padding: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    alignItems: 'center',
    minHeight: semanticTokens.touchTarget.minimum,
    justifyContent: 'center',
  },
  customSimText: {
    fontSize: semanticTokens.fontSize.xs,
    color: semanticTokens.colors.primary.default,
    fontWeight: tokens.fontWeight.medium,
  },
  debugSection: {
    marginTop: tokens.spacing[4],
    gap: tokens.spacing[2],
  },
  debugRow: {
    flexDirection: 'row',
    gap: tokens.spacing[2],
  },
  debugButton: {
    flex: 1,
    padding: tokens.spacing[3],
    borderRadius: semanticTokens.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: semanticTokens.touchTarget.minimum,
  },
  debugButtonText: {
    fontSize: semanticTokens.fontSize.sm,
    color: semanticTokens.colors.foreground.default,
    fontWeight: tokens.fontWeight.semibold,
  },
  toggleButton: {
    position: 'absolute',
    top: tokens.spacing[4],
    right: tokens.spacing[4],
    backgroundColor: semanticTokens.colors.primary.default,
    paddingHorizontal: tokens.spacing[3],
    paddingVertical: tokens.spacing[2],
    borderRadius: semanticTokens.radius.md,
    zIndex: 100,
  },
  toggleButtonText: {
    fontSize: semanticTokens.fontSize.xs,
    fontWeight: tokens.fontWeight.bold,
    color: '#FFFFFF',
  },
});
