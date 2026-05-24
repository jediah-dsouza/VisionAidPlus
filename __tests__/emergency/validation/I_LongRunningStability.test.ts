import { EmergencyStateMachine, emergencyStateMachine } from '../../../src/core/emergency/EmergencyStateMachine';
import { EmergencyCountdownManager, emergencyCountdownManager } from '../../../src/core/emergency/EmergencyCountdownManager';
import { EmergencyManager } from '../../../src/core/emergency/EmergencyManager';
import { EmergencyContactManager } from '../../../src/core/emergency/EmergencyContactManager';
import { EmergencySMSPipeline } from '../../../src/core/emergency/EmergencySMSPipeline';
import { eventBus } from '../../../src/core/events/EventBus';

jest.mock('../../../src/core/accessibility', () => ({
  accessibilityEngine: {
    enterEmergencyMode: jest.fn(),
    exitEmergencyMode: jest.fn(),
    announce: jest.fn(),
    triggerHaptic: jest.fn(),
    isEmergencyMode: jest.fn().mockReturnValue(false),
  },
}));

const getBaselineSubCount = (): number => {
  const subs = (eventBus as any).subscriptions;
  return subs ? subs.size : 0;
};

const waitForSMS = () => new Promise<void>(r => setTimeout(r, 800));

describe('I. Long-Running Stability Validation', () => {
  describe('extended emergency/recovery loops', () => {
    let manager: EmergencyManager;

    beforeEach(() => {
      jest.useFakeTimers();
      emergencyStateMachine.reset();
      emergencyCountdownManager.reset();
      manager = new EmergencyManager({
        recoveryTimeoutMs: 50,
        autoPrepareGPS: false,
        autoSendSMS: false,
      });
      manager.initialize();
    });

    afterEach(() => {
      manager.destroy();
      emergencyStateMachine.reset();
      emergencyCountdownManager.reset();
      jest.useRealTimers();
    });

    it('100 complete emergency→recovery cycles without degradation', () => {
      for (let cycle = 0; cycle < 100; cycle++) {
        expect(manager.startCountdown(1)).toBe(true);
        jest.advanceTimersByTime(1000);
        expect(manager.status).toBe('triggered');
        expect(manager.resolveEmergency()).toBe(true);
        jest.advanceTimersByTime(50);
        expect(manager.status).toBe('idle');
      }
      expect(manager.isActive).toBe(false);
      expect(manager.getSession()).toBeNull();
    });

    it('50 countdown→cancel→recovery loops', () => {
      for (let cycle = 0; cycle < 50; cycle++) {
        expect(manager.startCountdown(1)).toBe(true);
        jest.advanceTimersByTime(500);
        expect(manager.cancelEmergency()).toBe(true);
        jest.advanceTimersByTime(50);
        expect(manager.status).toBe('idle');
      }
    });

    it('30 cancel from triggered loops', () => {
      for (let cycle = 0; cycle < 30; cycle++) {
        expect(manager.startCountdown(1)).toBe(true);
        jest.advanceTimersByTime(1000);
        expect(manager.status).toBe('triggered');
        expect(manager.cancelEmergency()).toBe(true);
        jest.advanceTimersByTime(50);
        expect(manager.status).toBe('idle');
      }
      expect(manager.isActive).toBe(false);
    });
  });

  describe('repeated escalation cycles', () => {
    let manager: EmergencyManager;

    beforeEach(() => {
      jest.useFakeTimers();
      emergencyStateMachine.reset();
      emergencyCountdownManager.reset();
      manager = new EmergencyManager({
        recoveryTimeoutMs: 50,
        escalatedBackoffMs: 100,
        autoPrepareGPS: false,
        autoSendSMS: false,
      });
      manager.initialize();
    });

    afterEach(() => {
      manager.destroy();
      emergencyStateMachine.reset();
      emergencyCountdownManager.reset();
      jest.useRealTimers();
    });

    it('20 escalation→resolve cycles', () => {
      for (let cycle = 0; cycle < 20; cycle++) {
        expect(manager.startCountdown(1)).toBe(true);
        jest.advanceTimersByTime(1000);

        expect(manager.status).toBe('triggered');
        expect(manager.escalate()).toBe(true);
        expect(manager.status).toBe('escalating');

        expect(manager.resolveEmergency()).toBe(true);
        jest.advanceTimersByTime(50);
        expect(manager.status).toBe('idle');
      }
    });
  });

  describe('contact manager stability', () => {
    let cm: EmergencyContactManager;

    beforeEach(() => {
      cm = new EmergencyContactManager();
    });

    afterEach(() => {
      cm.destroy();
    });

    it('500 contact add/remove operations', async () => {
      for (let i = 0; i < 500; i++) {
        const c = await cm.addContact({
          name: `User ${i}`,
          phone: `+1-555-${String(i).padStart(4, '0')}`,
          relationship: 'Friend',
          isPrimary: i === 0,
          notifyOnEmergency: i % 2 === 0,
        });
        if (i % 2 === 1) {
          await cm.removeContact(c.id);
        }
      }
      expect(cm.count()).toBe(250);
    });
  });

  describe('SMS pipeline stability', () => {
    let sms: EmergencySMSPipeline;

    beforeEach(() => {
      sms = new EmergencySMSPipeline({
        maxRetriesPerContact: 0,
        retryBackoffMs: 5,
        maxBatchSize: 5,
        sendingTimeout: 2000,
      });
    });

    afterEach(() => {
      sms.destroy();
    });

    it('20 batch sends to 5 contacts each', async () => {
      for (let batch = 0; batch < 20; batch++) {
        const contacts = Array.from({ length: 5 }, (_, i) => ({
          id: `contact-${batch}-${i}`,
          name: `User ${batch}-${i}`,
          phone: `+1-555-${String(batch * 5 + i).padStart(4, '0')}`,
          relationship: 'Friend',
          isPrimary: i === 0,
          notifyOnEmergency: true,
        }));

        await sms.sendEmergencyAlerts(contacts, null);
      }

      await waitForSMS();
      const sent = sms.getSentMessages();
      expect(sent.length).toBeGreaterThan(0);
    });
  });

  describe('EventBus stability under sustained load', () => {
    beforeEach(() => {
      eventBus.clearQueue();
      eventBus.clearThrottleCache();
    });

    it('EventBus handles 1000 publishes without crashing', () => {
      for (let i = 0; i < 1000; i++) {
        eventBus.publish(`EVENT_${i % 10}`, { index: i }, 'low');
      }

      const queue = eventBus.getQueue();
      expect(queue.length).toBeLessThanOrEqual(100);
    });

    it('EventBus subscriber count stable after 200 sub/unsub cycles', () => {
      const initialSize = getBaselineSubCount();

      for (let i = 0; i < 200; i++) {
        const handler = jest.fn();
        const unsub = eventBus.subscribe(`DYNAMIC_EVENT_${i % 5}`, handler, 'normal');
        eventBus.publish(`DYNAMIC_EVENT_${i % 5}`, { i }, 'normal');
        unsub();
      }

      const finalSize = getBaselineSubCount();
      expect(finalSize).toBe(initialSize);
    });

    it('EventBus no memory leak with repeated emergency subscriptions', () => {
      const initialSize = getBaselineSubCount();

      const unsubs: Array<() => void> = [];
      for (let i = 0; i < 50; i++) {
        unsubs.push(
          eventBus.subscribe('EMERGENCY_TEST', jest.fn(), 'critical'),
        );
      }
      unsubs.forEach(u => u());

      const finalSize = getBaselineSubCount();
      expect(finalSize).toBe(initialSize);
    });
  });

  describe('state machine resilience', () => {
    it('state machine handles 500 transitions without error', () => {
      const sm = new EmergencyStateMachine();
      for (let i = 0; i < 500; i++) {
        sm.send('FORCE_RESET');
        sm.send('START_COUNTDOWN');
        sm.send('CANCEL_EMERGENCY');
      }
      expect(sm.currentStatus).toBe('cancelled');
      sm.destroy();
    });

    it('countdown manager handles 200 start/destroy cycles', () => {
      for (let i = 0; i < 200; i++) {
        const cd = new EmergencyCountdownManager({ defaultDuration: 1 });
        cd.start(1);
        cd.destroy();
      }
      expect(true).toBe(true);
    });
  });
});
