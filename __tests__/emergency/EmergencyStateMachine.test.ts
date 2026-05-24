import { EmergencyStateMachine } from '../../src/core/emergency/EmergencyStateMachine';

describe('EmergencyStateMachine', () => {
  let stateMachine: EmergencyStateMachine;

  beforeEach(() => {
    stateMachine = new EmergencyStateMachine();
  });

  afterEach(() => {
    stateMachine.destroy();
  });

  it('starts in idle state', () => {
    expect(stateMachine.currentStatus).toBe('idle');
    expect(stateMachine.isIdle).toBe(true);
    expect(stateMachine.isActive).toBe(false);
  });

  it('transitions from idle to countdown on START_COUNTDOWN', () => {
    const result = stateMachine.send('START_COUNTDOWN');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('countdown');
    expect(stateMachine.isActive).toBe(true);
  });

  it('transitions from countdown to triggered on COUNTDOWN_EXPIRED', () => {
    stateMachine.send('START_COUNTDOWN');
    const result = stateMachine.send('COUNTDOWN_EXPIRED');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('triggered');
    expect(stateMachine.isActive).toBe(true);
  });

  it('transitions from countdown to cancelled on CANCEL_EMERGENCY', () => {
    stateMachine.send('START_COUNTDOWN');
    const result = stateMachine.send('CANCEL_EMERGENCY');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('cancelled');
    expect(stateMachine.isActive).toBe(false);
  });

  it('transitions from triggered to cancelled', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    const result = stateMachine.send('CANCEL_EMERGENCY');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('cancelled');
  });

  it('transitions from triggered to sending on SEND_STARTED', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    const result = stateMachine.send('SEND_STARTED');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('sending');
  });

  it('transitions from sending to escalating on ESCALATE', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    stateMachine.send('SEND_STARTED');
    const result = stateMachine.send('ESCALATE');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('escalating');
  });

  it('transitions from escalating to resolved on RESOLVE', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    stateMachine.send('SEND_STARTED');
    stateMachine.send('ESCALATE');
    const result = stateMachine.send('RESOLVE');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('resolved');
  });

  it('transitions from resolved to idle on RECOVERY_TIMEOUT', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    stateMachine.send('RESOLVE');
    const result = stateMachine.send('RECOVERY_TIMEOUT');
    expect(result).toBe(true);
    expect(stateMachine.currentStatus).toBe('idle');
  });

  it('rejects invalid transitions', () => {
    expect(stateMachine.send('COUNTDOWN_EXPIRED')).toBe(false);
    expect(stateMachine.currentStatus).toBe('idle');
    expect(stateMachine.send('RESOLVE')).toBe(false);
    expect(stateMachine.send('SEND_STARTED')).toBe(false);
  });

  it('rejects CANCEL_EMERGENCY from idle', () => {
    expect(stateMachine.send('CANCEL_EMERGENCY')).toBe(false);
  });

  it('canTransition returns correct values', () => {
    expect(stateMachine.canTransition('START_COUNTDOWN')).toBe(true);
    expect(stateMachine.canTransition('COUNTDOWN_EXPIRED')).toBe(false);
    expect(stateMachine.canTransition('CANCEL_EMERGENCY')).toBe(false);
    expect(stateMachine.canTransition('FORCE_RESET')).toBe(true);

    stateMachine.send('START_COUNTDOWN');
    expect(stateMachine.canTransition('START_COUNTDOWN')).toBe(false);
    expect(stateMachine.canTransition('COUNTDOWN_EXPIRED')).toBe(true);
    expect(stateMachine.canTransition('CANCEL_EMERGENCY')).toBe(true);
  });

  it('FORCE_RESET works from any state', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    stateMachine.send('SEND_STARTED');

    expect(stateMachine.send('FORCE_RESET')).toBe(true);
    expect(stateMachine.currentStatus).toBe('idle');
  });

  it('calls onEnter listener on state change', () => {
    const onEnter = jest.fn();
    stateMachine.addListener({ onEnter });

    stateMachine.send('START_COUNTDOWN');
    expect(onEnter).toHaveBeenCalledWith('countdown', 'idle');
  });

  it('calls onExit listener on state change', () => {
    const onExit = jest.fn();
    stateMachine.addListener({ onExit });

    stateMachine.send('START_COUNTDOWN');
    expect(onExit).toHaveBeenCalledWith('idle', 'countdown');
  });

  it('supports removing listeners', () => {
    const onEnter = jest.fn();
    const remove = stateMachine.addListener({ onEnter });
    remove();

    stateMachine.send('START_COUNTDOWN');
    expect(onEnter).not.toHaveBeenCalled();
  });

  it('tracks transition history', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    stateMachine.send('RESOLVE');

    const history = stateMachine.transitionHistory;
    expect(history.length).toBe(3);
    expect(history[0].event).toBe('RESOLVE');
    expect(history[0].from).toBe('triggered');
    expect(history[0].to).toBe('resolved');
  });

  it('resets to idle', () => {
    stateMachine.send('START_COUNTDOWN');
    stateMachine.send('COUNTDOWN_EXPIRED');
    stateMachine.reset();

    expect(stateMachine.currentStatus).toBe('idle');
    expect(stateMachine.isActive).toBe(false);
    expect(stateMachine.transitionHistory.length).toBe(0);
  });
});
