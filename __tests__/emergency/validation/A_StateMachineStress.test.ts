import { EmergencyStateMachine } from '../../../src/core/emergency/EmergencyStateMachine';

describe('A. Emergency State Machine Stress Validation', () => {
  let sm: EmergencyStateMachine;

  beforeEach(() => { sm = new EmergencyStateMachine(); });
  afterEach(() => { sm.destroy(); });

  it('handles rapid SOS trigger spam (100 rapid START_COUNTDOWN)', () => {
    for (let i = 0; i < 100; i++) {
      sm.send('START_COUNTDOWN');
      sm.send('CANCEL_EMERGENCY');
    }
    expect(sm.currentStatus).toBe('cancelled');
    expect(sm.transitionHistory.length).toBeLessThanOrEqual(50);
  });

  it('duplicate START_COUNTDOWN events are rejected', () => {
    expect(sm.send('START_COUNTDOWN')).toBe(true);
    expect(sm.currentStatus).toBe('countdown');

    for (let i = 0; i < 50; i++) {
      expect(sm.send('START_COUNTDOWN')).toBe(false);
    }
    expect(sm.currentStatus).toBe('countdown');
  });

  it('repeated CANCEL_EMERGENCY spam does not cascade', () => {
    sm.send('START_COUNTDOWN');
    expect(sm.send('CANCEL_EMERGENCY')).toBe(true);
    expect(sm.currentStatus).toBe('cancelled');

    for (let i = 0; i < 100; i++) {
      const result = sm.send('CANCEL_EMERGENCY');
      expect(result).toBe(false);
    }
    expect(sm.currentStatus).toBe('cancelled');
  });

  it('invalid transition attempts never mutate state', () => {
    const invalidPairs: Array<[string, string]> = [
      ['COUNTDOWN_EXPIRED', 'idle'],
      ['SEND_STARTED', 'idle'],
      ['CONFIRM_EMERGENCY', 'idle'],
      ['RESOLVE', 'idle'],
      ['RECOVERY_TIMEOUT', 'idle'],
      ['ESCALATE', 'idle'],
    ];

    for (const [event] of invalidPairs) {
      const before = sm.currentStatus;
      const result = sm.send(event as any);
      expect(result).toBe(false);
      expect(sm.currentStatus).toBe(before);
    }
  });

  it('simultaneous RESOLVE + CANCEL — one wins deterministically', () => {
    sm.send('START_COUNTDOWN');
    sm.send('COUNTDOWN_EXPIRED');

    const resolveResult = sm.send('RESOLVE');
    expect(resolveResult).toBe(true);
    expect(sm.currentStatus).toBe('resolved');

    const cancelAfterResolve = sm.send('CANCEL_EMERGENCY');
    expect(cancelAfterResolve).toBe(false);
  });

  it('force reset from any state works', () => {
    const states: Array<() => void> = [
      () => {},
      () => sm.send('START_COUNTDOWN'),
      () => { sm.send('START_COUNTDOWN'); sm.send('COUNTDOWN_EXPIRED'); },
      () => { sm.send('START_COUNTDOWN'); sm.send('COUNTDOWN_EXPIRED'); sm.send('SEND_STARTED'); },
      () => { sm.send('START_COUNTDOWN'); sm.send('COUNTDOWN_EXPIRED'); sm.send('SEND_STARTED'); sm.send('ESCALATE'); },
      () => { sm.send('START_COUNTDOWN'); sm.send('COUNTDOWN_EXPIRED'); sm.send('RESOLVE'); },
      () => { sm.send('START_COUNTDOWN'); sm.send('CANCEL_EMERGENCY'); },
    ];

    for (const setup of states) {
      setup();
      expect(sm.send('FORCE_RESET')).toBe(true);
      expect(sm.currentStatus).toBe('idle');
      expect(sm.isActive).toBe(false);
    }
  });

  it('repeated emergency sessions maintain consistency', () => {
    for (let cycle = 0; cycle < 50; cycle++) {
      expect(sm.currentStatus).toBe('idle');

      expect(sm.send('START_COUNTDOWN')).toBe(true);
      expect(sm.currentStatus).toBe('countdown');
      expect(sm.isActive).toBe(true);

      expect(sm.send('COUNTDOWN_EXPIRED')).toBe(true);
      expect(sm.currentStatus).toBe('triggered');

      expect(sm.send('RESOLVE')).toBe(true);
      expect(sm.currentStatus).toBe('resolved');

      expect(sm.send('RECOVERY_TIMEOUT')).toBe(true);
      expect(sm.currentStatus).toBe('idle');
    }
  });

  it('stale emergency state recovery — can restart from cancelled', () => {
    sm.send('START_COUNTDOWN');
    sm.send('CANCEL_EMERGENCY');
    expect(sm.currentStatus).toBe('cancelled');

    expect(sm.send('START_COUNTDOWN')).toBe(true);
    expect(sm.currentStatus).toBe('countdown');
  });

  it('no orphaned countdowns — state machine does not hold timers', () => {
    const listener = { onEnter: jest.fn(), onExit: jest.fn() };
    const unsub = sm.addListener(listener);

    sm.send('START_COUNTDOWN');
    sm.send('CANCEL_EMERGENCY');

    const enterCalls = listener.onEnter.mock.calls.length;
    const exitCalls = listener.onExit.mock.calls.length;

    unsub();
    expect(enterCalls).toBe(2);
    expect(exitCalls).toBe(2);
    expect(listener.onEnter.mock.calls[0][0]).toBe('countdown');
    expect(listener.onEnter.mock.calls[1][0]).toBe('cancelled');
  });

  it('deterministic transitions only — no undefined behavior', () => {
    const allEvents = [
      'START_COUNTDOWN', 'COUNTDOWN_TICK', 'COUNTDOWN_EXPIRED',
      'CONFIRM_EMERGENCY', 'CANCEL_EMERGENCY', 'SEND_STARTED',
      'SEND_SUCCESS', 'SEND_FAILED', 'ESCALATE', 'RESOLVE',
      'RECOVERY_TIMEOUT', 'FORCE_RESET',
    ] as const;

    for (const event of allEvents) {
      const result = sm.send(event);
      const valid = typeof result === 'boolean';
      expect(valid).toBe(true);
    }

    expect(sm.currentStatus).toBe('idle');
  });
});
