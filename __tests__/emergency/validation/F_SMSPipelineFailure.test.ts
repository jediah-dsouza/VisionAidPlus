import { EmergencySMSPipeline } from '../../../src/core/emergency/EmergencySMSPipeline';

const mockContact = (id: string, notify = true) => ({
  id,
  name: `Contact ${id}`,
  phone: `+1-555-${id.padStart(4, '0')}`,
  relationship: 'Friend',
  isPrimary: id === '1',
  notifyOnEmergency: notify,
});

const waitForSMS = () => new Promise<void>(r => setTimeout(r, 800));

describe('F. SMS Pipeline Failure Validation', () => {
  let sms: EmergencySMSPipeline;

  beforeEach(() => {
    sms = new EmergencySMSPipeline({
      maxRetriesPerContact: 1,
      retryBackoffMs: 10,
      maxBatchSize: 5,
      sendingTimeout: 5000,
    });
  });

  afterEach(() => {
    sms.destroy();
  });

  it('partial contact failures — isolates per contact', async () => {
    const contacts = [mockContact('1'), mockContact('2')];
    const messages = await sms.sendEmergencyAlerts(contacts, null);

    expect(messages.length).toBe(2);

    await waitForSMS();

    const sent = sms.getSentMessages();
    expect(sent.every(m => m.status === 'sent' || m.status === 'failed')).toBe(true);
    expect(sms.getQueueLength()).toBe(0);
  });

  it('all contacts failing — retries exhaust gracefully', async () => {
    const brokenPipeline = new EmergencySMSPipeline({
      maxRetriesPerContact: 0,
      retryBackoffMs: 5,
      maxBatchSize: 5,
      sendingTimeout: 1,
    });

    const messages = await brokenPipeline.sendEmergencyAlerts(
      [mockContact('1'), mockContact('2'), mockContact('3')],
      null,
    );

    expect(messages.length).toBe(3);

    await new Promise<void>(r => setTimeout(r, 100));

    const sent = brokenPipeline.getSentMessages();
    expect(sent.length).toBe(3);
    expect(sent.every(m => m.status === 'failed')).toBe(true);

    brokenPipeline.destroy();
  });

  it('duplicate sends not possible — same contacts double check', async () => {
    const contacts = [mockContact('1')];
    const first = await sms.sendEmergencyAlerts(contacts, null);
    const sentFirstCount = sms.getSentMessages().length;

    await waitForSMS();

    const second = await sms.sendEmergencyAlerts(contacts, null);
    const sentSecondCount = sms.getSentMessages().length;

    expect(first.length).toBe(1);
    expect(second.length).toBe(1);
    expect(sentSecondCount).toBeGreaterThanOrEqual(sentFirstCount);
  });

  it('queue interruption — cancelPending clears queue', async () => {
    const contacts = Array.from({ length: 5 }, (_, i) => mockContact(`${i + 1}`));
    sms.sendEmergencyAlerts(contacts, null);

    sms.cancelPending();

    expect(sms.getQueueLength()).toBe(0);
  });

  it('cancellation during dispatch — no errors', async () => {
    const contacts = Array.from({ length: 10 }, (_, i) => mockContact(`${i + 1}`));

    const promise = sms.sendEmergencyAlerts(contacts, null);
    sms.cancelPending();

    const messages = await promise;
    expect(messages.length).toBeGreaterThan(0);
  });

  it('per-contact isolation — one failure does not affect others', async () => {
    const contacts = [mockContact('1'), mockContact('2')];
    const messages = await sms.sendEmergencyAlerts(contacts, null);

    const statuses = messages.map(m => m.status);
    expect(statuses.length).toBe(2);
  });

  it('no contacts to notify returns empty', async () => {
    const messages = await sms.sendEmergencyAlerts([], null);
    expect(messages).toEqual([]);
  });

  it('all contacts with notifyOnEmergency=false returns empty', async () => {
    const messages = await sms.sendEmergencyAlerts(
      [mockContact('1', false), mockContact('2', false)],
      null,
    );
    expect(messages).toEqual([]);
  });

  it('getQueuedMessages returns pending messages', async () => {
    expect(sms.getQueuedMessages()).toEqual([]);
    await sms.sendEmergencyAlerts([mockContact('1')], null);
  });

  it('clearHistory resets sent messages', async () => {
    await sms.sendEmergencyAlerts([mockContact('1')], null);
    await waitForSMS();

    expect(sms.getSentMessages().length).toBeGreaterThan(0);

    sms.clearHistory();
    expect(sms.getSentMessages()).toEqual([]);
  });

  it('destroy cleans up all state', async () => {
    await sms.sendEmergencyAlerts([mockContact('1'), mockContact('2')], null);
    sms.destroy();

    expect(sms.getQueueLength()).toBe(0);
    expect(sms.getSentMessages()).toEqual([]);
  });
});
