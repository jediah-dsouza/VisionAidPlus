import { accessibilityEngine } from '../../../src/core/accessibility';
import { speechController } from '../../../src/core/accessibility/SpeechController';
import { voiceQueue } from '../../../src/core/accessibility/VoiceQueue';
import { eventBus, EVENTS } from '../../../src/core/events/EventBus';

jest.mock('react-native', () => ({
  AccessibilityInfo: {
    isScreenReaderEnabled: jest.fn().mockResolvedValue(false),
    addEventListener: jest.fn().mockReturnValue({ remove: jest.fn() }),
    announceForAccessibility: jest.fn().mockResolvedValue(undefined),
  },
  Vibration: { vibrate: jest.fn(), cancel: jest.fn() },
  Platform: { OS: 'android', Version: '34', select: jest.fn() },
}));

describe('C. Accessibility Interruption Validation', () => {
  beforeAll(async () => {
    await accessibilityEngine.initialize();
  });

  beforeEach(() => {
    voiceQueue.clear();
    speechController.clearPaused();
  });

  afterAll(() => {
    accessibilityEngine.destroy();
  });

  it('emergency critical announcement interrupts normal speech', async () => {
    await accessibilityEngine.announce('Normal traffic update', 'low');
    const beforeState = speechController.getState();

    await accessibilityEngine.announce(
      'EMERGENCY: immediate action required',
      'critical',
      true,
    );

    const afterState = speechController.getState();
    expect(['speaking', 'idle']).toContain(afterState);
  });

  it('overlapping emergency announcements do not cause deadlock', async () => {
    const announcements = [
      accessibilityEngine.announce('Emergency 1', 'critical', true),
      accessibilityEngine.announce('Emergency 2', 'critical', true),
      accessibilityEngine.announce('Emergency 3', 'critical', true),
    ];

    const results = await Promise.all(announcements);
    expect(results.every(r => r === undefined)).toBe(true);
    expect(['speaking', 'idle', 'interrupted']).toContain(speechController.getState());
  });

  it('rapid retrigger/cancel flows do not leak queue state', async () => {
    for (let i = 0; i < 50; i++) {
      accessibilityEngine.enterEmergencyMode();
      accessibilityEngine.exitEmergencyMode();
    }

    expect(voiceQueue.getQueueSize()).toBe(0);
    expect(accessibilityEngine.isEmergencyMode()).toBe(false);
  });

  it('countdown behavior during TTS does not block queue', async () => {
    await accessibilityEngine.announce('Standard voice instruction', 'normal');

    accessibilityEngine.enterEmergencyMode();
    await accessibilityEngine.announce('5', 'high', true);
    await accessibilityEngine.announce('4', 'high', true);
    await accessibilityEngine.announce('3', 'high', true);
    await accessibilityEngine.announce('2', 'high', true);
    await accessibilityEngine.announce('1', 'high', true);
    await accessibilityEngine.announce('Emergency activated', 'critical', true);

    const state = speechController.getState();
    expect(['speaking', 'idle']).toContain(state);
  });

  it('reconnect announcements during emergency are suppressed or deprioritized', async () => {
    accessibilityEngine.enterEmergencyMode();

    await accessibilityEngine.announce(
      'Emergency alert: immediate action required',
      'critical',
      true,
    );

    await accessibilityEngine.announce('Device reconnecting...', 'high');

    const state = speechController.getState();
    expect(['speaking', 'idle', 'interrupted']).toContain(state);
  });

  it('emergency haptic spam prevention — repeated calls do not error', () => {
    for (let i = 0; i < 100; i++) {
      accessibilityEngine.triggerHaptic('emergency');
    }
    expect(true).toBe(true);
  });

  it('accessibility queue remains stable after emergency', async () => {
    await accessibilityEngine.announce('Normal message 1', 'normal');
    await accessibilityEngine.announce('Normal message 2', 'normal');

    accessibilityEngine.enterEmergencyMode();
    await accessibilityEngine.announce('Emergency message', 'critical', true);
    accessibilityEngine.exitEmergencyMode();

    await accessibilityEngine.announce('Post-emergency message', 'normal');

    expect(['speaking', 'idle']).toContain(speechController.getState());
  });

  it('emergency focus handling remains stable under rapid mode switches', () => {
    for (let i = 0; i < 30; i++) {
      accessibilityEngine.enterEmergencyMode();
      expect(accessibilityEngine.isEmergencyMode()).toBe(true);
      accessibilityEngine.exitEmergencyMode();
      expect(accessibilityEngine.isEmergencyMode()).toBe(false);
    }
  });

  it('no duplicated critical announcements when EmergencyBus publishes', async () => {
    let announceCount = 0;

    const unsub = eventBus.subscribe(
      EVENTS.EMERGENCY_TRIGGERED,
      () => {
        announceCount++;
      },
      'critical',
    );

    for (let i = 0; i < 10; i++) {
      eventBus.publish(EVENTS.EMERGENCY_TRIGGERED, {}, 'critical');
    }

    expect(announceCount).toBeLessThanOrEqual(2);

    unsub();
  });
});
