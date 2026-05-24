import { emergencySlice, emergencyActions } from '../../src/app/store/slices/emergencySlice';

describe('emergencySlice', () => {
  const { reducer } = emergencySlice;

  it('returns initial state', () => {
    const state = reducer(undefined, { type: 'unknown' });
    expect(state.status).toBe('idle');
    expect(state.countdownRemaining).toBe(0);
    expect(state.contacts).toEqual([]);
    expect(state.history).toEqual([]);
    expect(state.contactsNotified).toBe(0);
  });

  it('startCountdown sets countdown state', () => {
    const state = reducer(undefined, emergencyActions.startCountdown(5));
    expect(state.status).toBe('countdown');
    expect(state.countdownRemaining).toBe(5);
    expect(state.countdownTotal).toBe(5);
    expect(state.lastUpdatedAt).toBeDefined();
  });

  it('updateCountdown updates remaining', () => {
    const s1 = reducer(undefined, emergencyActions.startCountdown(5));
    const s2 = reducer(s1, emergencyActions.updateCountdown(3));
    expect(s2.countdownRemaining).toBe(3);
  });

  it('triggerEmergency sets triggered state', () => {
    const state = reducer(undefined, emergencyActions.triggerEmergency({ sessionId: 'test-session' }));
    expect(state.status).toBe('triggered');
    expect(state.triggeredAt).toBeDefined();
    expect(state.sessionId).toBe('test-session');
  });

  it('setSending transitions to sending state', () => {
    const s1 = reducer(undefined, emergencyActions.triggerEmergency());
    const s2 = reducer(s1, emergencyActions.setSending());
    expect(s2.status).toBe('sending');
  });

  it('cancelEmergency transitions to cancelled', () => {
    const s1 = reducer(undefined, emergencyActions.startCountdown(5));
    const s2 = reducer(s1, emergencyActions.cancelEmergency());
    expect(s2.status).toBe('cancelled');
    expect(s2.cancelledAt).toBeDefined();
    expect(s2.countdownRemaining).toBe(0);
  });

  it('resolveEmergency transitions to resolved', () => {
    const s1 = reducer(undefined, emergencyActions.triggerEmergency());
    const s2 = reducer(s1, emergencyActions.resolveEmergency());
    expect(s2.status).toBe('resolved');
    expect(s2.resolvedAt).toBeDefined();
  });

  it('resetEmergency returns to idle', () => {
    const s1 = reducer(undefined, emergencyActions.triggerEmergency());
    const s2 = reducer(s1, emergencyActions.resetEmergency());
    expect(s2.status).toBe('idle');
    expect(s2.triggeredAt).toBeNull();
    expect(s2.countdownRemaining).toBe(0);
  });

  it('incrementContactsNotified adds to count', () => {
    const s1 = reducer(undefined, emergencyActions.incrementContactsNotified(3));
    expect(s1.contactsNotified).toBe(3);
    const s2 = reducer(s1, emergencyActions.incrementContactsNotified(2));
    expect(s2.contactsNotified).toBe(5);
  });

  it('tracks contacts', () => {
    const contact = { id: '1', name: 'Jane', phone: '+1-555-0100', relationship: 'Spouse', isPrimary: true, notifyOnEmergency: true };
    const s1 = reducer(undefined, emergencyActions.addContact(contact));
    expect(s1.contacts).toHaveLength(1);

    const s2 = reducer(s1, emergencyActions.removeContact('1'));
    expect(s2.contacts).toHaveLength(0);
  });

  it('adding primary contact demotes existing primaries', () => {
    const c1 = { id: '1', name: 'Jane', phone: '+1-555-0100', relationship: 'Spouse', isPrimary: true, notifyOnEmergency: true };
    const c2 = { id: '2', name: 'John', phone: '+1-555-0200', relationship: 'Friend', isPrimary: true, notifyOnEmergency: true };

    const s1 = reducer(undefined, emergencyActions.addContact(c1));
    const s2 = reducer(s1, emergencyActions.addContact(c2));

    expect(s2.contacts.find(c => c.id === '1')?.isPrimary).toBe(false);
    expect(s2.contacts.find(c => c.id === '2')?.isPrimary).toBe(true);
  });

  it('updateContact updates and handles primary', () => {
    const c1 = { id: '1', name: 'Jane', phone: '+1-555-0100', relationship: 'Spouse', isPrimary: true, notifyOnEmergency: true };
    const c2 = { id: '2', name: 'John', phone: '+1-555-0200', relationship: 'Friend', isPrimary: false, notifyOnEmergency: true };

    const s1 = reducer(undefined, emergencyActions.addContact(c1));
    const s2 = reducer(s1, emergencyActions.addContact(c2));
    const s3 = reducer(s2, emergencyActions.updateContact({ ...c2, isPrimary: true }));

    expect(s3.contacts.find(c => c.id === '1')?.isPrimary).toBe(false);
    expect(s3.contacts.find(c => c.id === '2')?.isPrimary).toBe(true);
  });

  it('saves session to history', () => {
    let state = reducer(undefined, emergencyActions.triggerEmergency({ sessionId: 'session-1' }));
    state = reducer(state, emergencyActions.incrementContactsNotified(3));
    state = reducer(state, emergencyActions.setSmsSent(3));
    state = reducer(state, emergencyActions.saveSessionToHistory());

    expect(state.history).toHaveLength(1);
    expect(state.history[0].id).toBe('session-1');
    expect(state.history[0].contactsNotified).toBe(3);
    expect(state.history[0].smsSent).toBe(3);
  });

  it('limits history to 20 entries', () => {
    let state = reducer(undefined, { type: 'unknown' });
    for (let i = 0; i < 25; i++) {
      state = reducer(state, emergencyActions.triggerEmergency({ sessionId: `s-${i}` }));
      state = reducer(state, emergencyActions.saveSessionToHistory());
      state = reducer(state, emergencyActions.resetEmergency());
    }
    expect(state.history.length).toBeLessThanOrEqual(20);
  });

  it('setGpsCoordinates stores location', () => {
    const state = reducer(undefined, emergencyActions.setGpsCoordinates({ latitude: 40.7128, longitude: -74.006 }));
    expect(state.gpsCoordinates).toEqual({ latitude: 40.7128, longitude: -74.006 });
  });

  it('setEscalationAttempts tracks', () => {
    const state = reducer(undefined, emergencyActions.setEscalationAttempts(2));
    expect(state.escalationAttempts).toBe(2);
  });

  it('setSmsSent/SetSmsFailed tracks', () => {
    const s1 = reducer(undefined, emergencyActions.setSmsSent(3));
    expect(s1.smsSent).toBe(3);
    const s2 = reducer(s1, emergencyActions.setSmsFailed(1));
    expect(s2.smsFailed).toBe(1);
  });

  it('clearHistory empties history', () => {
    const s1 = reducer(undefined, emergencyActions.triggerEmergency({ sessionId: 's-1' }));
    const s2 = reducer(s1, emergencyActions.saveSessionToHistory());
    const s3 = reducer(s2, emergencyActions.clearHistory());
    expect(s3.history).toEqual([]);
  });
});
